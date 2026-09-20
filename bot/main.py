"""
Ponte entre o worker e o Telegram.

O worker (e o CI) mandam um POST em /notify com um corpo discriminado por
`type`; aqui isso vira uma mensagem formatada no chat.

Três coisas mudaram em relação à primeira versão, e vale saber por quê:

1. Um tipo novo agora entra em UM lugar. Antes a união `NotifyPayload`, o dict
   `models` e o dict `FORMATTERS` precisavam ser atualizados juntos, e esquecer
   um deles era silencioso. Hoje a união é validada por `TypeAdapter` com
   discriminador, então o Pydantic escolhe o modelo sozinho.

2. `worker-alert` existe. O `worker/lib/telegram.ts` manda esse tipo desde
   sempre, mas ele nunca esteve registrado aqui — todo alerta de worker tomava
   400 e morria em silêncio.

3. Um `AsyncClient` só, criado no lifespan. Antes cada notificação abria uma
   conexão nova, pagando handshake TLS toda vez.

4. O escape do MarkdownV2 é sensível ao contexto. A regra do Telegram muda
   conforme onde o texto cai, e usar o escape de texto puro nos outros dois
   contextos é o que fazia `worker\.job\_failed` aparecer literalmente, com as
   barras à mostra, e as URLs dos links saírem quebradas. Ver `escape`,
   `escape_code` e `escape_url`.
"""

import os
import re
import hmac
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Annotated, Literal, Optional, Union
from urllib.parse import quote

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, TypeAdapter, ValidationError

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

TELEGRAM_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT = os.environ["TELEGRAM_CHAT_ID"]
NOTIFY_SECRET = os.environ["NOTIFY_SECRET"]  # segredo compartilhado com o worker/CI

# Opcional: usado só para montar links clicáveis. Sem isso as mensagens
# continuam funcionando, só sem o atalho para o painel.
SITE_URL = os.environ.get("SITE_URL", "https://romulodm.dev").rstrip("/")

# As rotas do site são prefixadas por locale (`app/[locale]/...`). Sem o
# prefixo o link cai no redirect e perde a âncora do comentário.
SITE_LOCALE = os.environ.get("SITE_LOCALE", "pt").strip("/")

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"

# ── Modelos ───────────────────────────────────────────────────────────────────


class CommentPayload(BaseModel):
    type: Literal["comment"]
    id: str
    author: str
    postTitle: str
    postSlug: str


class ContactPayload(BaseModel):
    type: Literal["contact"]
    id: str
    name: str
    topic: str
    preview: str


class ContactFloodPayload(BaseModel):
    type: Literal["contact-flood"]
    max: int
    windowMinutes: int


class WorkerAlertPayload(BaseModel):
    type: Literal["worker-alert"]
    event: str
    message: str
    queue: Optional[str] = None
    jobId: Optional[str] = None
    environment: Optional[str] = None


class DailyStatusPayload(BaseModel):
    """
    Os números são sempre de UM dia de referência (ontem, no fuso do worker) —
    não de "hoje" no fuso onde este processo roda. Por isso `date` vem no
    payload: o cabeçalho carimbava `datetime.now()`, que no Render é UTC, e
    mostrava uma data que não era a dos dados.

    Os campos abaixo de `date` têm default porque foram adicionados depois: um
    worker de versão anterior continua passando na validação.
    """

    type: Literal["daily-status"]
    totalSubscribers: int
    newToday: int
    unsubscribedToday: int
    totalPosts: int
    totalViews: int
    viewsToday: int

    date: Optional[str] = None       # YYYY-MM-DD, dia de referência
    visitors: int = 0
    sessions: int = 0
    avgTimeSec: int = 0
    likes: int = 0
    comments: int = 0


class DeployPayload(BaseModel):
    type: Literal["deploy"]
    status: Literal["success", "failure"]
    branch: str
    actor: str
    commitSha: str
    commitMessage: str
    runUrl: str
    # O workflow faz staging e production com o mesmo job; sem isto as duas
    # mensagens ficam idênticas.
    environment: Optional[str] = None


NotifyPayload = Annotated[
    Union[
        CommentPayload,
        ContactPayload,
        ContactFloodPayload,
        WorkerAlertPayload,
        DailyStatusPayload,
        DeployPayload,
    ],
    Field(discriminator="type"),
]

# Valida e escolhe o modelo a partir do campo `type`, sem dict paralelo.
PAYLOAD_ADAPTER: TypeAdapter = TypeAdapter(NotifyPayload)

# ── Auth ──────────────────────────────────────────────────────────────────────

security = HTTPBearer()


def verify_secret(credentials: HTTPAuthorizationCredentials = Depends(security)) -> None:
    # `compare_digest` em vez de `==`: comparação em tempo constante, para o
    # tempo de resposta não vazar quantos caracteres do segredo bateram.
    if not hmac.compare_digest(credentials.credentials, NOTIFY_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Formatadores ──────────────────────────────────────────────────────────────

# O MarkdownV2 tem TRÊS conjuntos de reservados, não um. Escapar demais é tão
# quebrado quanto escapar de menos: fora do texto puro, uma barra invertida a
# mais não some — ela aparece na mensagem ou entra dentro da URL.
#
#   texto puro        -> todos os 18 reservados
#   dentro de `code`  -> apenas ` e \
#   dentro de (url)   -> apenas ) e \
#
# https://core.telegram.org/bots/api#markdownv2-style
MARKDOWN_V2_SPECIALS = re.compile(r"([_*\[\]()~`>#+\-=|{}.!\\])")
CODE_SPECIALS = re.compile(r"([`\\])")
LINK_URL_SPECIALS = re.compile(r"([)\\])")


def escape(text: str) -> str:
    """Texto puro: escapa os 18 reservados numa passada só."""
    return MARKDOWN_V2_SPECIALS.sub(r"\\\1", text)


def escape_code(text: str) -> str:
    """Conteúdo de um code span (entre crases)."""
    return CODE_SPECIALS.sub(r"\\\1", text)


def escape_url(url: str) -> str:
    """URL dentro do `(...)` de um link inline."""
    return LINK_URL_SPECIALS.sub(r"\\\1", url)


def clamp(text: str, limit: int) -> str:
    """
    Corta ANTES do escape, nunca depois.

    Cortar a string já escapada partiria um par `\\x` no meio ou deixaria uma
    entidade aberta, e aí o Telegram devolve 400 em vez de uma mensagem
    truncada. O teto de 4096 caracteres da API é por mensagem, e o escape chega
    a dobrar o tamanho de um texto cheio de pontuação.
    """
    return text if len(text) <= limit else text[:limit].rstrip() + "…"


# Tetos por campo de tamanho livre. Os demais (`preview`, `commitMessage`) já
# chegam cortados da origem.
ALERT_MESSAGE_MAX = 1200
POST_TITLE_MAX = 120


TOPIC_LABELS = {
    "FULL_TIME": "Vaga full-time",
    "FREELANCE": "Projeto freelance",
    "SAYING_HI": "Só um oi",
    "BUG_REPORT": "Report de bug",
    "OTHER": "Outro",
}


def fmt_comment(p: CommentPayload) -> str:
    # Era um caminho relativo em texto puro, que não dava para clicar. A âncora
    # leva direto ao comentário.
    link = escape_url(f"{SITE_URL}/{SITE_LOCALE}/blog/{p.postSlug}#{p.id}")

    return (
        f"💬 *Novo comentário*\n\n"
        f"👤 {escape(p.author)}\n"
        f"📝 {escape(clamp(p.postTitle, POST_TITLE_MAX))}\n\n"
        f"[Abrir o comentário]({link})"
    )


def fmt_contact(p: ContactPayload) -> str:
    topic = TOPIC_LABELS.get(p.topic, p.topic)
    # O `id` sempre veio no payload e nunca era usado: o link largava você na
    # caixa de entrada, com a mensagem em algum lugar da lista. Com ele na
    # querystring o painel abre o modal direto — inclusive se a mensagem já
    # tiver saído da primeira página ou do filtro que ficou salvo.
    link = escape_url(f"{SITE_URL}/{SITE_LOCALE}/admin/contact?message={quote(p.id)}")

    return (
        f"📬 *Nova mensagem de contato*\n\n"
        f"👤 {escape(p.name)}\n"
        f"🏷 {escape(topic)}\n\n"
        f"_{escape(p.preview)}_\n\n"
        f"[Abrir a mensagem]({link})"
    )


def fmt_contact_flood(p: ContactFloodPayload) -> str:
    return (
        f"🚨 *Teto do formulário de contato atingido*\n\n"
        f"Mais de *{p.max}* mensagens em {p.windowMinutes} minutos\\. "
        f"O endpoint está recusando novos envios até a janela virar\\.\n\n"
        f"Ou é ataque, ou algo seu viralizou\\. Vale olhar o painel\\."
    )


def fmt_worker_alert(p: WorkerAlertPayload) -> str:
    # `event`, `queue`, `jobId` e `environment` vão dentro de code spans: todos
    # carregam `.`, `_` ou `-`, e o escape de texto puro fazia cada um deles
    # aparecer como barra invertida na tela.
    lines = [
        f"⚠️ *Alerta do worker*\n",
        f"🔔 Evento: `{escape_code(p.event)}`",
        f"💬 {escape(clamp(p.message, ALERT_MESSAGE_MAX))}",
    ]
    if p.queue:
        lines.append(f"📥 Fila: `{escape_code(p.queue)}`")
    if p.jobId:
        lines.append(f"🆔 Job: `{escape_code(p.jobId)}`")
    if p.environment:
        lines.append(f"🌍 Ambiente: `{escape_code(p.environment)}`")

    return "\n".join(lines)


def ref_date_label(raw: Optional[str]) -> str:
    """Data de referência do payload em dd/mm/aaaa; cai no relógio local só se
    o worker for antigo e não mandar o campo."""
    if raw:
        try:
            return datetime.strptime(raw, "%Y-%m-%d").strftime("%d/%m/%Y")
        except ValueError:
            return raw
    return datetime.now().strftime("%d/%m/%Y")


def fmt_daily(p: DailyStatusPayload) -> str:
    trend = (
        "📈"
        if p.newToday > p.unsubscribedToday
        else "📉"
        if p.unsubscribedToday > p.newToday
        else "➡️"
    )
    date = escape(ref_date_label(p.date))
    minutes, seconds = divmod(max(p.avgTimeSec, 0), 60)

    # O `-` dentro do code span vai cru de propósito: ali dentro só ` e \
    # precisam de escape, e o `\\-` que estava aqui era uma barra invertida
    # solta — o caso que o Telegram trata como reservado não escapado.
    return (
        f"📊 *Status diário* — {date}\n\n"
        f"👥 Subscribers: *{p.totalSubscribers:,}*\n"
        f"{trend} No dia: `+{p.newToday}` / `-{p.unsubscribedToday}`\n\n"
        f"📄 Posts publicados: *{p.totalPosts:,}*\n"
        f"👁 Views acumuladas: *{p.totalViews:,}*\n\n"
        f"*No dia*\n"
        f"👁 Views: *{p.viewsToday:,}*\n"
        f"🧍 Visitantes: *{p.visitors:,}*\n"
        f"🔁 Sessões: *{p.sessions:,}*\n"
        f"⏱ Tempo médio: *{minutes}m {seconds:02d}s*\n"
        f"❤️ Likes: *{p.likes:,}*\n"
        f"💬 Comentários: *{p.comments:,}*"
    )


def fmt_deploy(p: DeployPayload) -> str:
    icon = "✅" if p.status == "success" else "❌"
    status = "Concluído" if p.status == "success" else "Falhou"
    where = f" — {escape(p.environment)}" if p.environment else ""
    # Só o assunto do commit: o corpo vem depois de uma linha em branco e
    # transformaria a mensagem num muro de texto.
    subject = clamp(p.commitMessage.splitlines()[0] if p.commitMessage else "", 80)

    return (
        f"{icon} *Deploy {status}*{where}\n\n"
        f"🌿 Branch: `{escape_code(p.branch)}`\n"
        f"👤 Por: {escape(p.actor)}\n"
        f"🔖 Commit: `{escape_code(p.commitSha[:7])}` — {escape(subject)}\n\n"
        f"[Ver no GitHub]({escape_url(p.runUrl)})"
    )


FORMATTERS = {
    "comment": fmt_comment,
    "contact": fmt_contact,
    "contact-flood": fmt_contact_flood,
    "worker-alert": fmt_worker_alert,
    "daily-status": fmt_daily,
    "deploy": fmt_deploy,
}

# ── Telegram sender ───────────────────────────────────────────────────────────

# Um client para o processo inteiro: reaproveita conexão e handshake TLS entre
# notificações. Criado e fechado no lifespan.
_client: Optional[httpx.AsyncClient] = None


async def send_telegram(text: str) -> None:
    if _client is None:
        raise RuntimeError("HTTP client não inicializado")

    r = await _client.post(
        f"{TELEGRAM_API}/sendMessage",
        json={
            "chat_id": TELEGRAM_CHAT,
            "text": text,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": True,
        },
    )
    # Propaga o erro de propósito: o worker traduz isso em job falho, e o BullMQ
    # tenta de novo (`notificationJobOptions.attempts = 3`). Engolir aqui
    # transformaria um 429 do Telegram em notificação perdida para sempre.
    r.raise_for_status()


# ── App ───────────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _client
    _client = httpx.AsyncClient(timeout=10)

    try:
        await send_telegram("🤖 Bot iniciado\\!")
    except Exception as exc:  # noqa: BLE001
        # Não derruba o boot: se o Telegram estiver fora no momento do deploy,
        # o serviço ainda precisa subir e responder o health check.
        print(f"[bot] aviso de boot falhou: {exc}")

    yield

    await _client.aclose()
    _client = None


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    return {"ok": True}


@app.head("/uptime")
async def uptime():
    return {"ok": True}


@app.post("/notify", dependencies=[Depends(verify_secret)])
async def notify(request: Request):
    body = await request.json()

    try:
        payload = PAYLOAD_ADAPTER.validate_python(body)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.errors(include_url=False)) from exc

    await send_telegram(FORMATTERS[payload.type](payload))
    return {"ok": True}

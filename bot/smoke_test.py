"""
Renderiza um exemplo de cada tipo de notificação e, opcionalmente, manda pro
Telegram de verdade.

Existe porque a spec do MarkdownV2 não dá pra conferir lendo: escapar de menos
devolve 400, escapar demais passa no 200 e chega no chat com barras invertidas
à mostra ou com a URL do link quebrada — os dois erram calados. O que resolve a
dúvida é o corpo da resposta do `sendMessage`: ele traz o `text` final já
renderizado e as `entities` que o Telegram reconheceu.

    cd telegram-bot
    python smoke_test.py            # só imprime o que seria enviado
    python smoke_test.py --send     # envia de verdade e mostra o que chegou

Usa o .env local (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Não sobe nada, não
depende do serviço no Render — fala direto com a API do Telegram, então testa o
formatador, não o deploy.
"""

import sys

import httpx

from main import FORMATTERS, PAYLOAD_ADAPTER, TELEGRAM_API, TELEGRAM_CHAT

# Valores escolhidos para carregar os caracteres que mais quebram: ponto e
# underscore no evento, hífen na fila e na branch, ponto na URL.
SAMPLES = [
    {
        "type": "comment",
        "id": "cmt_a1b2c3",
        "author": "maria_silva",
        "postTitle": "Rate limiting: 8 camadas (e o que sobrou)",
        "postSlug": "rate-limiting-8-camadas",
    },
    {
        "type": "contact",
        "id": "ctc_x9y8z7",
        "name": "João P. Medeiros",
        "topic": "FREELANCE",
        "preview": "Oi! Vi o teu post sobre BullMQ — a gente tem um projeto de ~3 meses.",
    },
    {"type": "contact-flood", "max": 500, "windowMinutes": 60},
    {
        "type": "worker-alert",
        "event": "worker.job_failed",
        "message": 'Telegram bot error 400: {"detail": [{"loc": ["body", "type"]}]}',
        "queue": "newsletter-transactional",
        "jobId": "notification:contact:cmf-123",
        "environment": "production",
    },
    {
        "type": "daily-status",
        "date": "2026-08-28",
        "totalSubscribers": 1234,
        "newToday": 7,
        "unsubscribedToday": 2,
        "totalPosts": 41,
        "totalViews": 128_540,
        "viewsToday": 1_902,
        "visitors": 843,
        "sessions": 1_017,
        "avgTimeSec": 185,
        "likes": 23,
        "comments": 5,
    },
    {
        "type": "deploy",
        "status": "success",
        "branch": "feat/contact-form",
        "actor": "romulodm",
        "commitSha": "3f9a1c4e8b2d7a6f5c0e1b9d8a7f6e5d4c3b2a19",
        "commitMessage": "fix(bot): escape sensível ao contexto no MarkdownV2\n\ncorpo ignorado",
        "runUrl": "https://github.com/romulodm/romulodm.dev/actions/runs/1234567890",
        "environment": "production",
    },
]


def send(text: str) -> None:
    r = httpx.post(
        f"{TELEGRAM_API}/sendMessage",
        json={
            "chat_id": TELEGRAM_CHAT,
            "text": text,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": True,
        },
        timeout=20,
    )

    if r.status_code != 200:
        print(f"  ❌ HTTP {r.status_code}: {r.text[:300]}")
        return

    result = r.json()["result"]
    final = result.get("text", "")

    # Se sobrou barra invertida no texto final, o escape passou do ponto.
    leftover = final.count("\\")
    print(f"  ✅ 200 — barras invertidas no texto renderizado: {leftover}")
    if leftover:
        print("     ⚠️  escape a mais em algum lugar; procure abaixo:")
        for line in final.splitlines():
            if "\\" in line:
                print(f"       {line!r}")

    # As entities dizem o que o Telegram de fato reconheceu. Um link cuja URL
    # veio com barra invertida aparece aqui com a barra dentro do `url`.
    for entity in result.get("entities", []):
        segment = final[entity["offset"]: entity["offset"] + entity["length"]]
        suffix = f"  ->  {entity['url']}" if entity.get("url") else ""
        print(f"     {entity['type']:<12} {segment!r}{suffix}")


def main_() -> int:
    should_send = "--send" in sys.argv

    for raw in SAMPLES:
        payload = PAYLOAD_ADAPTER.validate_python(raw)
        text = FORMATTERS[payload.type](payload)

        print(f"\n── {payload.type} " + "─" * (60 - len(payload.type)))
        print(text)

        if should_send:
            send(text)

    if not should_send:
        print("\n(rode com --send para enviar de verdade e ver o que o Telegram entendeu)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main_())

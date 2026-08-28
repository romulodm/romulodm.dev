/**
 * Cloudflare Turnstile — validação server-side.
 *
 * O widget no cliente devolve um token; este módulo troca esse token com a
 * Cloudflare por um veredito. Nunca confie no cliente dizer que passou.
 *
 * Duas propriedades vêm de graça da Cloudflare e são a razão de o Turnstile
 * servir contra `curl`/Postman:
 *
 *   - o token é de USO ÚNICO — um replay volta `timeout-or-duplicate`;
 *   - o token expira em 5 MINUTOS.
 *
 * Ou seja: para cada requisição o atacante precisa de um token novo, e para
 * ter um token novo precisa executar o desafio num ambiente de navegador de
 * verdade. Não torna o abuso impossível — torna caro, que é o que importa.
 *
 * Chaves de teste (funcionam em qualquer domínio, inclusive localhost):
 *   sitekey `1x00000000000000000000AA` + secret `1x0000000000000000000000000000000AA`
 *   sempre passam. Trocar o `2x...` correspondente faz sempre falhar.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Orçamento para a única chamada de rede do endpoint de contato. Acima disso a
 * Cloudflare não está saudável e não vale segurar o request do visitante.
 */
const VERIFY_TIMEOUT_MS = 5000;

export type TurnstileVerdict =
  | { ok: true }
  | { ok: false; reason: string };

interface SiteverifyResponse {
  success?: boolean;
  "error-codes"?: string[];
}

/**
 * Valida um token do Turnstile.
 *
 * FAIL CLOSED, de propósito: se a Cloudflare não responder dentro do orçamento,
 * ou se a secret não estiver configurada, a resposta é "não passou".
 *
 * Isso é o oposto do `rateLimit(..., "open")` usado em endpoints cosméticos, e
 * é a escolha certa aqui. Contato é baixo volume: perder uma mensagem legítima
 * num incidente raro custa muito menos do que deixar a porta escancarada
 * justamente no momento em que a defesa caiu.
 *
 * @param token Valor devolvido pelo widget (`cf-turnstile-response`).
 * @param ip    IP do visitante, já resolvido por `getRequestIp`.
 */
export async function verifyTurnstile(
  token: string,
  ip: string,
): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // Deploy sem a secret é erro de configuração, não de visitante. Loga alto
    // e recusa — o contrário deixaria o endpoint aberto sem ninguém notar.
    console.error("[Turnstile] TURNSTILE_SECRET_KEY ausente — recusando tudo.");
    return { ok: false, reason: "missing-secret" };
  }

  if (!token) {
    return { ok: false, reason: "missing-token" };
  }

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  // Opcional para a Cloudflare, mas melhora o sinal antifraude do lado deles.
  if (ip && ip !== "anonymous") body.append("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Turnstile] siteverify respondeu HTTP ${res.status}`);
      return { ok: false, reason: `http-${res.status}` };
    }

    const data = (await res.json()) as SiteverifyResponse;

    if (data.success === true) return { ok: true };

    const codes = data["error-codes"] ?? [];
    return { ok: false, reason: codes.join(",") || "rejected" };
  } catch (error) {
    // Timeout, DNS, TLS. Fail closed.
    console.warn("[Turnstile] siteverify indisponível:", error);
    return { ok: false, reason: "unreachable" };
  }
}

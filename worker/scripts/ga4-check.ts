/**
 * Diagnostico do GA4 Data API.
 *
 *   npm run ga4:check      // so o GA4
 *   npm run ga4:payload    // + o payload do daily-status (precisa do Postgres)
 *
 * Sao dois scripts em vez de uma flag encaminhada porque
 * `npm --prefix worker run ga4:check -- --payload` perde o argumento pelo
 * caminho: o npm resolve o `--` no contexto dele, nao no do script, e o `tsx`
 * recebe a linha sem a flag. Falha calada — roda, e simplesmente ignora.
 *
 * Por que existe: `getDailyStats` engole qualquer erro e devolve zeros. Em
 * producao isso esta certo — analytics nao pode derrubar a notificacao das
 * 08:00 — mas significa que "nao configurado", "credencial errada", "service
 * account sem acesso" e "o dia teve zero acesso mesmo" produzem exatamente a
 * mesma saida. Este script chama a versao que propaga (`fetchDailyStats`) e
 * traduz o erro para o passo que faltou.
 *
 * Roda com cwd em `worker/` — `env.ts` resolve o .env como `../.env`.
 */

import "../env";

import { dayRange, fetchDailyStats, getDailyStats, yesterdayDate } from "../lib/ga4";

const ok = (m: string) => console.log(`  \x1b[32mOK\x1b[0m     ${m}`);
const bad = (m: string) => console.log(`  \x1b[31mFALHA\x1b[0m  ${m}`);
const info = (m: string) => console.log(`         ${m}`);
const title = (m: string) => console.log(`\n\x1b[1m── ${m} ${"─".repeat(Math.max(0, 58 - m.length))}\x1b[0m`);

/** Traduz o erro cru do Google para o passo do setup que ficou pendente. */
function diagnose(message: string): string | null {
    const cases: Array<[RegExp, string]> = [
        [/has not been used in project|is disabled|SERVICE_DISABLED/i,
         "A Data API nao esta habilitada no projeto. Ative em:\n         https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com"],
        [/User does not have sufficient permissions|PERMISSION_DENIED/i,
         "A service account nao enxerga a property. Adicione o e-mail dela como\n         Leitor em Admin > Gerenciamento de acesso a propriedade do GA4."],
        [/NOT_FOUND|INVALID_ARGUMENT.*propert|property.*not found/i,
         "GA4_PROPERTY_ID errado. Tem que ser o numero da PROPRIEDADE (534315496),\n         nao o da conta (392422739) nem o measurement ID (G-...)."],
        [/DECODER routines|Invalid PEM|error:1E08010C|Bad control character/i,
         "A chave privada chegou corrompida. Quase sempre e aspas DUPLAS no\n         GOOGLE_SA_KEY: o dotenv expande o \\n antes do JSON.parse. Use aspas simples."],
        [/Could not load the default credentials|Unable to detect a Project Id/i,
         "Nenhuma credencial encontrada. Defina GOOGLE_SA_KEY, ou\n         GOOGLE_APPLICATION_CREDENTIALS, ou rode `gcloud auth application-default login`."],
        [/ENOENT|no such file/i,
         "GOOGLE_APPLICATION_CREDENTIALS aponta para um arquivo que nao existe.\n         Se voce roda o worker no docker dev, o path do Windows nao vale la dentro."],
    ];

    for (const [pattern, hint] of cases) if (pattern.test(message)) return hint;
    return null;
}

async function main() {
    // ── 1. Configuracao ───────────────────────────────────────────────────────
    title("Configuracao");

    const propertyId = process.env.GA4_PROPERTY_ID;
    if (propertyId) ok(`GA4_PROPERTY_ID = ${propertyId}`);
    else bad("GA4_PROPERTY_ID vazio — sem isso nem sai request.");

    const saKey = process.env.GOOGLE_SA_KEY;
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (saKey) {
        try {
            const parsed = JSON.parse(saKey) as { client_email?: string; project_id?: string };
            ok(`GOOGLE_SA_KEY parseia (${saKey.length} chars)`);
            info(`client_email: ${parsed.client_email ?? "(ausente)"}`);
            info(`project_id:   ${parsed.project_id ?? "(ausente)"}`);
            if (saKey.includes("\n")) {
                bad("A string tem quebra de linha real — provavelmente aspas duplas no .env.");
            }
        } catch (error) {
            bad(`GOOGLE_SA_KEY nao e JSON valido: ${(error as Error).message}`);
        }
    } else if (credPath) {
        const { existsSync } = await import("node:fs");
        if (existsSync(credPath)) ok(`GOOGLE_APPLICATION_CREDENTIALS -> ${credPath}`);
        else bad(`GOOGLE_APPLICATION_CREDENTIALS aponta para arquivo inexistente: ${credPath}`);
    } else {
        info("Sem GOOGLE_SA_KEY e sem GOOGLE_APPLICATION_CREDENTIALS.");
        info("Vai tentar o ADC da maquina (gcloud auth application-default login).");
    }

    // ── 2. Janela do dia ──────────────────────────────────────────────────────
    title("Janela do dia de referencia");

    const date = yesterdayDate();
    const { start, end } = dayRange(date);
    info(`TZ do processo: ${process.env.TZ ?? "(nao definido — o Node usa o do sistema)"}`);
    info(`Data GA4:       ${date}`);
    info(`Janela Prisma:  ${start.toISOString()}  ate  ${end.toISOString()}`);

    // ── 3. Chamada real ───────────────────────────────────────────────────────
    title("Chamada a Data API");

    let reachable = false;
    try {
        const stats = await fetchDailyStats(date);
        reachable = true;
        ok("A API respondeu.");
        info(`visitors ${stats.visitors} · pageviews ${stats.pageviews} · sessions ${stats.sessions} · avg ${stats.avgSessionDuration}s`);

        if (stats.pageviews === 0 && stats.visitors === 0) {
            info("");
            info("Zeros, mas de verdade: a credencial funciona e o GA4 respondeu 0");
            info(`para ${date}. Se o site teve acesso nesse dia, confira se a property`);
            info("do GA4_PROPERTY_ID e a mesma que recebe os hits do gtag.");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bad(message.split("\n")[0].slice(0, 200));

        const hint = diagnose(message);
        if (hint) {
            console.log("");
            info(hint);
        } else {
            console.log("");
            info("Erro nao mapeado — mensagem completa:");
            info(message.slice(0, 800));
        }
    }

    // ── 4. Caminho de producao ────────────────────────────────────────────────
    if (reachable) {
        title("Caminho de producao (getDailyStats, com o catch)");
        const same = await getDailyStats(date);
        ok(`Concorda com a chamada crua: pageviews ${same.pageviews}, visitors ${same.visitors}`);
    }

    // ── 5. Payload do daily-status ────────────────────────────────────────────
    if (process.argv.includes("--payload")) {
        title("Payload do daily-status (nao envia nada)");
        try {
            const { buildDailyStatus } = await import("../lib/telegram");
            console.log(JSON.stringify(await buildDailyStatus(), null, 2));
        } catch (error) {
            bad(`Nao consegui montar: ${(error as Error).message}`);
            info("Este passo consulta o Postgres — precisa do banco de pe e do DATABASE_URL.");
        }
    } else {
        console.log("\n(rode `npm run ga4:payload` para ver o payload completo do resumo diario)");
    }
}

// `process.exit` explicito: o cliente do Google mantem um canal gRPC aberto e
// o processo ficaria pendurado depois de imprimir tudo.
let failed = false;

main()
    .catch((error) => {
        console.error("\nga4-check falhou:", error);
        failed = true;
    })
    .finally(() => process.exit(failed ? 1 : 0));

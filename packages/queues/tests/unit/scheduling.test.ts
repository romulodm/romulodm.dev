/**
 * O que se prova aqui e o defeito que motivou o helper: o registro anterior
 * cortava em `existing.some(j => j.name === NAME)`, entao mudar o intervalo por
 * env nao surtia efeito nenhum — o cron antigo seguia gravado no Redis ate
 * alguem apagar na mao.
 *
 * A fila e falsificada porque o que importa e a decisao (registrar, reagendar,
 * nao mexer), nao o round-trip com o Redis.
 */
import { describe, expect, it } from "vitest";

import { registerRepeatable, type SchedulableQueue } from "../../src/scheduling";
import type { RepeatableJob } from "bullmq";

type Entry = RepeatableJob;

function fakeQueue(initial: Partial<Entry>[] = []) {
    const state = {
        repeatables: initial.map((e) => ({
            key: e.key ?? "",
            name: e.name ?? "",
            pattern: e.pattern ?? null,
            every: e.every ?? null,
            tz: e.tz ?? null,
            endDate: e.endDate ?? null,
        })) as Entry[],
        added: [] as { name: string; data: unknown }[],
        removed: [] as string[],
    };

    const queue: SchedulableQueue<{ type: string }> = {
        async getRepeatableJobs() {
            return state.repeatables;
        },
        async removeRepeatableByKey(key) {
            state.removed.push(key);
            state.repeatables = state.repeatables.filter((r) => r.key !== key);
            return true;
        },
        async add(name, data, opts) {
            const repeat = opts?.repeat ?? {};
            const pattern = "pattern" in repeat ? (repeat.pattern ?? null) : null;
            const every = "every" in repeat && repeat.every !== undefined ? String(repeat.every) : null;
            const tz = "tz" in repeat ? (repeat.tz ?? null) : null;
            const key = `${name}:${tz ?? ""}:${pattern ?? every}`;

            state.added.push({ name, data });
            // BullMQ faz upsert pela chave do repeatable — o fake precisa imitar,
            // senao o teste passaria por duplicata que na pratica nao existe.
            state.repeatables = state.repeatables
                .filter((r) => r.key !== key)
                .concat({ key, name, pattern, every, tz, endDate: null });
            return {};
        },
    };

    return { queue, state };
}

const RECONCILE = "reconcile-donations-cron";
const AUDIT = "audit-donations-cron";

describe("registerRepeatable", () => {
    it("registra na primeira vez", async () => {
        const { queue, state } = fakeQueue();

        const result = await registerRepeatable(queue, {
            name: RECONCILE,
            data: { type: "reconcile-donations" },
            repeat: { every: 300_000 },
        });

        expect(result.action).toBe("created");
        expect(state.added).toHaveLength(1);
    });

    it("nao duplica quando o worker reinicia com a mesma config", async () => {
        const { queue, state } = fakeQueue();
        const opts = {
            name: RECONCILE,
            data: { type: "reconcile-donations" },
            repeat: { every: 300_000 },
        };

        await registerRepeatable(queue, opts);
        const second = await registerRepeatable(queue, opts);

        expect(second.action).toBe("unchanged");
        expect(state.repeatables).toHaveLength(1);
        // A segunda passada nem chega a escrever.
        expect(state.added).toHaveLength(1);
    });

    it("reagenda quando o intervalo muda, removendo o cron antigo", async () => {
        const { queue, state } = fakeQueue();

        await registerRepeatable(queue, {
            name: RECONCILE,
            data: { type: "reconcile-donations" },
            repeat: { every: 300_000 },
        });

        const result = await registerRepeatable(queue, {
            name: RECONCILE,
            data: { type: "reconcile-donations" },
            repeat: { every: 60_000 },
        });

        expect(result.action).toBe("rescheduled");
        expect(state.removed).toHaveLength(1);
        // O ponto: sobra um cron so, e com o valor novo. Antes sobrava o velho.
        expect(state.repeatables).toHaveLength(1);
        expect(String(state.repeatables[0].every)).toBe("60000");
    });

    it("trata mudanca de fuso como reagendamento", async () => {
        const { queue, state } = fakeQueue();
        const base = { name: AUDIT, data: { type: "audit-donations" } };

        await registerRepeatable(queue, {
            ...base,
            repeat: { pattern: "30 8 * * *", tz: "America/Sao_Paulo" },
        });

        const unchanged = await registerRepeatable(queue, {
            ...base,
            repeat: { pattern: "30 8 * * *", tz: "America/Sao_Paulo" },
        });
        expect(unchanged.action).toBe("unchanged");

        const moved = await registerRepeatable(queue, {
            ...base,
            repeat: { pattern: "30 8 * * *", tz: "UTC" },
        });

        expect(moved.action).toBe("rescheduled");
        expect(state.repeatables).toHaveLength(1);
        expect(state.repeatables[0].tz).toBe("UTC");
    });

    it("nao encosta em cron de outro job", async () => {
        const { queue, state } = fakeQueue([
            { key: "outro:::1000", name: "outro-cron", every: "1000" },
        ]);

        await registerRepeatable(queue, {
            name: RECONCILE,
            data: { type: "reconcile-donations" },
            repeat: { every: 300_000 },
        });

        expect(state.removed).toHaveLength(0);
        expect(state.repeatables).toHaveLength(2);
    });

    it("limpa entrada obsoleta herdada do agendamento antigo", async () => {
        // Cenario do Redis em producao depois do bug: a config correta convivendo
        // com a de um intervalo anterior, as duas disparando.
        const { queue, state } = fakeQueue([
            { key: "r:::300000", name: RECONCILE, every: "300000" },
            { key: "r:::600000", name: RECONCILE, every: "600000" },
        ]);

        const result = await registerRepeatable(queue, {
            name: RECONCILE,
            data: { type: "reconcile-donations" },
            repeat: { every: 300_000 },
        });

        expect(result.action).toBe("rescheduled");
        expect(state.repeatables).toHaveLength(1);
        expect(String(state.repeatables[0].every)).toBe("300000");
        // A correta ja estava la — nao precisa reescrever.
        expect(state.added).toHaveLength(0);
    });
});

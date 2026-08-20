/**
 * Stub do pacote `server-only` para os testes.
 *
 * `server-only` existe para explodir em tempo de build quando um módulo de
 * servidor é importado por um Client Component: o `exports` do pacote só
 * resolve para um módulo vazio sob a condição `react-server`, e para um
 * `throw` em qualquer outro lugar. Vitest roda em Node puro, sem essa
 * condição, então importar direta ou indiretamente qualquer módulo com
 * `import "server-only"` (lib/views-internal.ts, lib/visitor.ts,
 * lib/status-cache.ts, ...) quebrava a suíte com
 * "This module cannot be imported from a Client Component module".
 *
 * O alias vive em `testing/vitest.shared.ts` e vale para unit e integration,
 * então nenhum arquivo de teste precisa mais de `vi.mock("server-only")`.
 * A checagem de verdade continua acontecendo no `next build`, que é onde ela
 * importa.
 */
export {};

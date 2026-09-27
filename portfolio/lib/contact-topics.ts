/**
 * Vocabulário do contato, em um módulo seguro para o cliente.
 *
 * Existe separado de `lib/contact.ts` por uma razão concreta: aquele arquivo
 * importa `node:crypto` e `zod`, e o formulário público não pode arrastar isso
 * para o bundle do navegador. Aqui só há constantes e tipos.
 *
 * Antes desta separação a lista de tópicos aparecia em três lugares — aqui, no
 * `ContactForm` e na página do admin. Agora é uma só.
 */

/**
 * Espelha o enum `ContactTopic` do Prisma.
 *
 * A duplicação é inevitável: o cliente precisa da lista para montar o
 * `<select>` e não pode importar o client do Prisma. O que ela NÃO é, é
 * silenciosa — `tests/unit/contact.test.ts` lê o `schema.prisma` e falha se
 * alguém adicionar um valor lá e esquecer daqui.
 */
export const CONTACT_TOPICS = [
  "FULL_TIME",
  "FREELANCE",
  "SAYING_HI",
  "BUG_REPORT",
  "OTHER",
] as const;

export type ContactTopicValue = (typeof CONTACT_TOPICS)[number];

/** Espelha o enum `ContactStatus` do Prisma. Mesmo guarda-corpo no teste. */
export const CONTACT_STATUSES = [
  "RECEIVED",
  "READ",
  "REPLIED",
  "CLOSED",
  "SPAM",
] as const;

export type ContactStatusValue = (typeof CONTACT_STATUSES)[number];

/**
 * Limites de tamanho.
 *
 * Precisam bater com os `@db.VarChar(...)` do `schema.prisma`. Divergir aqui
 * não produz erro de validação legível: produz erro do Postgres na hora do
 * insert. O teste unitário compara os dois.
 */
export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 160,
  messageMin: 10,
  messageMax: 2000,
  userAgentMax: 300,
} as const;

/** Recorte da mensagem que vai para a notificação do Telegram. */
export const CONTACT_PREVIEW_LENGTH = 180;

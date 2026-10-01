/**
 * highlight.js grammar for Prisma schema files. highlight.js ships none, and
 * several posts show excerpts of packages/database/prisma/schema.prisma.
 * Registered in lib/markdown.ts; fence the block with ```prisma to use it.
 */
import type { HLJSApi, Language } from 'highlight.js'

export default function prisma(hljs: HLJSApi): Language {
  return {
    name: 'Prisma',
    keywords: {
      keyword: 'model enum datasource generator',
      type: 'String Boolean Int BigInt Float Decimal DateTime Json Bytes Unsupported',
      literal: 'true false null',
      built_in: 'autoincrement cuid uuid now dbgenerated env auto',
    },
    contains: [
      // Covers both `//` and the `///` doc comments.
      hljs.C_LINE_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.NUMBER_MODE,
      // `model Post {` → keyword + class name. Anchored to column 0 because
      // `type` and `view` are also common field names inside a block.
      {
        match: [/^(?:model|enum|type|view|datasource|generator)\b/, /\s+/, /[A-Za-z_]\w*/],
        scope: { 1: 'keyword', 3: 'title.class' },
      },
      // Field and block attributes: @id, @default, @@unique, @db.VarChar
      { scope: 'meta', match: /@@?[A-Za-z_][\w.]*/ },
      // Relation types in PascalCase: `author User`, `posts Post[]`. The
      // lowercase second letter keeps ALL_CAPS enum values out.
      { scope: 'type', match: /\b[A-Z][a-z][A-Za-z0-9_]*\b/ },
    ],
  }
}

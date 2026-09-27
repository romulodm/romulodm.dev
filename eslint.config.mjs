// @ts-check
import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Flat config — obrigatorio a partir do ESLint 9. O projeto nunca teve ESLint
 * configurado: o script era `next lint`, removido no Next 16, e nao havia nem
 * `.eslintrc` nem o pacote `eslint` instalado.
 *
 * Extensao .mjs de proposito: o arquivo usa `import`, e o package.json da raiz
 * nao declara `"type": "module"`. Sem o .mjs o Node reinterpreta o arquivo a
 * cada execucao e avisa (MODULE_TYPELESS_PACKAGE_JSON). Declarar o type na raiz
 * resolveria tambem, mas mudaria a semantica de todo `.js` do repositorio —
 * incluindo next.config.js e postcss.config.js, que sao CommonJS.
 *
 * Postura: comecar permissivo. Um codebase grande que nunca passou por lint
 * acumula centenas de avisos, e um CI que nasce vermelho e um CI que as pessoas
 * aprendem a ignorar. Regra que aponta bug real e `error`; estilo e divida
 * tecnica ficam `warn`, para apertar depois uma por vez.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/prisma/migrations/**',
      // Saida do tsc emitida ao lado do fonte (packages/queues/index.js e
      // companhia). Lintar JavaScript gerado so produz ruido sobre helpers do
      // compilador que ninguem escreveu nem vai corrigir.
      'packages/*/index.js',
      'packages/*/*.js',
      'packages/**/*.js.map',
      // Minified MapLibre bundles copied out of node_modules by
      // portfolio/scripts/copy-maplibre-worker.mjs on predev/prebuild. Not
      // committed (see portfolio/.gitignore), so a fresh CI checkout never has
      // them, but any machine that has run `dev` or `build` does.
      'portfolio/public/maplibre/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Ambiente: quais globais existem ────────────────────────────────────────
  // Sem isto, `process`, `console`, `document` e afins viram "no-undef", que foi
  // a origem da maioria dos erros da primeira execucao.
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
      },
    },
  },

  // ── TypeScript ─────────────────────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // Import morto e lixo puro e seguro de remover — vale como erro.
      'unused-imports/no-unused-imports': 'error',

      // Delegado ao plugin acima, que distingue import de variavel.
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Divida tecnica real, mas corrigir tudo agora seria uma refatoracao
      // enorme. Fica visivel sem travar o pipeline.
      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },

  // ── Next.js e React ────────────────────────────────────────────────────────
  {
    files: ['portfolio/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
      // Precisa estar registrado mesmo sem regras ligadas: o codigo tem
      // comentarios `eslint-disable-next-line react/no-danger` e
      // `react/no-unknown-property`, e o ESLint erra ao encontrar disable de
      // regra cujo plugin nao existe.
      react: reactPlugin,
    },
    settings: {
      react: { version: 'detect' },
      // O plugin do Next procura `pages/` a partir da raiz do lint. Como o app
      // vive em portfolio/, sem isto ele avisa que nao encontrou o diretorio.
      next: { rootDir: 'portfolio/' },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Hook fora de ordem quebra em runtime de forma dificil de diagnosticar.
      // Foi esta regra que pegou o `useTranslations` num server component async.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // <img> em vez de next/image e escolha de performance, nao bug.
      '@next/next/no-img-element': 'warn',

      // Regra do Pages Router: ela varre `pages/` para saber quais rotas
      // existem e decidir se um <a> aponta para rota interna. Este projeto e
      // App Router e nao tem `pages/`, entao a regra dispara em duplicidade
      // (o mesmo <a> reportado 8 vezes) sem conseguir avaliar nada.
      //
      // Isso NAO significa que <a> para rota interna esta liberado — significa
      // que esta regra especifica nao consegue julgar. Os dois casos que ela
      // apontou foram avaliados na mao: Footer.tsx virou Link, e
      // global-error.tsx segue com <a> de proposito.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  // ── Arquivos CommonJS (configs do Next, PostCSS, Tailwind) ─────────────────
  {
    files: ['**/*.config.js', '**/*.config.cjs', '**/postcss.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ── Scripts, configs e infraestrutura de teste ─────────────────────────────
  {
    files: [
      '**/*.config.{mjs,ts}',
      '**/scripts/**/*.{js,mjs,ts}',
      'testing/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },

  // ── Sanitizacao precisa casar caractere de controle ────────────────────────
  {
    files: ['portfolio/lib/api-validation.ts', 'portfolio/lib/**/sanitize*.ts'],
    rules: {
      // O objetivo destes regex e justamente remover \x00-\x1f da entrada.
      // A regra existe para pegar controle acidental, nao intencional.
      'no-control-regex': 'off',
    },
  },

  // ── Testes ─────────────────────────────────────────────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    rules: {
      // Mock e fixture vivem de `any`; exigir tipagem ali gera ruido sem pegar bug.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)

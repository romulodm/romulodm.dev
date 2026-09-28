/**
 * Publica o worker do MapLibre em `public/maplibre/`.
 *
 * O PROBLEMA QUE ISTO RESOLVE
 *
 * Na v6 o worker deixou de ser embutido no bundle e virou arquivo proprio.
 * A lib descobre a URL dele em runtime, montando o nome por concatenacao:
 *
 *     const nome = url.endsWith('-dev.mjs')
 *       ? 'maplibre-gl-worker-dev.mjs'
 *       : 'maplibre-gl-worker.mjs';
 *     return new URL(nome, import.meta.url).href;
 *
 * O Turbopack nao consegue rastrear um `new URL()` cujo nome so existe em
 * runtime, entao resolve a referencia para o proprio modulo principal
 * (`maplibre-gl-dev.mjs`). A URL resultante nao aponta para worker nenhum, o
 * Next devolve a pagina 404 em `text/html` e o `new Worker(url, { type:
 * 'module' })` recusa por MIME.
 *
 * O sintoma e traicoeiro: o mapa SOBE — canvas, controles e marcador aparecem
 * normalmente — mas sem worker nenhum tile vetorial e parseado, e a
 * `style.json` nem chega a ser requisitada. Sobra a cor de fundo do estilo, que
 * no Dark Matter e quase preta e passa por "card vazio". E como o erro e do
 * worker e nao do mapa, `map.on('error')` nao dispara: o fallback do
 * LocationTile tambem nao entra.
 *
 * A saida que a propria doc da v6 recomenda para app empacotado e servir o
 * worker de um caminho estavel e informa-lo com `setWorkerUrl()`, que e o que o
 * LocationTile faz apontando para `/maplibre/maplibre-gl-worker.mjs`.
 *
 * OS DOIS ARQUIVOS PRECISAM IR JUNTOS
 *
 * `maplibre-gl-worker.mjs` faz `import ... from "./maplibre-gl-shared.mjs"` por
 * caminho relativo. Copiar so o worker deixa o import pendurado e a falha volta
 * identica, um nivel adiante.
 *
 * Roda no `predev` e no `prebuild`, entao um bump de versao do maplibre-gl
 * atualiza a copia sozinho — por isso `public/maplibre/` e gerado e fica no
 * .gitignore, em vez de virar vendor commitado que envelhece calado.
 */

import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Sempre a variante de producao, inclusive em dev: o par `-dev` so acrescenta
 * asserts internos, o protocolo de mensagens com a main thread e o mesmo, e
 * manter uma copia unica evita ter que escolher variante em runtime.
 */
const ARQUIVOS = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

const aqui = path.dirname(fileURLToPath(import.meta.url));
const destino = path.join(aqui, '..', 'public', 'maplibre');

await mkdir(destino, { recursive: true });

for (const nome of ARQUIVOS) {
  // `import.meta.resolve` respeita o campo `exports` do pacote e sobe a arvore
  // de node_modules sozinho — necessario aqui porque o npm workspaces iça o
  // maplibre-gl para a raiz do monorepo, fora de `portfolio/node_modules`.
  const origem = fileURLToPath(import.meta.resolve(`maplibre-gl/dist/${nome}`));
  await copyFile(origem, path.join(destino, nome));
}

console.log(`[maplibre] worker publicado em public/maplibre/ (${ARQUIVOS.join(', ')})`);

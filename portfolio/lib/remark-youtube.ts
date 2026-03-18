import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

function extractYoutubeId(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    )
    return match ? match[1] : null
}

/**
 * Pré-processa o markdown substituindo ::youtube[título](url) por um bloco
 * HTML comentado que sobrevive ao pipeline do remark/GFM sem ser interpretado
 * como link. A substituição acontece antes do parse, via transformação de texto.
 */
const remarkYoutube: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'html', (node: any) => {
            // Processa blocos HTML que já foram injetados pelo pre-processo
            // (não faz nada aqui — o trabalho real é no preprocessor abaixo)
        })
    }
}

/**
 * Use esta função para pré-processar o markdown ANTES de passar ao unified.
 * Substitui ::youtube[título](url) por um bloco <div> HTML raw que o
 * remark trata como html node, nunca como link.
 */
export function preprocessYoutube(markdown: string): string {
    return markdown.replace(
        /::youtube\[([^\]]*)\]\(([^)]+)\)/g,
        (_, title, url) => {
            const videoId = extractYoutubeId(url)
            if (!videoId) return _ // mantém original se URL inválida

            return `\n<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="${title || 'YouTube video'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`
        }
    )
}

export default remarkYoutube
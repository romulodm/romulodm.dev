function extractYoutubeId(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    )
    return match ? match[1] : null
}

/** Escapa caracteres especiais para uso seguro em atributos HTML. */
function escapeHtmlAttr(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
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

            const safeTitle = escapeHtmlAttr(title || 'YouTube video')
            return `\n<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="${safeTitle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`
        }
    )
}
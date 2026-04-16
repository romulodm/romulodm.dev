function extractYoutubeId(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    )
    return match ? match[1] : null
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
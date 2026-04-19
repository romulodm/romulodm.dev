const STOPWORDS = new Set([
    'a', 'as', 'o', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na',
    'nos', 'nas', 'por', 'para', 'com', 'que', 'é', 'se', 'não', 'mais', 'mas', 'ou',
    'ao', 'pelo', 'pela', 'esse', 'essa', 'este', 'esta', 'como', 'também', 'já',
    'the', 'is', 'it', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'this',
])

export class Preprocessor {
    tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .normalize('NFD')                          // separa acentos
            .replace(/[\u0300-\u036f]/g, '')           // remove acentos
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1 && !STOPWORDS.has(t))
    }

    // Para highlight: tokeniza sem remover stopwords
    tokenizeRaw(text: string): string[] {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1)
    }
}
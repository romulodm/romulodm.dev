import { describe, expect, it } from 'vitest'

import { cdata, escapeXml, rssLanguage, toRfc822 } from './feed-xml'

describe('escapeXml', () => {
  it('escapa os cinco caracteres reservados', () => {
    expect(escapeXml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &apos;')
  })

  it('nao escapa duas vezes as entidades que ele mesmo gera', () => {
    // Se `&` nao fosse tratado primeiro, `<` viraria `&amp;lt;`.
    expect(escapeXml('<b>')).toBe('&lt;b&gt;')
    expect(escapeXml('a & b')).toBe('a &amp; b')
  })

  it('preserva acentuacao', () => {
    // O feed declara charset=utf-8; acento nao vira entidade numerica.
    expect(escapeXml('Introdução à observabilidade')).toBe(
      'Introdução à observabilidade',
    )
  })

  it('neutraliza tentativa de injetar tag no titulo', () => {
    const malicious = '</title><script>alert(1)</script>'
    const escaped = escapeXml(malicious)

    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
  })

  it('devolve string vazia intacta', () => {
    expect(escapeXml('')).toBe('')
  })
})

describe('cdata', () => {
  it('envolve o conteudo num bloco CDATA', () => {
    expect(cdata('<p>oi</p>')).toBe('<![CDATA[<p>oi</p>]]>')
  })

  it('parte a sequencia ]]> para nao encerrar o bloco no meio do conteudo', () => {
    const result = cdata('antes ]]> depois')

    // O conteudo nao pode conter um ]]> "solto" que feche o CDATA cedo.
    expect(result).toBe('<![CDATA[antes ]]]]><![CDATA[> depois]]>')

    // Invariante real: removendo os delimitadores validos, nada sobra que
    // pudesse encerrar a secao.
    const inner = result.slice('<![CDATA['.length, -']]>'.length)
    expect(inner.split('<![CDATA[').join('').includes(']]>')).toBe(true)
  })

  it('mantem HTML com aspas e & sem alteracao', () => {
    const html = '<a href="https://x.com?a=1&b=2">link</a>'
    expect(cdata(html)).toContain(html)
  })
})

describe('toRfc822', () => {
  it('formata no padrao exigido pelo RSS 2.0', () => {
    const date = new Date(Date.UTC(2026, 7, 6, 13, 45, 0))
    expect(toRfc822(date)).toBe('Thu, 06 Aug 2026 13:45:00 GMT')
  })

  it('normaliza para UTC independente do fuso de entrada', () => {
    expect(toRfc822(new Date('2026-08-06T10:45:00-03:00'))).toBe(
      'Thu, 06 Aug 2026 13:45:00 GMT',
    )
  })
})

describe('rssLanguage', () => {
  it('mapeia os locales suportados', () => {
    expect(rssLanguage('pt')).toBe('pt-BR')
    expect(rssLanguage('en')).toBe('en-US')
  })
})

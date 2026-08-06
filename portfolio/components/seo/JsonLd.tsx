/**
 * Injeta um bloco <script type="application/ld+json">.
 *
 * O escape de `<` para < nao e cosmetico: sem ele, um titulo de post que
 * contenha "</script>" fecharia a tag e o resto viraria HTML executavel. Como
 * titulo e resumo vem do banco, o escape e obrigatorio.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data, (_key, value) =>
    value === undefined ? undefined : value,
  ).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
       
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

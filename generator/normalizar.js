export function normalizarUrl(url) {
  const u = new URL(url)
  u.hash = ''
  for (const chave of [...u.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid)$/.test(chave)) u.searchParams.delete(chave)
  }
  return u.toString().replace(/\/$/, '')
}

export function normalizar(colecao) {
  const vistas = new Set()
  const noticias = []
  for (const { fonte, itens } of colecao) {
    for (const n of itens.slice(0, fonte.max_noticias)) {
      const chave = normalizarUrl(n.url)
      if (vistas.has(chave)) continue
      vistas.add(chave)
      noticias.push(n)
    }
  }
  return noticias.sort((a, b) =>
    (b.publicada_em ?? '').localeCompare(a.publicada_em ?? '')
  )
}

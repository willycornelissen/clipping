import Parser from 'rss-parser'

export async function baixarTexto(url, fetchFn = fetch, timeoutMs = 20000) {
  const resp = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!resp.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${resp.status}`)
  }
  return resp.text()
}

export async function coletarRss(fonte, fetchFn = fetch) {
  const xml = await baixarTexto(fonte.url, fetchFn)
  const parser = new Parser()
  const feed = await parser.parseString(xml)
  return feed.items
    .map((item) => ({
      titulo: item.title?.trim() ?? '',
      url: item.link?.trim() ?? '',
      publicada_em: item.isoDate ?? null,
      conteudo: (item.contentSnippet || item.content || '').trim(),
      fonte: fonte.nome
    }))
    .filter((n) => n.titulo && n.url)
}

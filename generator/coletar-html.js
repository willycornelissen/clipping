import * as cheerio from 'cheerio'
import { baixarTexto } from './coletar-rss.js'

export async function coletarHtml(fonte, fetchFn = fetch) {
  const html = await baixarTexto(fonte.url, fetchFn)
  const $ = cheerio.load(html)
  const itens = []
  $(fonte.seletores.item).each((_, el) => {
    const titulo = $(el).find(fonte.seletores.titulo).first().text().trim()
    const href = $(el).find(fonte.seletores.link).first().attr('href')
    if (!titulo || !href) return
    let url
    try {
      url = new URL(href, fonte.url).href
    } catch {
      return
    }
    const $item = $(el).clone()
    $item.find('*').append(' ')
    itens.push({
      titulo,
      url,
      publicada_em: null,
      conteudo: $item.text().replace(/\s+/g, ' ').trim(),
      fonte: fonte.nome,
      assunto: fonte.assunto ?? null
    })
  })
  return itens
}

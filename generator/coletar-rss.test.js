import { describe, it, expect } from 'vitest'
import { coletarRss } from './coletar-rss.js'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Feed</title>
  <item><title>Primeira notícia</title><link>https://exemplo.com/n1</link>
    <pubDate>Thu, 20 Aug 2026 09:00:00 GMT</pubDate><description>Texto da primeira.</description></item>
  <item><title>Segunda notícia</title><link>https://exemplo.com/n2</link>
    <description>Texto da segunda.</description></item>
  <item><link>https://exemplo.com/sem-titulo</link></item>
  <item><title>Sem link</title></item>
</channel></rss>`

const fetchOk = async () => new Response(xml, { status: 200 })
const fonte = { id: 'ex', nome: 'Exemplo', tipo: 'rss', url: 'https://exemplo.com/rss', max_noticias: 5, ativo: true }

describe('coletarRss', () => {
  it('extrai título, link, data ISO e conteúdo dos itens', async () => {
    const noticias = await coletarRss(fonte, fetchOk)
    expect(noticias).toHaveLength(2)
    expect(noticias[0]).toEqual({
      titulo: 'Primeira notícia',
      url: 'https://exemplo.com/n1',
      publicada_em: '2026-08-20T09:00:00.000Z',
      conteudo: 'Texto da primeira.',
      fonte: 'Exemplo'
    })
    expect(noticias[1].publicada_em).toBeNull()
  })

  it('descarta itens sem título ou sem link', async () => {
    const noticias = await coletarRss(fonte, fetchOk)
    expect(noticias.find((n) => n.url.includes('sem-titulo'))).toBeUndefined()
    expect(noticias.find((n) => n.titulo === 'Sem link')).toBeUndefined()
  })

  it('lança erro quando a resposta não é ok', async () => {
    const fetchErro = async () => new Response('falhou', { status: 500 })
    await expect(coletarRss(fonte, fetchErro)).rejects.toThrow(/500/)
  })
})

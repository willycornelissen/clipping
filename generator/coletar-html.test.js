import { describe, it, expect } from 'vitest'
import { coletarHtml } from './coletar-html.js'

const html = `<html><body>
  <article class="noticia"><h2><a href="/politica/n1">Manchete um</a></h2><p>Lide da primeira.</p></article>
  <article class="noticia"><h2><a href="https://exemplo.com/n2">Manchete dois</a></h2></article>
  <article class="noticia"><h2>Sem link</h2></article>
  <article class="outra-coisa"><h2><a href="/x">Ignorar</a></h2></article>
</body></html>`

const fetchOk = async () => new Response(html, { status: 200 })
const fonte = {
  id: 'ex',
  nome: 'Exemplo',
  tipo: 'html',
  url: 'https://exemplo.com/noticias',
  max_noticias: 5,
  ativo: true,
  seletores: { item: 'article.noticia', titulo: 'h2 a', link: 'h2 a[href]' }
}

describe('coletarHtml', () => {
  it('extrai itens com seletores e resolve link relativo contra a url da fonte', async () => {
    const noticias = await coletarHtml(fonte, fetchOk)
    expect(noticias).toHaveLength(2)
    expect(noticias[0]).toEqual({
      titulo: 'Manchete um',
      url: 'https://exemplo.com/politica/n1',
      publicada_em: null,
      conteudo: 'Manchete um Lide da primeira.',
      fonte: 'Exemplo'
    })
    expect(noticias[1].url).toBe('https://exemplo.com/n2')
  })

  it('descarta itens fora do seletor ou sem link/título', async () => {
    const noticias = await coletarHtml(fonte, fetchOk)
    expect(noticias.find((n) => n.titulo === 'Sem link')).toBeUndefined()
    expect(noticias.find((n) => n.titulo === 'Ignorar')).toBeUndefined()
  })

  it('retorna lista vazia quando nenhum seletor casa (não lança)', async () => {
    const vazio = async () => new Response('<html><body><p>nada</p></body></html>', { status: 200 })
    const noticias = await coletarHtml(fonte, vazio)
    expect(noticias).toEqual([])
  })
})

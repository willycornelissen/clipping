import { describe, it, expect } from 'vitest'
import { normalizar, normalizarUrl } from './normalizar.js'

const fonte = (nome, max = 5) => ({ id: nome, nome, tipo: 'rss', url: `https://${nome}.com/`, max_noticias: max, ativo: true })
const noticia = (titulo, url, dia) => ({ titulo, url, publicada_em: dia, conteudo: 'x', fonte: 'F' })

describe('normalizarUrl', () => {
  it('remove utm_*, fbclid, gclid, hash e barra final', () => {
    const suja = 'https://exemplo.com/n1/?utm_source=rss&fbclid=abc&utm_medium=feed#topo'
    expect(normalizarUrl(suja)).toBe('https://exemplo.com/n1')
  })

  it('mantém parâmetros que não são de rastreamento', () => {
    expect(normalizarUrl('https://exemplo.com/n?id=7')).toBe('https://exemplo.com/n?id=7')
  })
})

describe('normalizar', () => {
  it('limita cada fonte ao max_noticias', () => {
    const itens = [1, 2, 3, 4].map((i) => noticia(`t${i}`, `https://a.com/${i}`, null))
    const resultado = normalizar([{ fonte: fonte('A', 2), itens }])
    expect(resultado).toHaveLength(2)
  })

  it('descarta duplicatas pela URL normalizada', () => {
    const a = [noticia('t1', 'https://a.com/n1/', null)]
    const b = [noticia('t1 repetida', 'https://a.com/n1?utm_source=x', null)]
    const resultado = normalizar([{ fonte: fonte('A'), itens: a }, { fonte: fonte('B'), itens: b }])
    expect(resultado).toHaveLength(1)
    expect(resultado[0].titulo).toBe('t1')
  })

  it('ordena por data decrescente com itens sem data no fim', () => {
    const itens = [
      noticia('sem-data', 'https://a.com/1', null),
      noticia('velha', 'https://a.com/2', '2026-08-18T10:00:00Z'),
      noticia('nova', 'https://a.com/3', '2026-08-20T10:00:00Z')
    ]
    const resultado = normalizar([{ fonte: fonte('A'), itens }])
    expect(resultado.map((n) => n.titulo)).toEqual(['nova', 'velha', 'sem-data'])
  })
})

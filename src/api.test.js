import { describe, it, expect, vi, afterEach } from 'vitest'
import { carregarIndice, carregarEdicao } from './api.js'

afterEach(() => vi.unstubAllGlobals())

describe('carregarIndice', () => {
  it('busca sem cache HTTP', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ edicoes: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await carregarIndice()
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: 'no-store' }))
  })

  it('retorna o índice parseado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ edicoes: [{ id: '2026-08-20', data: '2026-08-20', fontes: 1, noticias: 2 }] }), { status: 200 })
    ))
    const indice = await carregarIndice()
    expect(indice.edicoes[0].id).toBe('2026-08-20')
  })

  it('retorna null quando não existe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    expect(await carregarIndice()).toBeNull()
  })

  it('retorna null quando o JSON da resposta é inválido', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('não é json', { status: 200 })))
    expect(await carregarIndice()).toBeNull()
  })
})

describe('carregarEdicao', () => {
  it('retorna a edição pelo id', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ id: '2026-08-20', gerada_em: 'x', noticias: [] }), { status: 200 })
    ))
    const edicao = await carregarEdicao('2026-08-20')
    expect(edicao.id).toBe('2026-08-20')
  })

  it('retorna null para id inexistente', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    expect(await carregarEdicao('1999-01-01')).toBeNull()
  })
})

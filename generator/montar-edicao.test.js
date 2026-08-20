import { describe, it, expect } from 'vitest'
import { dataHoje, montarEdicao, atualizarIndice } from './montar-edicao.js'

describe('dataHoje', () => {
  it('usa o fuso America/Sao_Paulo (23h UTC = mesmo dia em Brasília)', () => {
    expect(dataHoje(new Date('2026-08-20T23:30:00Z'))).toBe('2026-08-20')
  })

  it('2h UTC do dia 21 ainda é dia 20 em Brasília', () => {
    expect(dataHoje(new Date('2026-08-21T02:30:00Z'))).toBe('2026-08-20')
  })
})

describe('montarEdicao', () => {
  it('monta o objeto da edição', () => {
    const noticias = [{ titulo: 't', fonte: 'F', url: 'https://a.com/1', publicada_em: null, resumo: 'r' }]
    const edicao = montarEdicao(noticias, { id: '2026-08-20', geradaEm: '2026-08-20T14:32:00Z' })
    expect(edicao).toEqual({
      id: '2026-08-20',
      gerada_em: '2026-08-20T14:32:00Z',
      noticias
    })
  })
})

describe('atualizarIndice', () => {
  const indiceAntigo = {
    edicoes: [{ id: '2026-08-19', data: '2026-08-19', fontes: 1, noticias: 3 }]
  }
  const edicao = {
    id: '2026-08-20',
    gerada_em: '2026-08-20T14:32:00Z',
    noticias: [
      { titulo: 't1', fonte: 'G1', url: 'https://a.com/1', publicada_em: null, resumo: 'r' },
      { titulo: 't2', fonte: 'G1', url: 'https://a.com/2', publicada_em: null, resumo: 'r' },
      { titulo: 't3', fonte: 'Folha', url: 'https://a.com/3', publicada_em: null, resumo: 'r' }
    ]
  }

  it('insere a nova edição no topo com contagem de fontes e notícias', () => {
    const indice = atualizarIndice(indiceAntigo, edicao)
    expect(indice.edicoes[0]).toEqual({ id: '2026-08-20', data: '2026-08-20', fontes: 2, noticias: 3 })
    expect(indice.edicoes).toHaveLength(2)
  })

  it('sobrescreve (upsert) edição do mesmo dia', () => {
    const nova = { ...edicao, noticias: edicao.noticias.slice(0, 1) }
    const indice = atualizarIndice(atualizarIndice(indiceAntigo, edicao), nova)
    expect(indice.edicoes).toHaveLength(2)
    expect(indice.edicoes[0].noticias).toBe(1)
  })

  it('funciona com índice vazio', () => {
    const indice = atualizarIndice({ edicoes: [] }, edicao)
    expect(indice.edicoes).toHaveLength(1)
  })
})

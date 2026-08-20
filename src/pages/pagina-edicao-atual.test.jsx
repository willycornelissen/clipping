// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaginaEdicaoAtual } from './PaginaEdicaoAtual.jsx'

afterEach(() => vi.unstubAllGlobals())

function renderizar() {
  return render(
    <MemoryRouter>
      <PaginaEdicaoAtual />
    </MemoryRouter>
  )
}

describe('PaginaEdicaoAtual', () => {
  it('mostra mensagem quando não há edições', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    renderizar()
    expect(await screen.findByText('Ainda não há edições publicadas.')).toBeInTheDocument()
  })

  it('carrega e exibe a edição mais recente agrupada por fonte', async () => {
    const indice = { edicoes: [{ id: '2026-08-20', data: '2026-08-20', fontes: 1, noticias: 1 }] }
    const edicao = {
      id: '2026-08-20',
      gerada_em: 'x',
      noticias: [{ titulo: 'T1', fonte: 'G1', url: 'https://a.com/1', publicada_em: null, resumo: 'R1' }]
    }
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const s = String(url)
      if (s.includes('index.json')) return new Response(JSON.stringify(indice), { status: 200 })
      return new Response(JSON.stringify(edicao), { status: 200 })
    }))
    renderizar()
    expect(await screen.findByText('T1')).toBeInTheDocument()
    expect(screen.getByText('G1', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText(/20\/08\/2026/)).toBeInTheDocument()
  })
})

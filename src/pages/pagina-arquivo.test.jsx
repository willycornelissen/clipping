// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaginaArquivo } from './PaginaArquivo.jsx'

afterEach(() => vi.unstubAllGlobals())

const gerarEdicoes = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `2026-08-${String(n - i).padStart(2, '0')}`,
    data: `2026-08-${String(n - i).padStart(2, '0')}`,
    fontes: 2,
    noticias: 10
  }))

function renderizar(rota = '/arquivo') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <PaginaArquivo />
    </MemoryRouter>
  )
}

describe('PaginaArquivo', () => {
  it('lista as edições do índice com data e contagem', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({
        edicoes: [
          { id: '2026-08-20', data: '2026-08-20', fontes: 2, noticias: 10 },
          { id: '2026-08-19', data: '2026-08-19', fontes: 2, noticias: 7 }
        ]
      }), { status: 200 })
    ))
    renderizar()
    expect(await screen.findByText(/20\/08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/19\/08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/10 notícias/)).toBeInTheDocument()
  })

  it('pagina em blocos de 20 e navega para a próxima página', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ edicoes: gerarEdicoes(22) }), { status: 200 })
    ))
    renderizar()
    expect(await screen.findByText(/21\/08\/2026/)).toBeInTheDocument()
    expect(screen.queryByText(/01\/08\/2026/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima →' })).toHaveAttribute('href', '/arquivo?pagina=2')
  })

  it('mostra mensagem quando não há edições', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    renderizar()
    expect(await screen.findByText('Ainda não há edições publicadas.')).toBeInTheDocument()
  })
})

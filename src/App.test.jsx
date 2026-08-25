// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

afterEach(() => vi.unstubAllGlobals())

const sourcesYml = `sources:
  - id: fonte-brasil
    nome: Fonte Brasil
    tipo: rss
    url: https://a.com/rss
    assunto: brasil
  - id: fonte-esporte
    nome: Fonte Esporte
    tipo: rss
    url: https://b.com/rss
    assunto: esporte
`

const edicao = {
  id: '2026-08-24',
  gerada_em: 'x',
  noticias: [
    { titulo: 'Manchete do Brasil', fonte: 'Fonte Brasil', url: 'https://a.com/1', publicada_em: null, resumo: 'R1' },
    { titulo: 'Manchete do Esporte', fonte: 'Fonte Esporte', url: 'https://b.com/1', publicada_em: null, resumo: 'R2' }
  ]
}

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const s = String(url)
    if (s.includes('index.json')) {
      return new Response(JSON.stringify({ edicoes: [{ id: '2026-08-24', data: '2026-08-24', fontes: 2, noticias: 2 }] }), { status: 200 })
    }
    if (s.includes('sources.yml')) return new Response(sourcesYml, { status: 200 })
    return new Response(JSON.stringify(edicao), { status: 200 })
  }))
}

describe('App', () => {
  it('mostra botões de assunto abaixo do menu e filtra ao clicar', async () => {
    stubFetch()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    const grupo = await screen.findByRole('group', { name: 'Filtrar por assunto' })
    for (const nome of ['Todas', 'Brasil', 'Mundo', 'Esporte', 'Tecnologia', 'Cultura', 'Ciência']) {
      expect(within(grupo).getByRole('button', { name: nome })).toBeInTheDocument()
    }

    expect(await screen.findByText('Manchete do Brasil')).toBeInTheDocument()
    expect(screen.getByText('Manchete do Esporte')).toBeInTheDocument()

    fireEvent.click(within(grupo).getByRole('button', { name: 'Esporte' }))
    expect(await screen.findByText('Manchete do Esporte')).toBeInTheDocument()
    expect(screen.queryByText('Manchete do Brasil')).not.toBeInTheDocument()

    fireEvent.click(within(grupo).getByRole('button', { name: 'Todas' }))
    expect(await screen.findByText('Manchete do Brasil')).toBeInTheDocument()
    expect(screen.getByText('Manchete do Esporte')).toBeInTheDocument()
  })
})

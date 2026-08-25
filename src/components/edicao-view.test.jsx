// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EdicaoView } from './EdicaoView.jsx'

const fontes = [
  { id: 'google-news-brasil', nome: 'Google News Brasil', assunto: 'brasil' },
  { id: 'google-news-esporte', nome: 'Google News Esporte', assunto: 'esporte' },
  { id: 'jovem-pan', nome: 'Jovem Pan' }
]

const edicao = {
  id: '2026-08-24',
  gerada_em: 'x',
  noticias: [
    { titulo: 'Notícia de esporte', fonte: 'Google News Esporte', url: 'https://a.com/2', publicada_em: null, resumo: 'R2' },
    { titulo: 'Notícia sem assunto', fonte: 'Jovem Pan', url: 'https://a.com/3', publicada_em: null, resumo: 'R3' },
    { titulo: 'Notícia do Brasil', fonte: 'Google News Brasil', url: 'https://a.com/1', publicada_em: null, resumo: 'R1' }
  ]
}

function renderizar(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/${query}`]}>
      <EdicaoView edicao={edicao} fontes={fontes} />
    </MemoryRouter>
  )
}

describe('EdicaoView', () => {
  it('agrupa notícias por assunto na ordem canônica, com Geral ao final', () => {
    renderizar()
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titulos).toEqual(['Brasil', 'Esporte', 'Geral'])
    expect(screen.getByText('Notícia do Brasil')).toBeInTheDocument()
    expect(screen.getByText('Notícia de esporte')).toBeInTheDocument()
    expect(screen.getByText('Notícia sem assunto')).toBeInTheDocument()
    expect(screen.getByText('Exibindo:')).toBeInTheDocument()
  })

  it('filtra notícias pelo assunto da URL', () => {
    renderizar('?assunto=esporte')
    expect(screen.getByRole('heading', { level: 2, name: 'Esporte' })).toBeInTheDocument()
    expect(screen.getByText('Notícia de esporte')).toBeInTheDocument()
    expect(screen.queryByText('Notícia do Brasil')).not.toBeInTheDocument()
    expect(screen.queryByText('Notícia sem assunto')).not.toBeInTheDocument()
  })

  it('mostra mensagem quando o assunto não tem notícias', () => {
    renderizar('?assunto=ciencia')
    expect(screen.getByText('Nenhuma notícia para este assunto.')).toBeInTheDocument()
  })
})

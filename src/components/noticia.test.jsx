// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Noticia } from './Noticia.jsx'

const noticia = {
  titulo: 'Manchete de teste',
  fonte: 'G1',
  url: 'https://g1.globo.com/n1',
  publicada_em: '2026-08-20T09:00:00Z',
  resumo: 'Resumo em duas frases. Segunda frase.'
}

describe('Noticia', () => {
  it('renderiza título como link externo em nova aba', () => {
    render(<Noticia noticia={noticia} />)
    const link = screen.getByRole('link', { name: 'Manchete de teste' })
    expect(link).toHaveAttribute('href', 'https://g1.globo.com/n1')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renderiza resumo, fonte e horário', () => {
    render(<Noticia noticia={noticia} />)
    expect(screen.getByText('Resumo em duas frases. Segunda frase.')).toBeInTheDocument()
    expect(screen.getByText(/G1/)).toBeInTheDocument()
  })
})

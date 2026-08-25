import { describe, it, expect } from 'vitest'
import { ASSUNTOS, obterAssuntoDaNoticia } from './fontes.js'

describe('ASSUNTOS', () => {
  it('contém os seis assuntos na ordem canônica', () => {
    expect(ASSUNTOS).toEqual([
      { id: 'brasil', nome: 'Brasil' },
      { id: 'mundo', nome: 'Mundo' },
      { id: 'esporte', nome: 'Esporte' },
      { id: 'tecnologia', nome: 'Tecnologia' },
      { id: 'cultura', nome: 'Cultura' },
      { id: 'ciencia', nome: 'Ciência' }
    ])
  })
})

describe('obterAssuntoDaNoticia', () => {
  const fontes = [
    { id: 'google-news-brasil', nome: 'Google News Brasil', assunto: 'brasil' },
    { id: 'gazeta-mundo', nome: 'Gazeta do Povo - Mundo', assunto: 'mundo' }
  ]

  it('retorna o assunto da fonte correspondente ao nome', () => {
    const noticia = { titulo: 'T', fonte: 'Gazeta do Povo - Mundo', url: 'https://a.com/1' }
    expect(obterAssuntoDaNoticia(noticia, fontes)).toEqual({ id: 'mundo', nome: 'Mundo' })
  })

  it('retorna null quando a fonte não está na lista', () => {
    const noticia = { titulo: 'T', fonte: 'Desconhecida', url: 'https://a.com/2' }
    expect(obterAssuntoDaNoticia(noticia, fontes)).toBeNull()
  })

  it('retorna null quando a fonte não tem assunto', () => {
    const semAssunto = [...fontes, { id: 'jovem-pan', nome: 'Jovem Pan' }]
    const noticia = { titulo: 'T', fonte: 'Jovem Pan', url: 'https://a.com/3' }
    expect(obterAssuntoDaNoticia(noticia, semAssunto)).toBeNull()
  })

  it('retorna null quando o assunto não é um dos canônicos', () => {
    const invalido = [{ id: 'x', nome: 'X', assunto: 'fofoca' }]
    const noticia = { titulo: 'T', fonte: 'X', url: 'https://a.com/4' }
    expect(obterAssuntoDaNoticia(noticia, invalido)).toBeNull()
  })
})

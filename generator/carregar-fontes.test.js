import { describe, it, expect } from 'vitest'
import { validarFontes } from './carregar-fontes.js'

const yamlBasico = `
sources:
  - id: g1
    nome: G1
    tipo: rss
    url: https://g1.globo.com/rss/g1/
`

describe('validarFontes', () => {
  it('aplica defaults: max_noticias 5 e ativo true', () => {
    const [fonte] = validarFontes(yamlBasico)
    expect(fonte.max_noticias).toBe(5)
    expect(fonte.ativo).toBe(true)
  })

  it('rejeita tipo que não seja rss nem html', () => {
    const yaml = yamlBasico.replace('tipo: rss', 'tipo: api')
    expect(() => validarFontes(yaml)).toThrow(/tipo/)
  })

  it('rejeita fonte html sem seletores', () => {
    const yaml = `${yamlBasico}
  - id: p
    nome: Portal
    tipo: html
    url: https://exemplo.com/
`
    expect(() => validarFontes(yaml)).toThrow(/seletores/)
  })

  it('rejeita ids duplicados', () => {
    const yaml = `${yamlBasico}
  - id: g1
    nome: G1 de novo
    tipo: rss
    url: https://outro-feed.com/
`
    expect(() => validarFontes(yaml)).toThrow(/id/)
  })

  it('rejeita url ausente ou sem http(s)', () => {
    const semUrl = `
sources:
  - id: a
    nome: A
    tipo: rss
`
    expect(() => validarFontes(semUrl)).toThrow(/url/)
    const urlInvalida = `
sources:
  - id: a
    nome: A
    tipo: rss
    url: ftp://x.com/
`
    expect(() => validarFontes(urlInvalida)).toThrow(/url/)
  })
})

import { describe, it, expect } from 'vitest'
import { formatarDataHora, formatarData, caminhoRelativo } from './formatar.js'

describe('formatarDataHora', () => {
  it('formata ISO como dd/mm/aaaa hh:mm', () => {
    expect(formatarDataHora('2026-08-20T09:00:00Z')).toMatch(/^20\/08\/2026 \d{2}:\d{2}$/)
  })
  it('retorna vazio para null ou data inválida', () => {
    expect(formatarDataHora(null)).toBe('')
    expect(formatarDataHora('lixo')).toBe('')
  })
})

describe('formatarData', () => {
  it('converte YYYY-MM-DD em DD/MM/AAAA', () => {
    expect(formatarData('2026-08-20')).toBe('20/08/2026')
  })
})

describe('caminhoRelativo', () => {
  it('remove o prefixo do base path', () => {
    expect(caminhoRelativo('/clipping/arquivo?pagina=2', '/clipping/')).toBe('/arquivo?pagina=2')
  })
  it('mantém caminho quando não há prefixo', () => {
    expect(caminhoRelativo('/arquivo', '/')).toBe('/arquivo')
  })
  it('raiz volta para /', () => {
    expect(caminhoRelativo('/', '/')).toBe('/')
    expect(caminhoRelativo('/clipping/', '/clipping/')).toBe('/')
  })
})

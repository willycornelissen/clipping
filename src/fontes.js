import { base } from './api.js'

export const ASSUNTOS = [
  { id: 'brasil', nome: 'Brasil' },
  { id: 'mundo', nome: 'Mundo' },
  { id: 'esporte', nome: 'Esporte' },
  { id: 'tecnologia', nome: 'Tecnologia' },
  { id: 'cultura', nome: 'Cultura' },
  { id: 'ciencia', nome: 'Ciência' }
]

let fontesCache = null

export async function carregarFontes() {
  if (fontesCache) return fontesCache
  try {
    const resp = await fetch(`${base}data/sources.yml`, { cache: 'no-store' })
    if (!resp.ok) return []
    const yaml = await import('yaml')
    const dados = yaml.parse(await resp.text())
    fontesCache = dados.sources ?? []
    return fontesCache
  } catch {
    return []
  }
}

export function obterAssuntoDaNoticia(noticia, fontes) {
  const fonte = fontes.find((f) => f.nome === noticia.fonte)
  return ASSUNTOS.find((a) => a.id === fonte?.assunto) ?? null
}

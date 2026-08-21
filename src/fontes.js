import { base } from './api.js'

let fontesCache = null

export async function carregarFontes() {
  if (fontesCache) return fontesCache
  try {
    const resp = await fetch(`${base}data/sources.yml`)
    if (!resp.ok) return []
    const yaml = await import('yaml')
    const dados = yaml.parse(await resp.text())
    fontesCache = dados.sources ?? []
    return fontesCache
  } catch {
    return []
  }
}

export function extrairCategoria(fonteId) {
  const partes = fonteId.split('-')
  if (partes.length < 2) return 'Geral'
  const categoria = partes.slice(1).join('-')
  return categoria
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function agruparPorFonteECategoria(fontes) {
  const mapa = new Map()
  for (const f of fontes) {
    const categoria = extrairCategoria(f.id)
    if (!mapa.has(f.nome)) mapa.set(f.nome, new Set())
    mapa.get(f.nome).add(categoria)
  }
  const resultado = {}
  for (const [fonte, cats] of mapa.entries()) {
    resultado[fonte] = [...cats].sort()
  }
  return resultado
}

export function obterCategoriaDaNoticia(noticia, fontes) {
  const fonte = fontes.find((f) => f.nome === noticia.fonte)
  return fonte ? extrairCategoria(fonte.id) : 'Geral'
}
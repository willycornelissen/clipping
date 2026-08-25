import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

export function validarFontes(texto) {
  const dados = parse(texto)
  const fontes = dados?.sources
  if (!Array.isArray(fontes) || fontes.length === 0) {
    throw new Error('sources.yml deve conter uma lista "sources" com ao menos uma fonte.')
  }
  const vistos = new Set()
  return fontes.map((f) => {
    for (const campo of ['id', 'nome', 'tipo', 'url']) {
      if (!f[campo]) throw new Error(`Fonte "${f.nome ?? f.id ?? '?'}": campo obrigatório "${campo}" ausente.`)
    }
    if (vistos.has(f.id)) throw new Error(`id duplicado: "${f.id}"`)
    vistos.add(f.id)
    if (f.tipo !== 'rss' && f.tipo !== 'html') {
      throw new Error(`Fonte "${f.nome}": tipo deve ser "rss" ou "html".`)
    }
    if (!/^https?:\/\//.test(f.url)) {
      throw new Error(`Fonte "${f.nome}": url deve começar com http:// ou https://.`)
    }
    const fonte = {
      id: f.id,
      nome: f.nome,
      tipo: f.tipo,
      url: f.url,
      max_noticias: f.max_noticias ?? 5,
      ativo: f.ativo ?? true
    }
    if (f.assunto) fonte.assunto = f.assunto
    if (f.tipo === 'html') {
      const sel = f.seletores
      if (!sel?.item || !sel?.titulo || !sel?.link) {
        throw new Error(`Fonte "${f.nome}": fontes tipo html exigem seletores { item, titulo, link }.`)
      }
      fonte.seletores = { item: sel.item, titulo: sel.titulo, link: sel.link }
    }
    return fonte
  })
}

export function carregarFontes(caminho = 'data/sources.yml') {
  return validarFontes(readFileSync(caminho, 'utf8'))
}

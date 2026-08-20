import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carregarFontes } from './carregar-fontes.js'
import { coletarRss } from './coletar-rss.js'
import { coletarHtml } from './coletar-html.js'
import { normalizar } from './normalizar.js'
import { resumir } from './resumir.js'
import { dataHoje, montarEdicao, atualizarIndice } from './montar-edicao.js'

async function coletar(fonte, fetchFn) {
  return fonte.tipo === 'rss' ? coletarRss(fonte, fetchFn) : coletarHtml(fonte, fetchFn)
}

function lerIndice(dirSaida) {
  const caminho = join(dirSaida, 'index.json')
  if (!existsSync(caminho)) return { edicoes: [] }
  return JSON.parse(readFileSync(caminho, 'utf8'))
}

export async function gerarEdicao({ fontes, config, fetchFn = fetch, agora = new Date(), dirSaida = 'data/editions' }) {
  const colecao = []
  for (const fonte of fontes.filter((f) => f.ativo)) {
    try {
      const itens = await coletar(fonte, fetchFn)
      colecao.push({ fonte, itens })
    } catch (erro) {
      console.warn(`[aviso] fonte "${fonte.nome}" falhou: ${erro.message}`)
    }
  }
  const noticias = normalizar(colecao)
  if (noticias.length === 0) {
    throw new Error('Nenhuma notícia coletada — edição não gerada.')
  }
  const resumidas = await resumir(noticias, config, fetchFn)
  const id = dataHoje(agora)
  const edicao = montarEdicao(resumidas, { id, geradaEm: agora.toISOString() })
  const indice = atualizarIndice(lerIndice(dirSaida), edicao)
  mkdirSync(dirSaida, { recursive: true })
  writeFileSync(join(dirSaida, `${id}.json`), JSON.stringify(edicao, null, 2))
  writeFileSync(join(dirSaida, 'index.json'), JSON.stringify(indice, null, 2))
  return edicao
}

const ehCli = process.argv[1] && process.argv[1].endsWith('gerar.js')
if (ehCli) {
  const config = {
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY
  }
  if (!config.baseUrl || !config.model || !config.apiKey) {
    console.error('Configure LLM_BASE_URL e LLM_MODEL (repo variables) e LLM_API_KEY (repo secret).')
    process.exit(1)
  }
  gerarEdicao({ fontes: carregarFontes(), config })
    .then((edicao) => console.log(`Edição ${edicao.id} gerada com ${edicao.noticias.length} notícias.`))
    .catch((erro) => {
      console.error(erro.message)
      process.exit(1)
    })
}

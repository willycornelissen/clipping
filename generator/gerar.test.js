import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gerarEdicao } from './gerar.js'

const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>F</title>
  <item><title>N1</title><link>https://a.com/1</link><description>Texto 1.</description></item>
  <item><title>N2</title><link>https://a.com/2</link><description>Texto 2.</description></item>
</channel></rss>`

const respostaLlm = () =>
  new Response(JSON.stringify({ choices: [{ message: { content: 'Resumo LLM.' } }] }), { status: 200 })

const config = { baseUrl: 'https://llm.exemplo.com/v1', model: 'm', apiKey: 'k' }
const fonteOk = { id: 'a', nome: 'Fonte A', tipo: 'rss', url: 'https://a.com/rss', max_noticias: 5, ativo: true }
const fonteQuebrada = { id: 'b', nome: 'Fonte B', tipo: 'rss', url: 'https://b.com/rss', max_noticias: 5, ativo: true }
const fonteInativa = { id: 'c', nome: 'Fonte C', tipo: 'rss', url: 'https://c.com/rss', max_noticias: 5, ativo: false }

function dirTemp() {
  return mkdtempSync(join(tmpdir(), 'belmont-test-'))
}

describe('gerarEdicao', () => {
  it('gera edição completa e grava os dois arquivos JSON', async () => {
    const dir = dirTemp()
    const fetchFn = async (url) =>
      String(url).startsWith('https://a.com') ? new Response(xml, { status: 200 }) : respostaLlm()
    const edicao = await gerarEdicao({
      fontes: [fonteOk],
      config,
      fetchFn,
      agora: new Date('2026-08-20T14:00:00Z'),
      dirSaida: dir
    })
    expect(edicao.id).toBe('2026-08-20')
    expect(edicao.noticias[0].resumo).toBe('Resumo LLM.')
    const salvo = JSON.parse(readFileSync(join(dir, '2026-08-20.json'), 'utf8'))
    expect(salvo.noticias).toHaveLength(2)
    const indice = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
    expect(indice.edicoes[0]).toEqual({ id: '2026-08-20', data: '2026-08-20', fontes: 1, noticias: 2 })
    rmSync(dir, { recursive: true, force: true })
  })

  it('pula fonte quebrada e fonte inativa, mas gera a edição com as demais', async () => {
    const dir = dirTemp()
    const avisos = []
    const warnOriginal = console.warn
    console.warn = (msg) => avisos.push(msg)
    const fetchFn = async (url) => {
      const s = String(url)
      if (s.startsWith('https://b.com')) return new Response('erro', { status: 500 })
      if (s.startsWith('https://a.com')) return new Response(xml, { status: 200 })
      return respostaLlm()
    }
    try {
      const edicao = await gerarEdicao({
        fontes: [fonteOk, fonteQuebrada, fonteInativa],
        config,
        fetchFn,
        agora: new Date('2026-08-20T14:00:00Z'),
        dirSaida: dir
      })
      expect(edicao.noticias).toHaveLength(2)
      expect(avisos.some((a) => a.includes('Fonte B'))).toBe(true)
    } finally {
      console.warn = warnOriginal
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('falha quando nenhuma notícia é coletada', async () => {
    const dir = dirTemp()
    const fetchFn = async () => new Response('erro', { status: 500 })
    await expect(
      gerarEdicao({ fontes: [fonteOk], config, fetchFn, agora: new Date(), dirSaida: dir })
    ).rejects.toThrow(/Nenhuma notícia/)
    rmSync(dir, { recursive: true, force: true })
  })
})

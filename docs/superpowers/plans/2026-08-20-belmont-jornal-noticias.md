# Belmont — Jornal de Notícias Curadas: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jornal digital estático no GitHub Pages: edições com resumos de notícias gerados por LLM a partir de fontes RSS/scraping, disparadas manualmente pelo admin via GitHub Actions.

**Architecture:** Monorepo com três partes: `generator/` (scripts Node que rodam no GitHub Actions: coletam notícias, resumem via LLM e commitam JSONs), `data/` (fontes + edições JSON versionadas) e `src/` (site React estático que lê os JSONs). Dois workflows: "Gerar Edição" (manual) e "Deploy Site" (no push).

**Tech Stack:** Node.js 20, Vite + React + react-router (site), rss-parser + cheerio + yaml (gerador), API de LLM compatível com OpenAI, Vitest + React Testing Library (testes), GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-08-20-jornal-noticias-design.md`

## Global Constraints

- Node.js 20 (setup-node com `node-version: 20`); npm como gerenciador de pacotes.
- Commits em conventional commits com descrição em português.
- Resumos da LLM SEMPRE em português, 2-3 frases, tom jornalístico neutro (prompt de sistema fixo).
- API da LLM: esquema compatível com OpenAI (`POST {LLM_BASE_URL}/chat/completions`), configurada por env: `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`.
- Fonte que falha NUNCA aborta a edição (aviso no log e segue); zero notícias coletadas = workflow falha.
- Chamadas à LLM sequenciais, 2 tentativas por notícia; após falhar, usa o texto do feed como resumo; 401 lança erro imediato com mensagem explícita.
- ID/data da edição: dia corrente no fuso `America/Sao_Paulo`; rodar de novo no mesmo dia sobrescreve a edição.
- Edições JSON em `data/editions/`; índice em `data/editions/index.json`; defaults: `max_noticias: 5`, `ativo: true`.
- Testes sempre com fixtures (nunca fontes reais nem LLM real).
- `base` do Vite: `/belmont/` (ajustar se o repo/domínio tiver outro nome — anotado no README).
- Nenhuma dependência além das listadas neste plano.

---

### Task 1: Scaffold do projeto (Vite + React + Vitest)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`
- Create: `src/main.jsx`, `src/App.jsx`, `src/test-setup.js`, `src/estilos.css`
- Create: `scripts/copiar-dados.js`, `data/sources.yml`, `data/editions/index.json`, `public/404.html` (placeholder simples; conteúdo real na Task 10)

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: projeto instalável; scripts npm `dev`, `build` (vite build + cópia de `data/`), `test` (`vitest run --passWithNoTests`); branch `main`

- [ ] **Step 1: Criar os arquivos base**

`package.json`:

```json
{
  "name": "belmont",
  "private": true,
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/copiar-dados.js",
    "preview": "vite preview",
    "test": "vitest run --passWithNoTests"
  }
}
```

`vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/belmont/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['src/test-setup.js']
  }
})
```

`index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Belmont</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`.gitignore`:

```
node_modules/
dist/
```

`src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './estilos.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`src/App.jsx` (placeholder até a Task 10):

```jsx
export default function App() {
  return <h1>Belmont</h1>
}
```

`src/estilos.css` (vazio por enquanto):

```css
/* estilos do site (Task 10) */
```

`src/test-setup.js`:

```js
import '@testing-library/jest-dom/vitest'
```

`scripts/copiar-dados.js`:

```js
import { cpSync, mkdirSync } from 'node:fs'

mkdirSync('dist', { recursive: true })
cpSync('data', 'dist/data', { recursive: true })
console.log('data/ copiado para dist/data/')
```

`data/sources.yml` (fonte real de exemplo para a primeira execução):

```yaml
sources:
  - id: g1
    nome: G1
    tipo: rss
    url: https://g1.globo.com/rss/g1/
    max_noticias: 5
    ativo: true
```

`data/editions/index.json`:

```json
{ "edicoes": [] }
```

`public/404.html` (placeholder; substituído na Task 10):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Belmont</title></head>
<body></body>
</html>
```

- [ ] **Step 2: Instalar dependências**

```bash
npm install react react-dom react-router-dom rss-parser cheerio yaml
npm install -D vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Verificar build e testes**

Run: `npm run build && npm test`
Expected: build conclui sem erros, `dist/index.html` e `dist/data/editions/index.json` existem, testes passam (nenhum arquivo de teste ainda).

- [ ] **Step 4: Renomear branch para main**

```bash
git branch -m master main
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold do projeto (Vite + React + Vitest)"
```

---

### Task 2: Carregar e validar `sources.yml`

**Files:**
- Create: `generator/carregar-fontes.js`
- Test: `generator/carregar-fontes.test.js`

**Interfaces:**
- Consumes: `data/sources.yml` (formato do spec)
- Produces: `carregarFontes(caminho = 'data/sources.yml') → Fonte[]` e `validarFontes(textoYaml) → Fonte[]`, onde `Fonte = { id, nome, tipo: 'rss'|'html', url, max_noticias: number, ativo: boolean, seletores?: { item, titulo, link } }`. Lança `Error` com mensagem em português em arquivo inválido.

- [ ] **Step 1: Escrever o teste falhando**

`generator/carregar-fontes.test.js`:

```js
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
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/carregar-fontes.test.js`
Expected: FAIL — não existe `carregar-fontes.js`.

- [ ] **Step 3: Implementar**

`generator/carregar-fontes.js`:

```js
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
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/carregar-fontes.test.js`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/carregar-fontes.js generator/carregar-fontes.test.js
git commit -m "feat(generator): carregar e validar sources.yml"
```

---

### Task 3: Coleta via RSS

**Files:**
- Create: `generator/coletar-rss.js`
- Test: `generator/coletar-rss.test.js`

**Interfaces:**
- Consumes: `Fonte` (Task 2)
- Produces: `baixarTexto(url, fetchFn = fetch, timeoutMs = 20000) → Promise<string>` (lança em resposta não-ok ou timeout) e `coletarRss(fonte, fetchFn = fetch) → Promise<NoticiaColetada[]>`, onde `NoticiaColetada = { titulo: string, url: string, publicada_em: string|null, conteudo: string, fonte: string }` (itens sem título ou link são descartados)

- [ ] **Step 1: Escrever o teste falhando**

`generator/coletar-rss.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { coletarRss } from './coletar-rss.js'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Feed</title>
  <item><title>Primeira notícia</title><link>https://exemplo.com/n1</link>
    <pubDate>Thu, 20 Aug 2026 09:00:00 GMT</pubDate><description>Texto da primeira.</description></item>
  <item><title>Segunda notícia</title><link>https://exemplo.com/n2</link>
    <description>Texto da segunda.</description></item>
  <item><link>https://exemplo.com/sem-titulo</link></item>
  <item><title>Sem link</title></item>
</channel></rss>`

const fetchOk = async () => new Response(xml, { status: 200 })
const fonte = { id: 'ex', nome: 'Exemplo', tipo: 'rss', url: 'https://exemplo.com/rss', max_noticias: 5, ativo: true }

describe('coletarRss', () => {
  it('extrai título, link, data ISO e conteúdo dos itens', async () => {
    const noticias = await coletarRss(fonte, fetchOk)
    expect(noticias).toHaveLength(2)
    expect(noticias[0]).toEqual({
      titulo: 'Primeira notícia',
      url: 'https://exemplo.com/n1',
      publicada_em: '2026-08-20T09:00:00.000Z',
      conteudo: 'Texto da primeira.',
      fonte: 'Exemplo'
    })
    expect(noticias[1].publicada_em).toBeNull()
  })

  it('descarta itens sem título ou sem link', async () => {
    const noticias = await coletarRss(fonte, fetchOk)
    expect(noticias.find((n) => n.url.includes('sem-titulo'))).toBeUndefined()
    expect(noticias.find((n) => n.titulo === 'Sem link')).toBeUndefined()
  })

  it('lança erro quando a resposta não é ok', async () => {
    const fetchErro = async () => new Response('falhou', { status: 500 })
    await expect(coletarRss(fonte, fetchErro)).rejects.toThrow(/500/)
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/coletar-rss.test.js`
Expected: FAIL — não existe `coletar-rss.js`.

- [ ] **Step 3: Implementar**

`generator/coletar-rss.js`:

```js
import Parser from 'rss-parser'

export async function baixarTexto(url, fetchFn = fetch, timeoutMs = 20000) {
  const resp = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!resp.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${resp.status}`)
  }
  return resp.text()
}

export async function coletarRss(fonte, fetchFn = fetch) {
  const xml = await baixarTexto(fonte.url, fetchFn)
  const parser = new Parser()
  const feed = await parser.parseString(xml)
  return feed.items
    .map((item) => ({
      titulo: item.title?.trim() ?? '',
      url: item.link?.trim() ?? '',
      publicada_em: item.isoDate ?? null,
      conteudo: (item.contentSnippet || item.content || '').trim(),
      fonte: fonte.nome
    }))
    .filter((n) => n.titulo && n.url)
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/coletar-rss.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/coletar-rss.js generator/coletar-rss.test.js
git commit -m "feat(generator): coleta de notícias via RSS"
```

---

### Task 4: Coleta via scraping de HTML

**Files:**
- Create: `generator/coletar-html.js`
- Test: `generator/coletar-html.test.js`

**Interfaces:**
- Consumes: `baixarTexto` (Task 3), `Fonte` com `seletores = { item, titulo, link }`
- Produces: `coletarHtml(fonte, fetchFn = fetch) → Promise<NoticiaColetada[]>`; `publicada_em` é sempre `null` (scraping não tem data confiável); links relativos são resolvidos contra `fonte.url`; itens sem título/link são descartados

- [ ] **Step 1: Escrever o teste falhando**

`generator/coletar-html.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { coletarHtml } from './coletar-html.js'

const html = `<html><body>
  <article class="noticia"><h2><a href="/politica/n1">Manchete um</a></h2><p>Lide da primeira.</p></article>
  <article class="noticia"><h2><a href="https://exemplo.com/n2">Manchete dois</a></h2></article>
  <article class="noticia"><h2>Sem link</h2></article>
  <article class="outra-coisa"><h2><a href="/x">Ignorar</a></h2></article>
</body></html>`

const fetchOk = async () => new Response(html, { status: 200 })
const fonte = {
  id: 'ex',
  nome: 'Exemplo',
  tipo: 'html',
  url: 'https://exemplo.com/noticias',
  max_noticias: 5,
  ativo: true,
  seletores: { item: 'article.noticia', titulo: 'h2 a', link: 'h2 a[href]' }
}

describe('coletarHtml', () => {
  it('extrai itens com seletores e resolve link relativo contra a url da fonte', async () => {
    const noticias = await coletarHtml(fonte, fetchOk)
    expect(noticias).toHaveLength(2)
    expect(noticias[0]).toEqual({
      titulo: 'Manchete um',
      url: 'https://exemplo.com/politica/n1',
      publicada_em: null,
      conteudo: 'Manchete um Lide da primeira.',
      fonte: 'Exemplo'
    })
    expect(noticias[1].url).toBe('https://exemplo.com/n2')
  })

  it('descarta itens fora do seletor ou sem link/título', async () => {
    const noticias = await coletarHtml(fonte, fetchOk)
    expect(noticias.find((n) => n.titulo === 'Sem link')).toBeUndefined()
    expect(noticias.find((n) => n.titulo === 'Ignorar')).toBeUndefined()
  })

  it('retorna lista vazia quando nenhum seletor casa (não lança)', async () => {
    const vazio = async () => new Response('<html><body><p>nada</p></body></html>', { status: 200 })
    const noticias = await coletarHtml(fonte, vazio)
    expect(noticias).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/coletar-html.test.js`
Expected: FAIL — não existe `coletar-html.js`.

- [ ] **Step 3: Implementar**

`generator/coletar-html.js`:

```js
import * as cheerio from 'cheerio'
import { baixarTexto } from './coletar-rss.js'

export async function coletarHtml(fonte, fetchFn = fetch) {
  const html = await baixarTexto(fonte.url, fetchFn)
  const $ = cheerio.load(html)
  const itens = []
  $(fonte.seletores.item).each((_, el) => {
    const titulo = $(el).find(fonte.seletores.titulo).first().text().trim()
    const href = $(el).find(fonte.seletores.link).first().attr('href')
    if (!titulo || !href) return
    let url
    try {
      url = new URL(href, fonte.url).href
    } catch {
      return
    }
    itens.push({
      titulo,
      url,
      publicada_em: null,
      conteudo: $(el).text().replace(/\s+/g, ' ').trim(),
      fonte: fonte.nome
    })
  })
  return itens
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/coletar-html.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/coletar-html.js generator/coletar-html.test.js
git commit -m "feat(generator): coleta de notícias via scraping HTML"
```

---

### Task 5: Normalização (limite por fonte, dedupe, ordenação)

**Files:**
- Create: `generator/normalizar.js`
- Test: `generator/normalizar.test.js`

**Interfaces:**
- Consumes: `NoticiaColetada` (Tasks 3-4), `Fonte` (Task 2)
- Produces: `normalizar(colecao) → NoticiaColetada[]`, onde `colecao = [{ fonte: Fonte, itens: NoticiaColetada[] }]`; e `normalizarUrl(url) → string` (remove hash, barra final e parâmetros de rastreamento `utm_*`, `fbclid`, `gclid`). Ordenação: `publicada_em` decrescente; itens sem data no fim.

- [ ] **Step 1: Escrever o teste falhando**

`generator/normalizar.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { normalizar, normalizarUrl } from './normalizar.js'

const fonte = (nome, max = 5) => ({ id: nome, nome, tipo: 'rss', url: `https://${nome}.com/`, max_noticias: max, ativo: true })
const noticia = (titulo, url, dia) => ({ titulo, url, publicada_em: dia, conteudo: 'x', fonte: 'F' })

describe('normalizarUrl', () => {
  it('remove utm_*, fbclid, gclid, hash e barra final', () => {
    const suja = 'https://exemplo.com/n1/?utm_source=rss&fbclid=abc&utm_medium=feed#topo'
    expect(normalizarUrl(suja)).toBe('https://exemplo.com/n1/')
  })

  it('mantém parâmetros que não são de rastreamento', () => {
    expect(normalizarUrl('https://exemplo.com/n?id=7')).toBe('https://exemplo.com/n?id=7')
  })
})

describe('normalizar', () => {
  it('limita cada fonte ao max_noticias', () => {
    const itens = [1, 2, 3, 4].map((i) => noticia(`t${i}`, `https://a.com/${i}`, null))
    const resultado = normalizar([{ fonte: fonte('A', 2), itens }])
    expect(resultado).toHaveLength(2)
  })

  it('descarta duplicatas pela URL normalizada', () => {
    const a = [noticia('t1', 'https://a.com/n1/', null)]
    const b = [noticia('t1 repetida', 'https://a.com/n1?utm_source=x', null)]
    const resultado = normalizar([{ fonte: fonte('A'), itens: a }, { fonte: fonte('B'), itens: b }])
    expect(resultado).toHaveLength(1)
    expect(resultado[0].titulo).toBe('t1')
  })

  it('ordena por data decrescente com itens sem data no fim', () => {
    const itens = [
      noticia('sem-data', 'https://a.com/1', null),
      noticia('velha', 'https://a.com/2', '2026-08-18T10:00:00Z'),
      noticia('nova', 'https://a.com/3', '2026-08-20T10:00:00Z')
    ]
    const resultado = normalizar([{ fonte: fonte('A'), itens }])
    expect(resultado.map((n) => n.titulo)).toEqual(['nova', 'velha', 'sem-data'])
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/normalizar.test.js`
Expected: FAIL — não existe `normalizar.js`.

- [ ] **Step 3: Implementar**

`generator/normalizar.js`:

```js
export function normalizarUrl(url) {
  const u = new URL(url)
  u.hash = ''
  for (const chave of [...u.searchParams.keys()]) {
    if (/^(utm_.+|fbclid|gclid)$/.test(chave)) u.searchParams.delete(chave)
  }
  return u.toString().replace(/\/$/, '')
}

export function normalizar(colecao) {
  const vistas = new Set()
  const noticias = []
  for (const { fonte, itens } of colecao) {
    for (const n of itens.slice(0, fonte.max_noticias)) {
      const chave = normalizarUrl(n.url)
      if (vistas.has(chave)) continue
      vistas.add(chave)
      noticias.push(n)
    }
  }
  return noticias.sort((a, b) =>
    (b.publicada_em ?? '').localeCompare(a.publicada_em ?? '')
  )
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/normalizar.test.js`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/normalizar.js generator/normalizar.test.js
git commit -m "feat(generator): normalização de notícias (dedupe, ordem, limite)"
```

---

### Task 6: Resumos via LLM (retry + fallback)

**Files:**
- Create: `generator/resumir.js`
- Test: `generator/resumir.test.js`

**Interfaces:**
- Consumes: `NoticiaColetada` (Tasks 3-4)
- Produces: `resumir(noticias, config, fetchFn = fetch) → Promise<NoticiaFinal[]>` e `resumirNoticia(noticia, config, fetchFn = fetch) → Promise<string>`, onde `config = { baseUrl: string, model: string, apiKey: string }` e `NoticiaFinal = { titulo, fonte, url, publicada_em, resumo }`. Erro 401 lança imediatamente; após 2 tentativas sem sucesso usa `conteudo || titulo` como resumo.

- [ ] **Step 1: Escrever o teste falhando**

`generator/resumir.test.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { resumir, resumirNoticia } from './resumir.js'

const config = { baseUrl: 'https://api.exemplo.com/v1', model: 'modelo-x', apiKey: 'chave-1' }
const noticia = {
  titulo: 'Título',
  url: 'https://a.com/1',
  publicada_em: null,
  conteudo: 'Conteúdo da notícia.',
  fonte: 'A'
}

const respostaLlm = (texto) =>
  new Response(JSON.stringify({ choices: [{ message: { content: texto } }] }), { status: 200 })

describe('resumirNoticia', () => {
  it('chama o endpoint chat/completions e devolve o resumo', async () => {
    const fetchFn = vi.fn(async () => respostaLlm('Resumo gerado.'))
    const resumo = await resumirNoticia(noticia, config, fetchFn)
    expect(resumo).toBe('Resumo gerado.')
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.exemplo.com/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer chave-1')
    const corpo = JSON.parse(init.body)
    expect(corpo.model).toBe('modelo-x')
    expect(corpo.messages[0].role).toBe('system')
    expect(corpo.messages[1].content).toContain('Título')
  })

  it('tenta 2 vezes e usa fallback após falhar', async () => {
    const fetchFn = vi.fn(async () => new Response('erro', { status: 500 }))
    const resumo = await resumirNoticia(noticia, config, fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(resumo).toBe('Conteúdo da notícia.')
  })

  it('lança erro explícito em 401 sem retry', async () => {
    const fetchFn = vi.fn(async () => new Response('unauthorized', { status: 401 }))
    await expect(resumirNoticia(noticia, config, fetchFn)).rejects.toThrow(/LLM_API_KEY/)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})

describe('resumir', () => {
  it('resume todas as notícias sequencialmente e monta NoticiaFinal', async () => {
    const fetchFn = vi.fn(async () => respostaLlm('Resumo.'))
    const noticias = [noticia, { ...noticia, titulo: 'Dois', url: 'https://a.com/2' }]
    const resultado = await resumir(noticias, config, fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(resultado[0]).toEqual({
      titulo: 'Título',
      fonte: 'A',
      url: 'https://a.com/1',
      publicada_em: null,
      resumo: 'Resumo.'
    })
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/resumir.test.js`
Expected: FAIL — não existe `resumir.js`.

- [ ] **Step 3: Implementar**

`generator/resumir.js`:

```js
const PROMPT_SISTEMA =
  'Você é um editor de notícias. Resuma a notícia a seguir em 2 a 3 frases, em português, com tom jornalístico neutro. Responda apenas com o resumo, sem títulos, preâmbulos ou comentários.'

export async function resumirNoticia(noticia, config, fetchFn = fetch) {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  const corpo = {
    model: config.model,
    messages: [
      { role: 'system', content: PROMPT_SISTEMA },
      { role: 'user', content: `Título: ${noticia.titulo}\n\n${noticia.conteudo}` }
    ]
  }
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const resp = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(60000)
    })
    if (resp.status === 401) {
      throw new Error('Autenticação da LLM falhou (401). Verifique o secret LLM_API_KEY.')
    }
    if (resp.ok) {
      const dados = await resp.json()
      const resumo = dados.choices?.[0]?.message?.content?.trim()
      if (resumo) return resumo
    }
  }
  return noticia.conteudo || noticia.titulo
}

export async function resumir(noticias, config, fetchFn = fetch) {
  const resultado = []
  for (const n of noticias) {
    const resumo = await resumirNoticia(n, config, fetchFn)
    resultado.push({ titulo: n.titulo, fonte: n.fonte, url: n.url, publicada_em: n.publicada_em, resumo })
  }
  return resultado
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/resumir.test.js`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/resumir.js generator/resumir.test.js
git commit -m "feat(generator): resumos via LLM com retry e fallback"
```

---

### Task 7: Montagem da edição e do índice

**Files:**
- Create: `generator/montar-edicao.js`
- Test: `generator/montar-edicao.test.js`

**Interfaces:**
- Consumes: `NoticiaFinal` (Task 6)
- Produces:
  - `dataHoje(agora = new Date()) → 'YYYY-MM-DD'` no fuso `America/Sao_Paulo`
  - `montarEdicao(noticiasFinal, { id, geradaEm }) → Edicao`, onde `Edicao = { id: string, gerada_em: string, noticias: NoticiaFinal[] }`
  - `atualizarIndice(indice, edicao) → Indice`, onde `Indice = { edicoes: { id, data, fontes, noticias }[] }` (upsert por `id`, ordenado por id decrescente)

- [ ] **Step 1: Escrever o teste falhando**

`generator/montar-edicao.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { dataHoje, montarEdicao, atualizarIndice } from './montar-edicao.js'

describe('dataHoje', () => {
  it('usa o fuso America/Sao_Paulo (23h UTC = mesmo dia em Brasília)', () => {
    expect(dataHoje(new Date('2026-08-20T23:30:00Z'))).toBe('2026-08-20')
  })

  it('2h UTC do dia 21 ainda é dia 20 em Brasília', () => {
    expect(dataHoje(new Date('2026-08-21T02:30:00Z'))).toBe('2026-08-20')
  })
})

describe('montarEdicao', () => {
  it('monta o objeto da edição', () => {
    const noticias = [{ titulo: 't', fonte: 'F', url: 'https://a.com/1', publicada_em: null, resumo: 'r' }]
    const edicao = montarEdicao(noticias, { id: '2026-08-20', geradaEm: '2026-08-20T14:32:00Z' })
    expect(edicao).toEqual({
      id: '2026-08-20',
      gerada_em: '2026-08-20T14:32:00Z',
      noticias
    })
  })
})

describe('atualizarIndice', () => {
  const indiceAntigo = {
    edicoes: [{ id: '2026-08-19', data: '2026-08-19', fontes: 1, noticias: 3 }]
  }
  const edicao = {
    id: '2026-08-20',
    gerada_em: '2026-08-20T14:32:00Z',
    noticias: [
      { titulo: 't1', fonte: 'G1', url: 'https://a.com/1', publicada_em: null, resumo: 'r' },
      { titulo: 't2', fonte: 'G1', url: 'https://a.com/2', publicada_em: null, resumo: 'r' },
      { titulo: 't3', fonte: 'Folha', url: 'https://a.com/3', publicada_em: null, resumo: 'r' }
    ]
  }

  it('insere a nova edição no topo com contagem de fontes e notícias', () => {
    const indice = atualizarIndice(indiceAntigo, edicao)
    expect(indice.edicoes[0]).toEqual({ id: '2026-08-20', data: '2026-08-20', fontes: 2, noticias: 3 })
    expect(indice.edicoes).toHaveLength(2)
  })

  it('sobrescreve (upsert) edição do mesmo dia', () => {
    const nova = { ...edicao, noticias: edicao.noticias.slice(0, 1) }
    const indice = atualizarIndice(atualizarIndice(indiceAntigo, edicao), nova)
    expect(indice.edicoes).toHaveLength(2)
    expect(indice.edicoes[0].noticias).toBe(1)
  })

  it('funciona com índice vazio', () => {
    const indice = atualizarIndice({ edicoes: [] }, edicao)
    expect(indice.edicoes).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/montar-edicao.test.js`
Expected: FAIL — não existe `montar-edicao.js`.

- [ ] **Step 3: Implementar**

`generator/montar-edicao.js`:

```js
export function dataHoje(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}

export function montarEdicao(noticias, { id, geradaEm }) {
  return { id, gerada_em: geradaEm, noticias }
}

export function atualizarIndice(indice, edicao) {
  const demais = indice.edicoes.filter((e) => e.id !== edicao.id)
  const entrada = {
    id: edicao.id,
    data: edicao.id,
    fontes: new Set(edicao.noticias.map((n) => n.fonte)).size,
    noticias: edicao.noticias.length
  }
  return { edicoes: [entrada, ...demais].sort((a, b) => b.id.localeCompare(a.id)) }
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/montar-edicao.test.js`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/montar-edicao.js generator/montar-edicao.test.js
git commit -m "feat(generator): montagem da edição e índice"
```

---

### Task 8: Orquestração da geração (entrada CLI)

**Files:**
- Create: `generator/gerar.js`
- Test: `generator/gerar.test.js`

**Interfaces:**
- Consumes: `carregarFontes` (Task 2), `coletarRss`/`baixarTexto` (Task 3), `coletarHtml` (Task 4), `normalizar` (Task 5), `resumir` (Task 6), `dataHoje`/`montarEdicao`/`atualizarIndice` (Task 7)
- Produces: `gerarEdicao({ fontes, config, fetchFn = fetch, agora = new Date(), dirSaida = 'data/editions' }) → Promise<Edicao>` — grava `<dirSaida>/<id>.json` e `<dirSaida>/index.json` (cria o diretório se necessário; índice ausente = `{ edicoes: [] }`). Fonte que falha é pulada com `console.warn`. Zero notícias → lança. Executar como CLI (`node generator/gerar.js`) lê `data/sources.yml` + env `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` e falha com mensagem clara se faltar config.

- [ ] **Step 1: Escrever o teste falhando (integração com fixtures + LLM mockada)**

`generator/gerar.test.js`:

```js
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
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run generator/gerar.test.js`
Expected: FAIL — não existe `gerar.js`.

- [ ] **Step 3: Implementar**

`generator/gerar.js`:

```js
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
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run generator/gerar.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add generator/gerar.js generator/gerar.test.js
git commit -m "feat(generator): orquestração da geração de edição"
```

---

### Task 9: Camada de dados do site (fetch de JSONs)

**Files:**
- Create: `src/api.js`
- Test: `src/api.test.js`
- Modify: nada (a cópia de `data/` no build já existe desde a Task 1)

**Interfaces:**
- Consumes: `Edicao` e `Indice` (formatos das Tasks 7-8)
- Produces: `carregarIndice() → Promise<Indice|null>` e `carregarEdicao(id) → Promise<Edicao|null>` (null quando o fetch falha com 404/erro, sem lançar). URLs prefixadas com `import.meta.env.BASE_URL`.

- [ ] **Step 1: Escrever o teste falhando**

`src/api.test.js`:

```js
import { describe, it, expect, vi, afterEach } from 'vitest'
import { carregarIndice, carregarEdicao } from './api.js'

afterEach(() => vi.unstubAllGlobals())

describe('carregarIndice', () => {
  it('retorna o índice parseado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ edicoes: [{ id: '2026-08-20', data: '2026-08-20', fontes: 1, noticias: 2 }] }), { status: 200 })
    ))
    const indice = await carregarIndice()
    expect(indice.edicoes[0].id).toBe('2026-08-20')
  })

  it('retorna null quando não existe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    expect(await carregarIndice()).toBeNull()
  })
})

describe('carregarEdicao', () => {
  it('retorna a edição pelo id', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ id: '2026-08-20', gerada_em: 'x', noticias: [] }), { status: 200 })
    ))
    const edicao = await carregarEdicao('2026-08-20')
    expect(edicao.id).toBe('2026-08-20')
  })

  it('retorna null para id inexistente', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    expect(await carregarEdicao('1999-01-01')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run src/api.test.js`
Expected: FAIL — não existe `api.js`.

- [ ] **Step 3: Implementar**

`src/api.js`:

```js
const base = import.meta.env.BASE_URL

export async function carregarIndice() {
  try {
    const resp = await fetch(`${base}data/editions/index.json`)
    if (!resp.ok) return null
    return resp.json()
  } catch {
    return null
  }
}

export async function carregarEdicao(id) {
  try {
    const resp = await fetch(`${base}data/editions/${id}.json`)
    if (!resp.ok) return null
    return resp.json()
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npx vitest run src/api.test.js`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/api.js src/api.test.js
git commit -m "feat(site): camada de dados (fetch de edições)"
```

---

### Task 10: Rotas, layout e páginas de edição

**Files:**
- Create: `src/formatar.js`, `src/formatar.test.js`
- Create: `src/components/Noticia.jsx`, `src/components/EdicaoView.jsx`, `src/components/RestaurarRota.jsx`
- Create: `src/pages/PaginaEdicaoAtual.jsx`, `src/pages/PaginaEdicao.jsx`
- Modify: `src/App.jsx` (substitui placeholder), `src/estilos.css` (substitui vazio), `public/404.html` (substitui placeholder)
- Test: `src/components/noticia.test.jsx`, `src/pages/pagina-edicao-atual.test.jsx`

**Interfaces:**
- Consumes: `carregarIndice`/`carregarEdicao` (Task 9), `Edicao`/`Indice`
- Produces:
  - `formatarDataHora(iso) → '20/08/2026 09:00'` (vazio se inválida) e `formatarData('YYYY-MM-DD') → 'DD/MM/AAAA'`; `caminhoRelativo(alvo, base) → '/rota'`
  - Componentes: `Noticia({ noticia })`, `EdicaoView({ edicao })` (agrupa por fonte), `RestaurarRota()` (restaura deep link do 404.html)
  - Páginas: `PaginaEdicaoAtual()` (home = edição mais recente), `PaginaEdicao()` (`/edicao/:id`)
  - Rota `/` e `/edicao/:id` funcionais com estado vazio ("Ainda não há edições publicadas." / "Edição não encontrada.")

- [ ] **Step 1: Escrever os testes falhando**

`src/formatar.test.js`:

```js
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
    expect(caminhoRelativo('/belmont/arquivo?pagina=2', '/belmont/')).toBe('/arquivo?pagina=2')
  })
  it('mantém caminho quando não há prefixo', () => {
    expect(caminhoRelativo('/arquivo', '/')).toBe('/arquivo')
  })
  it('raiz volta para /', () => {
    expect(caminhoRelativo('/', '/')).toBe('/')
    expect(caminhoRelativo('/belmont/', '/belmont/')).toBe('/')
  })
})
```

`src/components/noticia.test.jsx` (docblock jsdom é obrigatório):

```jsx
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
```

`src/pages/pagina-edicao-atual.test.jsx`:

```jsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaginaEdicaoAtual } from './PaginaEdicaoAtual.jsx'

afterEach(() => vi.unstubAllGlobals())

function renderizar() {
  return render(
    <MemoryRouter>
      <PaginaEdicaoAtual />
    </MemoryRouter>
  )
}

describe('PaginaEdicaoAtual', () => {
  it('mostra mensagem quando não há edições', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    renderizar()
    expect(await screen.findByText('Ainda não há edições publicadas.')).toBeInTheDocument()
  })

  it('carrega e exibe a edição mais recente agrupada por fonte', async () => {
    const indice = { edicoes: [{ id: '2026-08-20', data: '2026-08-20', fontes: 1, noticias: 1 }] }
    const edicao = {
      id: '2026-08-20',
      gerada_em: 'x',
      noticias: [{ titulo: 'T1', fonte: 'G1', url: 'https://a.com/1', publicada_em: null, resumo: 'R1' }]
    }
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const s = String(url)
      if (s.includes('index.json')) return new Response(JSON.stringify(indice), { status: 200 })
      return new Response(JSON.stringify(edicao), { status: 200 })
    }))
    renderizar()
    expect(await screen.findByText('T1')).toBeInTheDocument()
    expect(screen.getByText('G1', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText(/20\/08\/2026/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e verificar que falham**

Run: `npx vitest run src/formatar.test.js src/components/noticia.test.jsx src/pages/pagina-edicao-atual.test.jsx`
Expected: FAIL — arquivos não existem.

- [ ] **Step 3: Implementar**

`src/formatar.js`:

```js
export function formatarDataHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatarData(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return iso ?? ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function caminhoRelativo(alvo, base) {
  const i = alvo.indexOf(base)
  const resto = i >= 0 ? alvo.slice(i + base.length) : alvo
  return resto.startsWith('/') ? resto : `/${resto}`
}
```

`src/components/Noticia.jsx`:

```jsx
import { formatarDataHora } from '../formatar.js'

export function Noticia({ noticia }) {
  return (
    <article className="noticia">
      <h3>
        <a href={noticia.url} target="_blank" rel="noreferrer">
          {noticia.titulo}
        </a>
      </h3>
      <p className="resumo">{noticia.resumo}</p>
      <p className="meta">
        {noticia.fonte}
        {noticia.publicada_em ? ` · ${formatarDataHora(noticia.publicada_em)}` : ''}
      </p>
    </article>
  )
}
```

`src/components/EdicaoView.jsx`:

```jsx
import { useMemo } from 'react'
import { Noticia } from './Noticia.jsx'
import { formatarData } from '../formatar.js'

export function EdicaoView({ edicao }) {
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const n of edicao.noticias) {
      if (!mapa.has(n.fonte)) mapa.set(n.fonte, [])
      mapa.get(n.fonte).push(n)
    }
    return [...mapa.entries()]
  }, [edicao])

  return (
    <div>
      <p className="data-edicao">Edição de {formatarData(edicao.id)}</p>
      {grupos.map(([fonte, noticias]) => (
        <section key={fonte}>
          <h2 className="fonte">{fonte}</h2>
          {noticias.map((n, i) => (
            <Noticia key={`${n.url}-${i}`} noticia={n} />
          ))}
        </section>
      ))}
    </div>
  )
}
```

`src/components/RestaurarRota.jsx`:

```jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { caminhoRelativo } from '../formatar.js'

export function RestaurarRota() {
  const navigate = useNavigate()
  useEffect(() => {
    const alvo = sessionStorage.redirect
    if (alvo) {
      delete sessionStorage.redirect
      navigate(caminhoRelativo(alvo, import.meta.env.BASE_URL))
    }
  }, [navigate])
  return null
}
```

`src/pages/PaginaEdicaoAtual.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { EdicaoView } from '../components/EdicaoView.jsx'
import { carregarIndice, carregarEdicao } from '../api.js'

export function PaginaEdicaoAtual() {
  const [estado, setEstado] = useState({ carregando: true, edicao: null })

  useEffect(() => {
    ;(async () => {
      const indice = await carregarIndice()
      const id = indice?.edicoes?.[0]?.id
      const edicao = id ? await carregarEdicao(id) : null
      setEstado({ carregando: false, edicao })
    })()
  }, [])

  if (estado.carregando) return <p>Carregando…</p>
  if (!estado.edicao) return <p>Ainda não há edições publicadas.</p>
  return <EdicaoView edicao={estado.edicao} />
}
```

`src/pages/PaginaEdicao.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EdicaoView } from '../components/EdicaoView.jsx'
import { carregarEdicao } from '../api.js'

export function PaginaEdicao() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ carregando: true, edicao: null })

  useEffect(() => {
    let ativo = true
    carregarEdicao(id).then((edicao) => {
      if (ativo) setEstado({ carregando: false, edicao })
    })
    return () => {
      ativo = false
    }
  }, [id])

  if (estado.carregando) return <p>Carregando…</p>
  if (!estado.edicao) {
    return (
      <p>
        Edição não encontrada. <Link to="/arquivo">Ver arquivo de edições</Link>.
      </p>
    )
  }
  return <EdicaoView edicao={estado.edicao} />
}
```

`src/App.jsx` (substitui o placeholder):

```jsx
import { Link, Route, Routes } from 'react-router-dom'
import { RestaurarRota } from './components/RestaurarRota.jsx'
import { PaginaEdicaoAtual } from './pages/PaginaEdicaoAtual.jsx'
import { PaginaEdicao } from './pages/PaginaEdicao.jsx'
import { PaginaArquivo } from './pages/PaginaArquivo.jsx'

export default function App() {
  return (
    <div className="container">
      <header className="site">
        <h1>
          <Link to="/">Belmont</Link>
        </h1>
        <nav>
          <Link to="/arquivo">Arquivo</Link>
        </nav>
      </header>
      <RestaurarRota />
      <Routes>
        <Route path="/" element={<PaginaEdicaoAtual />} />
        <Route path="/arquivo" element={<PaginaArquivo />} />
        <Route path="/edicao/:id" element={<PaginaEdicao />} />
      </Routes>
    </div>
  )
}
```

Nota: `PaginaArquivo` é criada na Task 11. Para este commit não quebrar, crie um stub mínimo `src/pages/PaginaArquivo.jsx` com `export function PaginaArquivo() { return <p>Arquivo em construção.</p> }` (será substituído na Task 11). E `src/main.jsx` precisa do router — substitua por:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './estilos.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

`public/404.html` (substitui o placeholder):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Belmont</title>
  <script>
    // GitHub Pages não reescreve URLs: guardamos o caminho e voltamos ao SPA.
    sessionStorage.redirect = location.pathname + location.search
    location.replace('/belmont/')
  </script>
</head>
<body></body>
</html>
```

`src/estilos.css` (substitui o vazio):

```css
:root { --tinta: #1a1a1a; --cinza: #666; --linha: #e5e5e5; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: var(--tinta); background: #fdfdfc; }
.container { max-width: 720px; margin: 0 auto; padding: 0 1rem 2rem; }
header.site { border-bottom: 2px solid var(--tinta); margin: 1rem 0 1.5rem; padding-bottom: 1rem; display: flex; justify-content: space-between; align-items: baseline; }
header.site h1 { font-size: 1.75rem; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.5px; }
header.site a { color: var(--tinta); text-decoration: none; }
header.site nav a { font-family: Arial, sans-serif; font-size: 0.85rem; text-decoration: underline; }
.data-edicao { font-family: Arial, sans-serif; font-size: 0.85rem; color: var(--cinza); margin-bottom: 1.5rem; }
h2.fonte { font-family: Arial, sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--cinza); border-bottom: 1px solid var(--linha); padding-bottom: 0.3rem; margin-top: 2rem; }
article.noticia { padding: 1rem 0; border-bottom: 1px solid var(--linha); }
article.noticia h3 { margin: 0 0 0.4rem; font-size: 1.15rem; line-height: 1.3; }
article.noticia h3 a { color: var(--tinta); text-decoration: none; }
article.noticia h3 a:hover { text-decoration: underline; }
article.noticia p.resumo { margin: 0 0 0.4rem; line-height: 1.55; }
.meta { font-family: Arial, sans-serif; font-size: 0.78rem; color: var(--cinza); margin: 0; }
```

- [ ] **Step 4: Rodar todos os testes e o build**

Run: `npm test && npm run build`
Expected: todos os testes passam (incluindo os das Tasks 2-9) e o build conclui sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(site): rotas, layout e páginas de edição"
```

---

### Task 11: Página de arquivo com paginação

**Files:**
- Modify: `src/pages/PaginaArquivo.jsx` (substitui o stub da Task 10)
- Modify: `src/estilos.css` (adiciona estilos de lista e paginação)
- Test: `src/pages/pagina-arquivo.test.jsx`

**Interfaces:**
- Consumes: `carregarIndice` (Task 9), `formatarData` (Task 10), `Link`/`useSearchParams` do react-router-dom
- Produces: rota `/arquivo` listando edições (20 por página, `?pagina=N`, links "← Anterior" / "Próxima →"); mostra "Ainda não há edições publicadas." quando vazio

- [ ] **Step 1: Escrever o teste falhando**

`src/pages/pagina-arquivo.test.jsx`:

```jsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaginaArquivo } from './PaginaArquivo.jsx'

afterEach(() => vi.unstubAllGlobals())

const gerarEdicoes = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `2026-08-${String(n - i).padStart(2, '0')}`,
    data: `2026-08-${String(n - i).padStart(2, '0')}`,
    fontes: 2,
    noticias: 10
  }))

function renderizar(rota = '/arquivo') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <PaginaArquivo />
    </MemoryRouter>
  )
}

describe('PaginaArquivo', () => {
  it('lista as edições do índice com data e contagem', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ edicoes: gerarEdicoes(2) }), { status: 200 })
    ))
    renderizar()
    expect(await screen.findByText(/20\/08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/19\/08\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/10 notícias/)).toBeInTheDocument()
  })

  it('pagina em blocos de 20 e navega para a próxima página', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ edicoes: gerarEdicoes(22) }), { status: 200 })
    ))
    renderizar()
    expect(await screen.findByText(/21\/08\/2026/)).toBeInTheDocument()
    expect(screen.queryByText(/01\/08\/2026/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima →' })).toHaveAttribute('href', '/arquivo?pagina=2')
  })

  it('mostra mensagem quando não há edições', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nf', { status: 404 })))
    renderizar()
    expect(await screen.findByText('Ainda não há edições publicadas.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `npx vitest run src/pages/pagina-arquivo.test.jsx`
Expected: FAIL — stub não lista edições.

- [ ] **Step 3: Implementar (substituir o stub)**

`src/pages/PaginaArquivo.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { carregarIndice } from '../api.js'
import { formatarData } from '../formatar.js'

const POR_PAGINA = 20

export function PaginaArquivo() {
  const [searchParams] = useSearchParams()
  const [indice, setIndice] = useState(null)

  useEffect(() => {
    carregarIndice().then(setIndice)
  }, [])

  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1)
  if (indice === null) return <p>Carregando…</p>

  const edicoes = indice?.edicoes ?? []
  if (edicoes.length === 0) return <p>Ainda não há edições publicadas.</p>

  const totalPaginas = Math.ceil(edicoes.length / POR_PAGINA)
  const fatia = edicoes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div>
      <h2 className="fonte">Arquivo de edições</h2>
      <ul className="lista-edicoes">
        {fatia.map((e) => (
          <li key={e.id}>
            <Link to={`/edicao/${e.id}`}>Edição de {formatarData(e.id)}</Link>
            <span className="meta"> — {e.noticias} notícias</span>
          </li>
        ))}
      </ul>
      {totalPaginas > 1 && (
        <nav className="paginacao">
          {pagina > 1 && <Link to={`/arquivo?pagina=${pagina - 1}`}>← Anterior</Link>}
          {pagina < totalPaginas && <Link to={`/arquivo?pagina=${pagina + 1}`}>Próxima →</Link>}
        </nav>
      )}
    </div>
  )
}
```

Adicionar ao final de `src/estilos.css`:

```css
ul.lista-edicoes { list-style: none; padding: 0; }
ul.lista-edicoes li { padding: 0.6rem 0; border-bottom: 1px solid var(--linha); }
ul.lista-edicoes a { color: var(--tinta); }
.paginacao { display: flex; gap: 1.5rem; justify-content: center; margin: 2rem 0; font-family: Arial, sans-serif; font-size: 0.9rem; }
```

- [ ] **Step 4: Rodar todos os testes**

Run: `npm test`
Expected: PASS (todos, incluindo os novos 3).

- [ ] **Step 5: Commit**

```bash
git add src/pages/PaginaArquivo.jsx src/pages/pagina-arquivo.test.jsx src/estilos.css
git commit -m "feat(site): página de arquivo com paginação"
```

---

### Task 12: Workflows do GitHub Actions

**Files:**
- Create: `.github/workflows/gerar-edicao.yml`, `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `generator/gerar.js` via CLI (Task 8), `npm run build` (Task 1), env `LLM_BASE_URL`/`LLM_MODEL`/`LLM_API_KEY`
- Produces: workflow "Gerar Edição" (manual, commita `data/editions/`) e workflow "Deploy Site" (push em `main`, publica `dist/` no Pages). Ambos no branch `main`.

- [ ] **Step 1: Criar `.github/workflows/gerar-edicao.yml`**

```yaml
name: Gerar Edição

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  gerar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: node generator/gerar.js
        env:
          LLM_BASE_URL: ${{ vars.LLM_BASE_URL }}
          LLM_MODEL: ${{ vars.LLM_MODEL }}
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
      - name: Commit da edição
        run: |
          git config user.name "belmont-bot"
          git config user.email "actions@github.com"
          git add data/editions
          git diff --cached --quiet || git commit -m "chore: nova edição $(date -u +%F)"
          git push
```

- [ ] **Step 2: Criar `.github/workflows/deploy.yml`**

```yaml
name: Deploy Site

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Validar a sintaxe YAML dos dois arquivos**

Run: `node -e "const {readFileSync}=require('fs');const {parse}=require('yaml');for (const f of ['.github/workflows/gerar-edicao.yml','.github/workflows/deploy.yml']){parse(readFileSync(f,'utf8'));console.log(f+' ok')}"`
Expected: imprime "ok" para os dois arquivos, sem erros.

- [ ] **Step 4: Rodar a suíte completa para garantir que nada quebrou**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows
git commit -m "ci: workflows de geração de edição e deploy no Pages"
```

---

### Task 13: README (manual do admin) e verificação final

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: tudo (workflows da Task 12, `sources.yml` da Task 2, secrets/variables da Task 6)
- Produces: documentação de operação do admin (fontes, LLM, geração de edição) + configuração do Pages

- [ ] **Step 1: Escrever o README**

```markdown
# Belmont

Jornal digital estático: edições com resumos (gerados por LLM) das últimas
notícias de fontes cadastradas. Site público no GitHub Pages; edições geradas
sob demanda pelo administrador via GitHub Actions.

- Site: `https://<usuario>.github.io/belmont/`
- Spec: `docs/superpowers/specs/2026-08-20-jornal-noticias-design.md`

## Manual do administrador

### 1. Cadastrar ou editar uma fonte de notícias

Abra [`data/sources.yml`](data/sources.yml) no GitHub e clique no lápis (✏️ Edit).

Fonte RSS (preferível — quase todo site de notícias tem):

```yaml
  - id: g1                # identificador único, sem espaços
    nome: G1              # nome exibido no site
    tipo: rss
    url: https://g1.globo.com/rss/g1/
    max_noticias: 5       # opcional (padrão: 5)
    ativo: true           # opcional (padrão: true)
```

Fonte sem feed (scraping): além dos campos acima, use `tipo: html` e declare
seletores CSS. Para descobri-los: abra a página no navegador → F12 (DevTools) →
botão de inspecionar elemento → clique numa notícia e identifique:

- `item`: o elemento que se repete para cada notícia (ex.: `article.noticia`)
- `titulo`: o elemento do título dentro do item (ex.: `h2 a`)
- `link`: o elemento com o link dentro do item (ex.: `h2 a[href]`)

```yaml
  - id: portal-exemplo
    nome: Portal Exemplo
    tipo: html
    url: https://exemplo.com.br/noticias
    seletores:
      item: "article.noticia"
      titulo: "h2 a"
      link: "h2 a[href]"
    max_noticias: 3
```

Commit as mudanças. Pronto — a próxima edição usará a nova fonte.

### 2. Configurar a LLM (uma única vez)

No repositório: **Settings → Secrets and variables → Actions**.

- Aba **Secrets**: crie `LLM_API_KEY` com a chave da API (fica oculta).
- Aba **Variables**: crie `LLM_BASE_URL` (ex.: `https://api.openai.com/v1`) e
  `LLM_MODEL` (ex.: `gpt-4o-mini`).

Qualquer API compatível com o esquema OpenAI funciona: OpenAI, OpenRouter,
DeepSeek, Groq, Ollama (endpoint público) etc.

### 3. Gerar uma nova edição

Aba **Actions** → workflow **"Gerar Edição"** → botão **Run workflow** →
**Run workflow**. Acompanhe o log (~1-3 min): o bot coleta as notícias, gera os
resumos, commita a edição e o site é republicado automaticamente.

Rodar de novo no mesmo dia **sobrescreve** a edição daquele dia.

Se uma fonte estiver fora do ar, a edição é gerada sem ela (o log mostra um
aviso). Se nenhuma notícia for coletada, o workflow falha e nada é publicado.

## Configuração do GitHub Pages (uma única vez)

**Settings → Pages → Build and deployment → Source: GitHub Actions**.

Se o repositório não se chamar `belmont` (ou usar domínio próprio), ajuste o
`base` em `vite.config.js` e a URL no `public/404.html` para o caminho
correspondente.

## Desenvolvimento

```bash
npm install       # instalar dependências
npm run dev       # servidor de desenvolvimento
npm test          # testes (Vitest)
npm run build     # build de produção (dist/ com data/)
```

Estrutura: `generator/` (scripts de geração), `src/` (site React),
`data/` (fontes e edições), `.github/workflows/` (Actions).
```

- [ ] **Step 2: Verificação final completa**

Run: `npm test && npm run build && node -e "const {readFileSync}=require('fs');const {parse}=require('yaml');for (const f of ['.github/workflows/gerar-edicao.yml','.github/workflows/deploy.yml']){parse(readFileSync(f,'utf8'))};console.log('workflows ok')" && ls dist/data/editions/index.json`
Expected: todos os testes passam, build conclui, workflows parseiam, `dist/data/editions/index.json` existe.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: manual do administrador"
```

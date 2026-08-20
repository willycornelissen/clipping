# Belmont — Resumo de Notícias Curadas

**Data**: 2026-08-20
**Status**: Aprovado pelo usuário (design validado seção por seção)
**Caminho**: Architectural (projeto greenfield)

## 1. Visão geral

Belmont é um jornal digital estático que apresenta resumos, gerados por LLM, das
notícias mais recentes de fontes cadastradas por um administrador. As edições são
geradas sob demanda: o admin dispara a geração, a aplicação coleta as notícias,
a LLM resume cada uma em português, e a nova edição é publicada no site.

Decisões validadas com o usuário:

- Consumo: **site/página web** hospedado no **GitHub Pages**
- Coleta: **RSS preferencial + scraping de HTML como alternativa** para sites sem feed
- Resumos: **LLM gera automaticamente**; admin não escreve nem edita textos
- Seleção de notícias na edição: **automática por data** (mais recentes por fonte)
- LLM configurável, resumos **sempre em português**
- Leitores acessam **arquivo de edições anteriores**
- **Admin único** (dono do repositório)

## 2. Arquitetura

Constraint fundamental: GitHub Pages serve apenas arquivos estáticos. Toda a
inteligência (coleta, LLM, montagem da edição) roda em **GitHub Actions**; o
Pages apenas apresenta o resultado.

```
┌─────────────────────┐      ┌──────────────────────┐      ┌───────────────────┐
│  admin (UI GitHub)  │      │  GitHub Actions      │      │  Site estático    │
│  - sources.yml      │─────▶│  1. lê sources.yml   │─────▶│  (GitHub Pages)   │
│  - Secrets (LLM)    │ run  │  2. coleta notícias  │ JSON │  lê JSON e rende- │
│  - Run workflow     │      │  3. LLM resume       │      │  riza as edições  │
└─────────────────────┘      │  4. commita edição   │      └───────────────────┘
                             └──────────────────────┘
```

Três componentes, todos num único repositório:

1. **Workflow de geração** (`gerar-edicao.yml`): disparado manualmente. Coleta
   notícias das fontes, gera resumos via LLM, grava a edição como JSON e
   commita. O commit no branch principal dispara o build e deploy no Pages.
2. **Dados**: edições são arquivos JSON versionados no repositório
   (`data/editions/`). O histórico de edições é o histórico de arquivos.
3. **Site público**: aplicação Vite + React, build estático, que carrega o
   índice de edições e renderiza a atual e as anteriores.

Frontend: **Vite + React + react-router** (BrowserRouter com fallback `404.html`
para URLs limpas no Pages). Mobile-first, tipografia jornalística, sem
interações além da navegação.

## 3. Estrutura de dados

### 3.1 `sources.yml` (editável pelo admin via UI do GitHub)

```yaml
sources:
  - id: g1                # identificador único (slug)
    nome: G1
    tipo: rss             # "rss" | "html"
    url: https://g1.globo.com/rss/g1/
    max_noticias: 5       # quantas notícias pegar por fonte
    ativo: true

  - id: exemplo-portal
    nome: Portal Exemplo
    tipo: html            # scraping: exige seletores CSS
    url: https://exemplo.com.br/noticias
    seletores:
      item: "article.noticia"        # elemento repetido de cada notícia
      titulo: "h2 a"                 # dentro do item
      link: "h2 a[href]"             # atributo href
    max_noticias: 3
    ativo: true
```

### 3.2 `data/editions/index.json` (gerado pelo workflow)

```json
{
  "edicoes": [
    { "id": "2026-08-20", "data": "2026-08-20", "fontes": 4, "noticias": 18 }
  ]
}
```

### 3.3 `data/editions/<data>.json` (uma edição)

```json
{
  "id": "2026-08-20",
  "gerada_em": "2026-08-20T14:32:00Z",
  "noticias": [
    {
      "titulo": "Manchete original da notícia",
      "fonte": "G1",
      "url": "https://g1.globo.com/...",
      "publicada_em": "2026-08-20T09:00:00Z",
      "resumo": "Resumo de 2-3 frases gerado pela LLM, em português."
    }
  ]
}
```

Regras: `max_noticias` por fonte vem do `sources.yml` (default: 5 se omitido;
`ativo` default: true); duplicatas (mesma URL normalizada) são descartadas;
notícias ordenadas por data de publicação (mais recentes primeiro). O ID e a
data da edição usam o dia corrente no fuso `America/Sao_Paulo` — uma edição
disparada às 23h de 20/08 ou às 2h de 21/08 (horário de Brasília) pertence ao
dia correspondente em Brasília.

## 4. Workflow de geração

Arquivo `.github/workflows/gerar-edicao.yml`, trigger `workflow_dispatch`
(manual). Passos:

1. Checkout do repositório e setup do Node.js
2. **Coleta** por fonte ativa:
   - `tipo: rss`: parser de feed (rss-parser) — título, link, data e conteúdo
     do item
   - `tipo: html`: fetch da página + extração com seletores CSS (cheerio)
3. **Normalização**: dedupe por URL normalizada, ordenação por data, corte em
   `max_noticias` por fonte
4. **Resumos via LLM**: uma chamada por notícia, sequencial, ao endpoint
   configurado (esquema compatível com a API OpenAI). Prompt de sistema fixo em
   português: resumo de 2-3 frases, tom jornalístico neutro. Entrada: título +
   conteúdo disponível no feed/scraping.
5. **Escrita**: grava `data/editions/<data>.json` e atualiza `index.json`.
   Edição existente na mesma data é **sobrescrita** (regeneração intencional).
6. **Commit** com `GITHUB_TOKEN` (permissão `contents: write`), disparando o
   workflow de build & deploy do Pages.

Tempo esperado: 1-3 minutos por edição.

## 5. Site público

| Rota | Conteúdo |
|---|---|
| `/` | Edição mais recente: cabeçalho com data, notícias agrupadas por fonte (ordem do `sources.yml`) |
| `/arquivo` | Lista paginada (20 edições por página) de edições anteriores: data, nº de notícias, link |
| `/edicao/:id` | Edição específica, mesmo layout da home |

Cada notícia exibe: título (link para a original, nova aba), resumo da LLM,
fonte e horário de publicação.

Técnicas: dados por `fetch` dos JSONs; `base` do Vite para o path do Pages;
fallback `404.html` para deep links; mobile-first; alto contraste; JavaScript
mínimo.

## 6. Operação do admin

O README do repositório contém o manual do admin com os três procedimentos:

1. **Cadastrar/editar fonte**: editar `sources.yml` pela UI do GitHub (botão
   editar) e commitar. O manual inclui instruções para identificar seletores
   CSS com o DevTools para fontes `tipo: html`.
2. **Configurar LLM** (única vez): em Settings → Secrets and variables →
   Actions — secret `LLM_API_KEY`; variables `LLM_BASE_URL` (ex.:
   `https://api.openai.com/v1`) e `LLM_MODEL` (ex.: `gpt-4o-mini`). Qualquer
   API compatível com o esquema OpenAI serve (OpenAI, OpenRouter, DeepSeek,
   Groq, Ollama...).
3. **Gerar edição**: aba Actions → workflow "Gerar Edição" → Run workflow →
   acompanhar log → o site atualiza automaticamente. Rodar de novo no mesmo dia
   regenera a edição do dia.

Segurança: apenas quem tem escrita no repo dispara workflows ou vê secrets — o
admin único é o dono do repo. A chave da LLM nunca aparece em código ou no site.

## 7. Tratamento de erros

| Falha | Comportamento |
|---|---|
| Fonte RSS fora do ar / feed inválido | Pula a fonte com aviso no log; edição segue |
| Scraping sem resultados (seletores não casam) | Pula a fonte; log identifica a fonte e o motivo |
| LLM: erro de rede/timeout | 2 tentativas; após isso, usa a descrição do feed como resumo (notícia nunca fica sem texto) |
| LLM: chave inválida (401) | Workflow falha com mensagem explícita |
| Zero notícias coletadas | Workflow falha — nunca publica edição vazia |
| Item de scraping sem título ou link | Item descartado individualmente |

Chamadas à LLM sequenciais (evita rate limit); edições típicas têm 10-30
notícias.

## 8. Testes

- **Unitários** (Vitest): validação do `sources.yml`; dedupe/normalização de
  notícias; extração HTML com fixtures; parse de RSS com fixtures XML; montagem
  do JSON da edição; atualização do índice; construção do prompt e parse da
  resposta da LLM
- **Integração**: geração completa com fontes fixture + LLM mockada produz JSON
  de edição válido
- **Frontend**: renderização dos componentes com edições fixture (React
  Testing Library)
- **E2E**: checklist manual no README para a primeira edição real

Fontes reais nunca entram em teste automático (instáveis); sempre fixtures.

## 9. Fora de escopo (YAGNI)

- Autenticação de leitores / área de assinantes
- Envio por e-mail / newsletter
- Edição manual dos resumos pelo admin
- Agendamento automático de edições (cron) — geração é sempre manual
- Suporte a múltiplos admins
- Busca no acervo de edições

# Belmont

Jornal digital estático: edições com resumos (gerados por LLM) das últimas
notícias de fontes cadastradas. Site público no GitHub Pages; edições geradas
sob demanda pelo administrador via GitHub Actions.

- Site: `https://<usuario>.github.io/clipping/`
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

O site pode levar alguns minutos para refletir a nova edição (cache do CDN do Pages).

Se uma fonte estiver fora do ar, a edição é gerada sem ela (o log mostra um
aviso). Se nenhuma notícia for coletada, o workflow falha e nada é publicado.

## Configuração do GitHub Pages (uma única vez)

**Settings → Pages → Build and deployment → Source: GitHub Actions**.

O `base` do Vite e o `public/404.html` já apontam para `/clipping/` (nome deste
repositório). Se mudar o nome do repositório ou usar domínio próprio, ajuste
ambos para o caminho correspondente.

## Checklist da primeira edição

1. Configurar LLM (Secrets/Variables — seção acima)
2. Habilitar Pages (Source: GitHub Actions)
3. Actions → "Gerar Edição" → Run workflow → acompanhar até o commit automático
4. Conferir que o job `deploy` do mesmo run concluiu e o site mostra a edição na home
5. Testar um deep link (ex.: `/edicao/<data>` recarregando a página) e o arquivo
6. Se algo falhar: ler o log do workflow — fontes puladas aparecem como `[aviso]`

## Desenvolvimento

```bash
npm install       # instalar dependências
npm run dev       # servidor de desenvolvimento
npm test          # testes (Vitest)
npm run build     # build de produção (dist/ com data/)
```

Estrutura: `generator/` (scripts de geração), `src/` (site React),
`data/` (fontes e edições), `.github/workflows/` (Actions).

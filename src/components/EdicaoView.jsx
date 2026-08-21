import { useMemo } from 'react'
import { Noticia } from './Noticia.jsx'
import { formatarData } from '../formatar.js'
import { extrairCategoria, obterCategoriaDaNoticia } from '../fontes.js'

export function EdicaoView({ edicao, fontes = [] }) {
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const n of edicao.noticias) {
      const categoria = obterCategoriaDaNoticia(n, fontes)
      const chave = `${n.fonte}::${categoria}`
      if (!mapa.has(chave)) mapa.set(chave, { fonte: n.fonte, categoria, noticias: [] })
      mapa.get(chave).noticias.push(n)
    }
    return [...mapa.entries()].sort((a, b) => a[1].fonte.localeCompare(b[1].fonte) || a[1].categoria.localeCompare(b[1].categoria))
  }, [edicao, fontes])

  return (
    <div>
      <p className="data-edicao">Edição de {formatarData(edicao.id)}</p>
      {grupos.map(([chave, { fonte, categoria, noticias }]) => (
        <section key={chave}>
          <h2 className="fonte">
            {fonte}
            <span className="categoria-badge">{categoria}</span>
          </h2>
          {noticias.map((n, i) => (
            <Noticia key={`${n.url}-${i}`} noticia={n} />
          ))}
        </section>
      ))}
    </div>
  )
}

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

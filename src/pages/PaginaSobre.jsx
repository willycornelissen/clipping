import { useEffect, useState } from 'react'

export function PaginaSobre() {
  return (
    <article className="noticia">
      <h2 className="fonte">Sobre</h2>
      <p>
        A Cidade da Residência, habitualmente tratada como a Capital do país onde
        Castália está inserida, funciona como a antítese geográfica, política e
        filosófica da província pedagógica de Castália.
      </p>
      <p>
        A dualidade entre o Diário de Castália e o Diário da Capital sintetiza o
        dilema central de Hermann Hesse:
      </p>
      <dl>
        <div>
          <dt>Diário de Castália</dt>
          <dd>
            Representa a Vita Contemplativa — o espírito, a atemporalidade, a ordem
            abstrata e a torre de marfim.
          </dd>
        </div>
        <div>
          <dt>Diário da Capital</dt>
          <dd>
            Representa a Vita Activa — a matéria, a história, o conflito moral, a
            família e a responsabilidade cívica no mundo real.
          </dd>
        </div>
      </dl>
    </article>
  )
}
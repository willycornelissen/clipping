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

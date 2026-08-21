import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EdicaoView } from '../components/EdicaoView.jsx'
import { carregarEdicao } from '../api.js'
import { carregarFontes } from '../fontes.js'

export function PaginaEdicao() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ carregando: true, edicao: null, fontes: [] })

  useEffect(() => {
    let ativo = true
    Promise.all([carregarEdicao(id), carregarFontes()]).then(([edicao, fontes]) => {
      if (ativo) setEstado({ carregando: false, edicao, fontes })
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
  return <EdicaoView edicao={estado.edicao} fontes={estado.fontes} />
}

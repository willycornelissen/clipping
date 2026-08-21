import { useEffect, useState } from 'react'
import { EdicaoView } from '../components/EdicaoView.jsx'
import { carregarIndice, carregarEdicao } from '../api.js'
import { carregarFontes } from '../fontes.js'

export function PaginaEdicaoAtual() {
  const [estado, setEstado] = useState({ carregando: true, edicao: null, fontes: [] })

  useEffect(() => {
    ;(async () => {
      const [indice, fontes] = await Promise.all([carregarIndice(), carregarFontes()])
      const id = indice?.edicoes?.[0]?.id
      const edicao = id ? await carregarEdicao(id) : null
      setEstado({ carregando: false, edicao, fontes })
    })()
  }, [])

  if (estado.carregando) return <p>Carregando…</p>
  if (!estado.edicao) return <p>Ainda não há edições publicadas.</p>
  return <EdicaoView edicao={estado.edicao} fontes={estado.fontes} />
}

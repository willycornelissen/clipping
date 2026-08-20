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

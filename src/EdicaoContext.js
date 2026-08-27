import { createContext, useContext, useState } from 'react'

export const EdicaoContext = createContext({ dataEdicao: null, setDataEdicao: () => {} })

export function useEdicaoContext() {
  return useContext(EdicaoContext)
}

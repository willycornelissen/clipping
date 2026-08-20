const base = import.meta.env.BASE_URL

export async function carregarIndice() {
  try {
    const resp = await fetch(`${base}data/editions/index.json`)
    if (!resp.ok) return null
    return resp.json()
  } catch {
    return null
  }
}

export async function carregarEdicao(id) {
  try {
    const resp = await fetch(`${base}data/editions/${id}.json`)
    if (!resp.ok) return null
    return resp.json()
  } catch {
    return null
  }
}

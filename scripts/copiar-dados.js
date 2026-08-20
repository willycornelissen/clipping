import { cpSync, mkdirSync } from 'node:fs'

mkdirSync('dist', { recursive: true })
cpSync('data', 'dist/data', { recursive: true })
console.log('data/ copiado para dist/data/')

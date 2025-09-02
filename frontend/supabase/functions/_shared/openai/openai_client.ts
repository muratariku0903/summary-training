import OpenAI from 'https://esm.sh/openai@4.55.3'

// Edge Function で env 取得（前回の config.ts を再利用しているなら差し替えてOK）
const API_KEY = Deno.env.get('OPENAI_API_KEY')
if (!API_KEY) throw new Error('Missing env: OPENAI_API_KEY')

export const openai = new OpenAI({ apiKey: API_KEY })

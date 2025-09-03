// JSTのYYYY/MM/DDを返す
export function ymdJST(d = new Date()) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const yyyy = j.getUTCFullYear()
  const mm = String(j.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(j.getUTCDate()).padStart(2, '0')
  return { yyyy, mm, dd }
}

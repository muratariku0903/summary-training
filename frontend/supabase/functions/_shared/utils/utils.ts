// JSTのYYYY/MM/DDを返す
export function ymdJST(d = new Date()) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const yyyy = j.getUTCFullYear()
  const mm = String(j.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(j.getUTCDate()).padStart(2, '0')
  return { yyyy, mm, dd }
}

// 正規化
export function normalizeCanonical(raw: string): string {
  // 全角・半角カタカナ、旧字体、環境依存文字などの表記揺れを統一
  let s = raw.normalize('NFKC').toLowerCase()
  // 不要な記号、スペースを排除
  s = s.replace(/[（(]([^）)]+)[）)]/g, ' $1 ') // 括弧内も語として扱う
  s = s.replace(/[_/[\\\-–—:+*.,;!?|]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export class HttpError extends Error {
  constructor(
    public status = 400,
    public code = 'BAD_REQUEST', // ログ/クライアント共通の短いコード
    public publicMessage = '不正なリクエストです。', // クライアントに出す無害化された文言
    messageForLog?: string, // ログ用の詳細（レスポンスには出さない）
  ) {
    super(messageForLog ?? publicMessage)
  }
}

const baseHeaders: HeadersInit = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

/** 成功レスポンス（内部情報はそのまま返して OK なデータだけ渡す） */
export function jsonOk<T>(data: T, status = 200, extraHeaders?: HeadersInit) {
  const body = { ok: true, data }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...baseHeaders, ...extraHeaders },
  })
}

/** エラーレスポンス（常にサニタイズ） */
export function jsonErr(err: unknown, initStatus = 500, extraHeaders?: HeadersInit) {
  const requestId = crypto.randomUUID()

  // 返却用（無害化）
  let status = initStatus
  let code = 'INTERNAL_ERROR'
  let message = '予期しないエラーが発生しました。' // プロダクション向けの汎用文言

  if (err instanceof HttpError) {
    status = err.status
    code = err.code
    message = err.publicMessage // ← クライアント向けの無害化文言
  }

  // ログには詳細（スタック含む）を残すが、レスポンスには出さない
  // requestId を一緒に出すと問い合わせ対応がしやすい
  console.error('[edge-fn:error]', { requestId, code, err })

  // もし開発環境でだけ詳細を見たい場合は、以下のようにレスポンスではなく
  // ログにだけ stack を出す運用に留めるのが安全
  // if (env !== 'prod' && err instanceof Error) console.error(err.stack);

  const body = {
    ok: false as const,
    error: { code, message },
    requestId,
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...baseHeaders, ...extraHeaders },
  })
}

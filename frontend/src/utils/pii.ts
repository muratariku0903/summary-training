/**
 * マスク対象のPII（個人識別情報）項目
 */
export const PII_FIELDS = {
  EMAIL: ['email', 'mail', 'emailaddress', 'user_email'],
  PHONE: ['phone', 'phonenumber', 'tel', 'telephone', 'mobile'],
  NAME: [
    'name',
    'fullname',
    'firstname',
    'lastname',
    'username',
    'userName',
    'displayname',
  ],
  PASSWORD: [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'apikey',
    'accesstoken',
    'refreshtoken',
  ],
  ADDRESS: ['address', 'street', 'city', 'prefecture', 'postalcode', 'zipcode', 'zip'],
  ID_NUMBER: ['idnumber', 'nationalid', 'ssn', 'mynumber', 'driverlicense'],
  FINANCIAL: ['creditcard', 'cardnumber', 'cvv', 'bankaccount', 'iban'],
  IP: ['ip', 'ipaddress', 'clientip', 'remoteaddr'],
  BIRTH_DATE: ['birthdate', 'dateofbirth', 'birthday', 'dob'],
} as const

/**
 * サニタイズ設定
 */
interface SanitizeOptions {
  /** 最大再帰深度（デフォルト: 5） */
  maxDepth?: number
  /** 配列の最大要素数（デフォルト: 100） */
  maxArrayLength?: number
  /** オブジェクトの最大キー数（デフォルト: 50） */
  maxObjectKeys?: number
  /** サニタイズをスキップするかどうか（開発環境用） */
  skip?: boolean
}

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  maxDepth: 5,
  maxArrayLength: 100,
  maxObjectKeys: 50,
  skip: false,
}

/**
 * フィールド名を正規化（キャメルケース、スネークケース、パスカルケースを統一）
 * 例: "user_email", "userEmail", "UserEmail" → "useremail"
 */
function normalizeFieldName(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '')
}

// すべてのPIIフィールド名を正規化したSetを作成（高速検索用）
const PII_FIELD_SET = new Set(
  Object.values(PII_FIELDS)
    .flat()
    .map((field) => normalizeFieldName(field)),
)

// 完全マスク対象
const COMPLETE_MASK_SET = new Set(
  PII_FIELDS.PASSWORD.map((field) => normalizeFieldName(field)),
)

// 部分マスク対象
const PARTIAL_MASK_SET = new Set(
  [
    ...PII_FIELDS.EMAIL,
    ...PII_FIELDS.PHONE,
    ...PII_FIELDS.ID_NUMBER,
    ...PII_FIELDS.FINANCIAL,
  ].map((field) => normalizeFieldName(field)),
)

/**
 * フィールド名がPII対象かどうかを高速チェック
 * 完全一致と部分一致の両方をチェック
 */
function isPIIField(key: string): boolean {
  const normalizedKey = normalizeFieldName(key)

  // 完全一致チェック
  if (PII_FIELD_SET.has(normalizedKey)) {
    return true
  }

  // 部分一致チェック（PII対象のキーワードがフィールド名に含まれているか）
  for (const piiField of PII_FIELD_SET) {
    if (normalizedKey.includes(piiField)) {
      return true
    }
  }

  return false
}

/**
 * 完全マスク対象かどうかをチェック
 * 完全一致と部分一致の両方をチェック
 */
function isCompleteMaskField(key: string): boolean {
  const normalizedKey = normalizeFieldName(key)

  // 完全一致チェック
  if (COMPLETE_MASK_SET.has(normalizedKey)) {
    return true
  }

  // 部分一致チェック
  for (const maskField of COMPLETE_MASK_SET) {
    if (normalizedKey.includes(maskField)) {
      return true
    }
  }

  return false
}

/**
 * 部分マスク対象かどうかをチェック
 * 完全一致と部分一致の両方をチェック
 */
function isPartialMaskField(key: string): boolean {
  const normalizedKey = normalizeFieldName(key)

  // 完全一致チェック
  if (PARTIAL_MASK_SET.has(normalizedKey)) {
    return true
  }

  // 部分一致チェック
  for (const maskField of PARTIAL_MASK_SET) {
    if (normalizedKey.includes(maskField)) {
      return true
    }
  }

  return false
}

/**
 * メールアドレスをマスク
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***.***'

  const maskedLocal =
    local.length > 2
      ? `${local[0]}${'*'.repeat(Math.min(local.length - 1, 10))}`
      : '*'.repeat(local.length)

  return `${maskedLocal}@${domain}`
}

/**
 * 電話番号をマスク
 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return '***-****-****'

  const prefix = digits.slice(0, 3)
  const suffix = digits.slice(-4)

  return `${prefix}-****-${suffix}`
}

/**
 * クレジットカード番号をマスク
 */
function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 4) return '****-****-****-****'

  const lastFour = digits.slice(-4)
  return `****-****-****-${lastFour}`
}

/**
 * 文字列の一部をマスク
 */
function maskPartial(value: string, visibleChars: number = 1): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length)
  const masked = '*'.repeat(Math.min(value.length - visibleChars, 10))
  return `${value.slice(0, visibleChars)}${masked}`
}

/**
 * 完全マスク
 */
function maskComplete(): string {
  return '[REDACTED]'
}

/**
 * フィールド名に基づいて適切なマスク処理を適用
 */
function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value

  const normalizedKey = normalizeFieldName(key)

  // 完全マスク
  if (isCompleteMaskField(key)) {
    return maskComplete()
  }

  // メールアドレス
  if (
    PII_FIELDS.EMAIL.some((field) => normalizedKey.includes(normalizeFieldName(field)))
  ) {
    return maskEmail(value)
  }

  // 電話番号
  if (
    PII_FIELDS.PHONE.some((field) => normalizedKey.includes(normalizeFieldName(field)))
  ) {
    return maskPhone(value)
  }

  // クレジットカード（FINANCIALフィールドをチェック）
  if (
    PII_FIELDS.FINANCIAL.some((field) =>
      normalizedKey.includes(normalizeFieldName(field)),
    )
  ) {
    return maskCreditCard(value)
  }

  // その他の部分マスク対象
  if (isPartialMaskField(key)) {
    return maskPartial(value)
  }

  return value
}

/**
 * オブジェクト内のPII情報を再帰的にマスク
 */
export function sanitizePII(
  data: unknown,
  options: SanitizeOptions = {},
  currentDepth: number = 0,
  visited: WeakSet<object> = new WeakSet(),
): unknown {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // スキップフラグが有効な場合は何もしない
  if (opts.skip) return data

  // 最大深度チェック
  if (currentDepth >= opts.maxDepth) {
    return '[Max depth reached]'
  }

  // プリミティブ型
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data

  // 循環参照チェック
  if (visited.has(data)) {
    return '[Circular Reference]'
  }

  // 訪問済みとしてマーク
  visited.add(data)

  // 配列
  if (Array.isArray(data)) {
    // 配列の長さ制限
    const limitedArray = data.slice(0, opts.maxArrayLength)
    const result = limitedArray.map((item) =>
      sanitizePII(item, opts, currentDepth + 1, visited),
    )

    // 切り捨てられた要素がある場合
    if (data.length > opts.maxArrayLength) {
      result.push(`[... ${data.length - opts.maxArrayLength} more items]`)
    }

    return result
  }

  // オブジェクト
  const entries = Object.entries(data)

  // オブジェクトのキー数制限
  if (entries.length > opts.maxObjectKeys) {
    const limitedEntries = entries.slice(0, opts.maxObjectKeys)
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of limitedEntries) {
      // PII対象フィールドかチェック
      if (isPIIField(key)) {
        // 文字列の場合はマスク処理
        if (typeof value === 'string') {
          sanitized[key] = maskValue(key, value)
        } else if (typeof value === 'object' && value !== null) {
          // オブジェクトや配列の場合は再帰処理
          sanitized[key] = sanitizePII(value, opts, currentDepth + 1, visited)
        } else {
          sanitized[key] = value
        }
      } else {
        // PII対象でない場合も再帰的にチェック（セキュリティ重視）
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizePII(value, opts, currentDepth + 1, visited)
        } else {
          sanitized[key] = value
        }
      }
    }

    sanitized['[truncated]'] = `${entries.length - opts.maxObjectKeys} more keys`
    return sanitized
  }

  // 通常のサニタイズ処理
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of entries) {
    // PII対象フィールドかチェック
    if (isPIIField(key)) {
      // 文字列の場合はマスク処理
      if (typeof value === 'string') {
        sanitized[key] = maskValue(key, value)
      } else if (typeof value === 'object' && value !== null) {
        // オブジェクトや配列の場合は再帰処理
        sanitized[key] = sanitizePII(value, opts, currentDepth + 1, visited)
      } else {
        sanitized[key] = value
      }
    } else {
      // PII対象でない場合も再帰的にチェック（セキュリティ重視）
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizePII(value, opts, currentDepth + 1, visited)
      } else {
        sanitized[key] = value
      }
    }
  }

  return sanitized
}

/**
 * ログメッセージ内のPII情報を検出してマスク
 */
export function sanitizeLogMessage(message: string): string {
  // メールアドレスパターンをマスク
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  message = message.replace(emailRegex, (match) => maskEmail(match))

  // URLパラメータの値をマスク
  const urlParamRegex = /([?&])(token|key|password|secret|apikey)=([^&\s]+)/gi
  message = message.replace(urlParamRegex, '$1$2=[REDACTED]')

  // 電話番号パターンをマスク
  const phoneRegex = /(\d{2,4})-(\d{2,4})-(\d{4})/g
  message = message.replace(phoneRegex, (match) => maskPhone(match))

  return message
}

import React from 'react'

/**
 * 汎用ボタンコンポーネント
 * ---------------------------------------------------------------------------
 * - `variant` でプライマリ(黒/白) または 危険操作用(赤) を切り替えます。
 * - `reverse` が true の場合は前景色と背景色を入れ替えます。(※ danger には適用されません)
 * - `border`, `disabled` などのオプションにも対応しています。
 * ---------------------------------------------------------------------------
 */
export type ReversalButtonProps = {
  /** ボタンに表示するラベル */
  label: string
  /** クリックハンドラ */
  onClick?: () => void
  /** ボタンを無効化します */
  disable?: boolean
  /** 黒色 2px の枠線を表示します */
  border?: boolean
  /** HTML 標準の button type (既定値: 'button') */
  type?: 'button' | 'submit' | 'reset'
  /** 通常配色を反転させる (danger 時は無視) */
  reverse?: boolean
  /** ボタンの種類: 'primary' | 'danger' (既定値: 'primary') */
  variant?: 'primary' | 'danger'
  /** testId */
  testId?: string
}

const ReversalButton: React.FC<ReversalButtonProps> = ({
  label,
  onClick,
  border,
  type = 'button',
  reverse = false,
  variant = 'primary',
  disable = false,
  testId,
}) => {
  // 共通クラス
  const baseClasses =
    'font-bold py-2 px-4 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  // 枠線カラー (variant に合わせて変化) --------------------------------------
  const borderColorClass = variant === 'danger' ? 'border-red-600' : 'border-black'
  const borderClasses = border ? `border-2 ${borderColorClass}` : ''
  // プライマリ(黒/白)の配色パターン
  const normalClasses = 'text-black bg-white hover:bg-black hover:text-white'
  const reverseClasses = 'text-white bg-black hover:bg-white hover:text-black'

  // 危険操作(赤)の配色パターン
  const dangerClasses = 'text-white bg-red-600 hover:bg-white hover:text-red-600'

  // variant と reverse を考慮して配色を決定
  const colorClasses =
    variant === 'danger' ? dangerClasses : reverse ? reverseClasses : normalClasses

  // disabled 時のスタイル
  const disabledClasses = disable ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type={type}
      className={`${baseClasses} ${borderClasses} ${colorClasses} ${disabledClasses}`}
      onClick={onClick}
      disabled={disable}
      data-testid={testId}
    >
      {label}
    </button>
  )
}

export default ReversalButton

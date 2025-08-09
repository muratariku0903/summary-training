import React from 'react'
import { GoPasskeyFill } from 'react-icons/go'

export type PasskeySignInButtonProps = {
  /**
   * クリック時のハンドラ。認証フローを実行する関数を渡してください。
   */
  onClick: () => void
  /** ボタンに付与したい追加のクラス名 */
  className?: string
}

/**
 * Passkeyアイコン付きのログインボタンコンポーネント
 * 外部から onClick を渡し、認証処理を実行できます。
 */
export default function PasskeySignInButton({
  onClick,
  className = '',
}: PasskeySignInButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex items-center justify-center \
         border border-gray-300 rounded-md \
         px-4 py-2 hover:bg-gray-50 transition \
         ${className}`}
    >
      <GoPasskeyFill className='mr-2' size={24} />
      <span className='font-medium'>Passkeyでログイン</span>
    </button>
  )
}

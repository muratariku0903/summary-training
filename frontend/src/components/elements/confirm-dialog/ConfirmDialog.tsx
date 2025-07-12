'use client'

import { useEffect, useState } from 'react'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'

interface ConfirmDialogProps {
  /** ダイアログの表示状態 */
  isOpen: boolean
  /** ダイアログを閉じる関数 */
  onClose: () => void
  /** 確認ボタンクリック時の処理 */
  onConfirm: () => void | Promise<void>
  /** ダイアログのタイトル */
  title: string
  /** ダイアログのメッセージ */
  message: string
  /** 確認ボタンのラベル（デフォルト: 削除） */
  confirmLabel?: string
  /** キャンセルボタンのラベル（デフォルト: キャンセル） */
  cancelLabel?: string
  /** 確認ボタンの色（デフォルト: danger） */
  variant?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '削除',
  cancelLabel = 'キャンセル',
  variant = 'primary',
}: ConfirmDialogProps) {
  // ESCキーでダイアログを閉じる
  // TODO　　DOMにuseEffectを使ってイベントを追加するのはアンチパターンなので修正する
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // ダイアログが開いているときはページのスクロールを無効化
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, isProcessing])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsProcessing(true)
    await onConfirm()
    setIsProcessing(false)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose()
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white border-2 border-black p-6 max-w-md w-full mx-4 shadow-lg'>
        <div className='space-y-4'>
          {/* タイトル */}
          <h2 className='text-xl font-semibold text-center'>{title}</h2>

          {/* メッセージ */}
          <p className='text-gray-700 text-center whitespace-pre-line'>{message}</p>

          {/* ボタン */}
          <div className='flex justify-center gap-3 pt-4'>
            <ReversalButton
              label={cancelLabel}
              onClick={onClose}
              disable={isProcessing}
            />
            <ReversalButton
              label={isProcessing ? '処理中...' : confirmLabel}
              onClick={handleConfirm}
              disable={isProcessing}
              border
              reverse
              variant={variant}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

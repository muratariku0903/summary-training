'use client'

import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { useEffect, useState } from 'react'

export default function Snackbar() {
  const { open, message, severity } = useSnackbarStore()

  // Tailwind の opacity トランジションを使ったフェード
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true) // マウント直後に 100% へ
    } else {
      // アニメ後に DOM から外したい場合はここで delay を付けても OK
      setVisible(false)
    }
  }, [open])

  const base =
    'fixed bottom-6 right-6 px-4 py-2 rounded shadow-lg transition-opacity duration-300 text-white pointer-events-none'

  const color = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600 text-black',
  }[severity]

  return (
    <div
      className={`${base} ${color} ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-live='polite'
      role='status'
    >
      {message}
    </div>
  )
}

import { create } from 'zustand'

type Severity = 'success' | 'error' | 'info' | 'warning'

type SnackbarState = {
  open: boolean
  message: string
  severity: Severity
  show: (msg: string, severity?: Severity, ms?: number) => void
  hide: () => void
}

let timeoutId: ReturnType<typeof setTimeout> | undefined

export const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'success',

  show: (msg, severity = 'success', ms = 3000) => {
    // 既存のタイマーがあればキャンセル
    clearTimeout(timeoutId)
    set({ open: true, message: msg, severity })

    timeoutId = setTimeout(() => {
      set({ open: false })
    }, ms)
  },

  hide: () => {
    clearTimeout(timeoutId)
    set({ open: false })
  },
}))

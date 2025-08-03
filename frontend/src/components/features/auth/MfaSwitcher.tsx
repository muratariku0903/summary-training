'use client'

import { useState } from 'react'

import { MfaFactor } from '@/lib/supabase/auth/types'
import MfaVerificationInput from '@/components/features/auth/MfaVerificationInput'
import MfaSelection from '@/components/features/auth/MfaSelection'
import { useRouter } from 'next/navigation'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { UI_MESSAGES } from '@/lib/constants/ui'

interface MfaSwitcherProps {
  initSelectedMFA: MfaFactor | null
  selectableMFAList: MfaFactor[]
  onVerifyComplete?: () => void
}

export default function MfaSwitcher({
  initSelectedMFA,
  selectableMFAList,
  onVerifyComplete,
}: MfaSwitcherProps) {
  const router = useRouter()
  const showSnackbar = useSnackbarStore((s) => s.show)
  const [selectedMFA, setSelectedMFA] = useState<MfaFactor | null>(initSelectedMFA)

  // MFAの検証方法が選択されている場合はそれぞれに合わせた検証画面を表示
  if (selectedMFA) {
    return (
      <MfaVerificationInput
        selectedMFA={selectedMFA}
        onVerifyComplete={() => {
          if (onVerifyComplete) {
            onVerifyComplete()
          } else {
            showSnackbar(UI_MESSAGES.SIGNIN_SUCCESS_MESSAGE, 'success')
            router.replace(PROTECTED_PATHS.DASHBOARD)
          }
        }}
        onBack={() => setSelectedMFA(null)}
      />
    )
  }

  // MFAの認証方法が選択されてない場合は選択させる
  return (
    <MfaSelection
      selectableMFAList={selectableMFAList}
      selectedMFA={selectedMFA}
      onMfaSelect={setSelectedMFA}
    />
  )
}

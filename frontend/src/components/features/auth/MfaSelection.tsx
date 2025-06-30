'use client'

import Header, { HeaderMenuType } from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import { MfaFactor } from '@/lib/supabase/auth/types'

interface MfaSelectionProps {
  selectableMFAList: MfaFactor[]
  selectedMFA: MfaFactor | null
  onMfaSelect: (mfa: MfaFactor | null) => void
}

export default function MfaSelection({
  selectableMFAList,
  selectedMFA,
  onMfaSelect,
}: MfaSelectionProps) {
  const getMfaDisplayName = (mfa: MfaFactor) => {
    const typeDisplay =
      mfa.type === 'totp' ? 'TOTP認証アプリ' : mfa.type.toUpperCase() + '認証'
    return mfa.friendlyName ? `${typeDisplay} (${mfa.friendlyName})` : typeDisplay
  }

  return (
    <>
      <Header menuType={HeaderMenuType.HIDDEN} />
      <Main>
        <div className='flex justify-center py-4'>
          <div className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'>
            <h1 className='text-center text-2xl font-semibold'>認証方法を選択</h1>

            <div className='space-y-4'>
              <label className='block text-sm font-medium'>認証方法</label>
              <select
                className='w-full p-2 border border-gray-300 rounded'
                value={selectedMFA?.id || ''}
                onChange={(e) => {
                  const selected = selectableMFAList.find(
                    (mfa) => mfa.id === e.target.value
                  )
                  onMfaSelect(selected || null)
                }}
              >
                <option value=''>選択してください</option>
                {selectableMFAList.map((mfa) => (
                  <option key={mfa.id} value={mfa.id}>
                    {getMfaDisplayName(mfa)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}

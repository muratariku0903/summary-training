'use client'

import OutlineButton from '@/components/elements/outline-button/OutlineButton'

import { MfaType } from '@/lib/supabase/auth/types'

export type AuthenticationMethodItem = {
  type: MfaType
  name: string
  desc: string
  enable: boolean
  onClickUpdate: () => void
  onClickReset: () => void
}
type TwoFactorAuthenticationMethodListProps = {
  items: AuthenticationMethodItem[]
}

export default function TwoFactorAuthenticationSetting({
  items,
}: TwoFactorAuthenticationMethodListProps) {
  return (
    <>
      <div className='space-y-4'>
        {items.map((item) => {
          const isEnabled = item.enable

          return (
            <div key={item.type} className='p-4 border-2 border-black bg-gray-50 rounded'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <h3 className='font-medium text-lg'>{item.name}</h3>
                  <p className='text-sm text-gray-600 mb-2'>{item.desc}</p>
                  <span
                    className={`text-sm ${isEnabled ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isEnabled ? '有効' : '無効'}
                  </span>
                </div>
                <div>
                  <OutlineButton
                    label={isEnabled ? '削除' : '設定'}
                    className='text-sm px-3 py-1'
                    onClick={() => {
                      if (isEnabled) {
                        item.onClickReset()
                        return
                      }

                      item.onClickUpdate()
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

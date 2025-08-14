'use client'

import { ProfileIcon, AccountIcon } from '@/components/icons/icons'
import { S } from '../../../../test/e2e/const/selector'

// メニューアイテムの型定義
export type MenuKey = 'basic' | 'account'

interface MenuItem {
  key: MenuKey
  label: string
  icon: React.ReactNode
  testId?: string
}

interface ProfileSideMenuProps {
  activeMenu: MenuKey
  onMenuChange: (menu: MenuKey) => void
}

export default function ProfileSideMenu({
  activeMenu,
  onMenuChange,
}: ProfileSideMenuProps) {
  // サイドメニューの設定
  const menuItems: MenuItem[] = [
    {
      key: 'basic',
      label: '基本情報',
      icon: <ProfileIcon />,
      testId: S.profileSideMenuBasicInfo,
    },
    {
      key: 'account',
      label: 'アカウント',
      icon: <AccountIcon />,
      testId: S.profileSideMenuAccount,
    },
  ]

  return (
    <div className='w-64 bg-white border-2 border-black p-4'>
      <h2 className='text-lg font-semibold mb-4 text-center'>プロフィール設定</h2>
      <nav>
        <ul className='space-y-2'>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onMenuChange(item.key)}
                className={`
                  w-full 
                  flex 
                  items-center 
                  px-4 
                  py-3 
                  text-left 
                  border-2 
                  transition-colors 
                  duration-200
                  ${
                    activeMenu === item.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }
                `}
                data-testid={item.testId}
              >
                <span className='mr-3'>{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

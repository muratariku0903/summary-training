import ReversalLink from '@/components/elements/reversal-link/ReversalLink'
import { Spacer } from '@/components/elements/spacer/Spacer'
import UnderlineLink from '@/components/elements/underline-link/UnderlineLink'

type HeaderProps = {
  enableMenu?: boolean
}

const Header: React.FC<HeaderProps> = ({ enableMenu = true }) => {
  return (
    <header className='flex justify-between items-center p-8 text-black'>
      <div className='flex items-center'>
        <h1 className='ml-2 text-xl font-bold'>要約訓練</h1>
      </div>
      {enableMenu && (
        <div>
          <UnderlineLink label='使い方' href='#' />
          <Spacer size={8} horizontal />
          <UnderlineLink label='メリット' href='#' />
          <Spacer size={40} horizontal />
          <ReversalLink label='ログイン' href='/login' />
          <Spacer size={8} horizontal />
          <ReversalLink label='新規登録' href='/signup' />
        </div>
      )}
    </header>
  )
}

export default Header

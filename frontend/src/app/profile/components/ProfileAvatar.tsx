import Image from 'next/image'

type ProfileAvatarProps = {
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ProfileAvatar({
  avatarUrl,
  size = 'md',
  className = '',
}: ProfileAvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  }

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const imageSizes = {
    sm: 48,
    md: 80,
    lg: 128,
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-300 border-2 border-black flex items-center justify-center ${className}`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt='プロフィール画像'
          width={imageSizes[size]}
          height={imageSizes[size]}
          className='w-full h-full object-cover'
          priority={false}
        />
      ) : (
        <svg
          className={`${iconSizes[size]} text-gray-600`}
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path
            fillRule='evenodd'
            d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
            clipRule='evenodd'
          />
        </svg>
      )}
    </div>
  )
}

import React from 'react'
import styles from './ReversalLink.module.css'

type ReversalLinkProps = {
  label: string
  href: string
  onClick?: () => void
  testId?: string
}

const ReversalLink: React.FC<ReversalLinkProps> = ({ label, href, onClick, testId }) => {
  return (
    <a
      className={styles['reversal-link']}
      href={href}
      onClick={onClick}
      data-testid={testId}
    >
      {label}
    </a>
  )
}

export default ReversalLink

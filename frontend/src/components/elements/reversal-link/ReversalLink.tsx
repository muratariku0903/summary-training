import React from 'react'
import styles from './ReversalLink.module.css'

type ReversalLinkProps = {
  label: string
  href: string
  onClick?: () => void
}

const ReversalLink: React.FC<ReversalLinkProps> = ({ label, href, onClick }) => {
  return (
    <a className={styles['reversal-link']} href={href} onClick={onClick}>
      {label}
    </a>
  )
}

export default ReversalLink

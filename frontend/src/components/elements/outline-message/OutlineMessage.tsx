import React from 'react'

export enum MessageType {
  ERROR = 'error',
  SUCCESS = 'success',
}

interface OutlineMessageProps {
  message: string
  type?: MessageType
}

export const OutlineMessage: React.FC<OutlineMessageProps> = ({ message, type }) => {
  const getMessageStyles = () => {
    switch (type) {
      case MessageType.ERROR:
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          color: '#dc2626',
        }
      case MessageType.SUCCESS:
        return {
          backgroundColor: '#f0fdf4',
          borderColor: '#22c55e',
          color: '#16a34a',
        }
      default:
        return {}
    }
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        border: '1px solid',
        borderRadius: '6px',
        ...getMessageStyles(),
      }}
    >
      {message}
    </div>
  )
}

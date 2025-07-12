import React from 'react'

export enum MessageType {
  ERROR = 'error',
  WARN = 'warn',
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
      case MessageType.WARN:
        return {
          backgroundColor: '#fefce8', // 薄い黄色の背景（yellow-50相当）
          borderColor: '#eab308', // 黄色のボーダー（yellow-500相当）
          color: '#a16207', // 濃い黄色のテキスト（yellow-700相当
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

  const getDisplayMessage = () => {
    if (type === MessageType.WARN) {
      return `⚠️ ${message}`
    }
    return message
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
      {getDisplayMessage()}
    </div>
  )
}

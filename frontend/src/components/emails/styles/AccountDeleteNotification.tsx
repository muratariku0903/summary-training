// src/emails/AccountDeletionNotification.tsx
import * as React from 'react'
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import { container, footer, heading, hr, main, text } from './styles'

interface AccountDeletionNotificationProps {
  userName?: string
  supportEmail: string
}

export default function AccountDeletionNotification({
  userName = 'ユーザー',
  supportEmail,
}: AccountDeletionNotificationProps) {
  return (
    <Html lang='ja'>
      <Head />
      {/* メール一覧画面で表示されるプレビュー文 */}
      <Preview>アカウントの退会処理が完了しました</Preview>

      <Body style={main}>
        <Container style={container}>
          {/* ヘッダー */}
          <Heading style={heading}>アカウント退会完了のお知らせ</Heading>
          <Hr style={hr} />

          {/* 挨拶＋本文 */}
          <Text style={text}>{userName} 様</Text>
          <Text style={text}>
            ご利用いただいていたアカウントの退会処理が正常に完了いたしました。
          </Text>
          <Text style={text}>これまでのご利用、誠にありがとうございました。</Text>

          {/* フォローアップ */}
          <Text style={text}>またのご利用を心よりお待ちしております。</Text>
          <Text style={text}>
            何かご不明点やご要望がございましたら、
            <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>
            までご連絡ください。
          </Text>

          {/* フッター */}
          <Text style={footer}>
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

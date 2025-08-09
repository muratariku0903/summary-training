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
import { container, footer, heading, hr, main, text } from './styles/styles'

interface PasswordChangeNotificationProps {
  userName?: string
  supportEmail: string
}

export default function PasswordChangeNotification({
  userName = 'ユーザー',
  supportEmail,
}: PasswordChangeNotificationProps) {
  return (
    <Html lang='ja'>
      <Head />
      {/* メール一覧画面で表示されるプレビュー文 */}
      <Preview>パスワード変更が正常に完了しました</Preview>

      <Body style={main}>
        <Container style={container}>
          {/* ヘッダー */}
          <Heading style={heading}>パスワード変更完了のお知らせ</Heading>
          <Hr style={hr} />

          {/* 挨拶＋本文 */}
          <Text style={text}>{userName} 様</Text>
          <Text style={text}>パスワードの変更が正常に完了しました。</Text>
          <Text style={text}>
            次回からは新しいパスワードでログインをお願いいたします。
          </Text>

          {/* 注意喚起 */}
          <Text style={text}>
            もし心当たりのない操作でしたら、できるだけ早く以下のサポートまでご連絡ください。
          </Text>
          <Text style={text}>
            サポート: <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>
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

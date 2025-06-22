'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { browserClient as supabaseBrowserClient } from '@/lib/supabase/browserClient'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'

// この画面はSupabaseからの確認メールのリンクを押下した際に遷移
export default function CallbackPage() {
  const router = useRouter()

  // TOTP 登録用に必要な state
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null)
  const [code, setCode] = useState<string>('')

  // ① ハッシュからセッション取得 → ② TOTPenroll（QR生成）
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLからセッション情報を取得
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (!accessToken || !refreshToken) {
          // TODO: セッションの取得に失敗した場合は、ユーザーに対してエラーメッセージを通知
          console.error('No tokens found in URL')
          return
        }

        // セッションを設定（この時点でブラウザに保存される）
        // 後続のTOTP Enroll処理にて内部的に認証情報を参照する
        const { data: sessionData, error: sessionError } =
          await supabaseBrowserClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

        if (sessionError) {
          console.error('Set session error:', sessionError.message)
          return
        }

        console.log('✅ Session successfully set:', sessionData.session)

        // #region TOTP Enroll処理の詳細
        // TOTP登録（enroll）の裏側処理：
        // 1. Base32エンコードされた32文字の秘密鍵を生成
        // 2. TOTP URI構築
        // 3. 秘密鍵をQRコード（SVG）として生成
        // 4. auth.mfa_factors テーブルに factor レコード作成
        // -- auth.mfa_factors テーブル
        // {
        //   id: "550e8400-e29b-41d4-a716-446655440000", -- これがenrollData.id
        //   user_id: "user_uuid",
        //   factor_type: "totp",
        //   status: "unverified", -- 初期状態
        //   secret: "暗号化された秘密鍵",
        //   created_at: "2024-01-01T00:00:00Z"
        // }
        // 5. 秘密鍵は暗号化してSupabaseに保存
        // #endregion
        const { data: enrollData, error: enrollError } =
          await supabaseBrowserClient.auth.mfa.enroll({ factorType: 'totp' })
        if (enrollError) {
          console.error('Enroll error:', enrollError.message)
          return
        }

        setFactorId(enrollData.id)
        setQrCodeSvg(enrollData.totp.qr_code) // SVG 形式の QR
      } catch (error) {
        console.error('Callback error:', error)
      }
    }

    handleCallback()
  }, [])

  // ③ ユーザー入力の6桁コードで challenge → verify
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!factorId) return

    // #region Challenge処理の詳細
    // Challenge（チャレンジ）の裏側処理：
    // 1. 一意のChallenge IDを生成（UUID形式）
    // 2. タイムスタンプを記録（有効期限管理：通常5分程度）
    // 3. Challenge状態をデータベースに保存
    // -- auth.mfa_challenges テーブル（推定）
    // {
    //   id: "challenge_uuid", -- challengeData.id
    //   factor_id: "factor_uuid", -- 対応するfactor
    //   created_at: "2024-01-01T00:00:00Z",
    //   expires_at: "2024-01-01T00:05:00Z", -- 通常5分程度
    //   verified_at: null, -- 未検証状態
    //   ip_address: "xxx.xxx.xxx.xxx"
    // }
    //
    // セキュリティ上の重要性：
    // - ワンタイム使用: 1つのChallengeは1回のみ有効
    // - 短時間有効: 通常5分程度で期限切れ
    // - Factor紐付け: 特定のTOTP要素にのみ有効
    // - リプレイ攻撃防止: 同じコードの再利用を防ぐ
    // #endregion
    const { data: challengeData, error: challengeError } =
      await supabaseBrowserClient.auth.mfa.challenge({ factorId })
    if (challengeError) {
      console.error('Challenge error:', challengeError.message)
      return
    }

    // #region Verify処理の詳細
    //　Supabaseのauth.usersにてTOTPが必要であることが登録される
    // Verify（検証）の裏側処理：
    // 1. Challenge の検証
    //    - Challenge IDの存在確認
    //    - 使用済み・期限切れチェック
    // 2. TOTP コードの検証
    //    - データベースから暗号化された秘密鍵を取得・復号化
    //    - 現在時刻(30秒間隔)でTOTPコード生成
    //    - ユーザー入力コードと比較（前後の時間窓も考慮）
    // 3. Factor の状態更新
    //    - auth.mfa_factors テーブルの status を 'verified' に更新
    // 4. Challenge の使用済み記録
    //    - auth.mfa_challenges テーブルの verified_at に現在時刻を記録
    // 5. AAL2 セッション生成
    //    - 新しいJWTトークン生成（aal: "aal2", amr: ["password", "totp"]）
    //    - refresh_token も含む完全なセッション情報
    // #endregion
    const { data: verifyData, error: verifyError } =
      await supabaseBrowserClient.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      })
    if (verifyError) {
      console.error('Verify error:', verifyError.message)
      return
    }

    // セッションを上書き（AAL2 JWT を取得）
    await supabaseBrowserClient.auth.setSession({
      access_token: verifyData.access_token,
      refresh_token: verifyData.refresh_token,
    })

    // 完了後、ダッシュボードなどへリダイレクト
    router.replace('/dashboard')
  }

  return (
    <>
      <Header enableMenu={false} />
      <Main>
        <div style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
          {!qrCodeSvg && <p>認証処理中…</p>}

          {qrCodeSvg && (
            <>
              <p>
                ① 下の QR をお手持ちの TOTP アプリ（Google Authenticator
                など）で読み込んでください。
              </p>
              <div
                // Supabase から返ってくる SVG をそのまま埋め込み
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
              {/* UIをもっとわかりやすくしたい */}
              <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                <label htmlFor='code'>② アプリに表示された 6 桁のコードを入力：</label>
                <input
                  id='code'
                  type='text'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  pattern='\d{6}'
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    margin: '0.5rem 0',
                  }}
                />
                <button type='submit' style={{ padding: '0.5rem 1rem' }}>
                  登録して完了
                </button>
              </form>
            </>
          )}
        </div>
      </Main>
      <Footer />
    </>
  )
}

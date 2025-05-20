'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layouts/header/Header';
import Footer from '@/components/layouts/footer/Footer';
import Main from '@/components/layouts/main/Main';
import ReversalButton from '@/components/elements/reversal-button/ReversalButton';
import TextInput from '@/components/elements/text-input/TextInput';
// import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Header enableMenu={false} />
      <Main>
        <div className='flex justify-center'>
          <form
            onSubmit={handleSubmit}
            className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'
          >
            <h1 className='text-center text-2xl font-semibold'>新規登録</h1>
            <TextInput
              id='name'
              labelText='ユーザーネーム'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextInput
              id='email'
              type='email'
              labelText='メールアドレス'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextInput
              id='password'
              type='password'
              labelText='パスワード'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextInput
              id='confirmPassword'
              type='password'
              labelText='パスワード（確認用）'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className='text-sm text-red-600'>{error}</p>}
            <ReversalButton label='登録' className='w-full' />
            <p className='text-center text-sm'>
              すでにアカウントをお持ちの方は{' '}
              <a
                href='/auth/login'
                className='font-medium text-indigo-600 hover:underline'
              >
                こちら
              </a>
            </p>
          </form>
        </div>
      </Main>
      <Footer />
    </>
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // 成功 → TOTP 登録ページへ
    router.push('/auth/mfa/enroll');
  }
}

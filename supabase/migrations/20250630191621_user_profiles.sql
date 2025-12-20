-- ① 会員ユーザープロフィールテーブル
create table public.user_profiles (
  -- 親テーブル (auth.users) の行が消えたら、子テーブル (public.profiles) の対応行も自動削除
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- プロフィール情報を追加
  user_name text,
  display_name text,
  bio text,
  avatar_url text
);

-- RLS を有効にし、「ログイン中の UID と一致する行だけ参照・更新可」と定義
alter table public.user_profiles enable row level security;

-- RLSポリシーを追加
create policy "Users can view own profile" 
on public.user_profiles for select 
using (auth.uid() = id);

create policy "Users can update own profile" 
on public.user_profiles for update 
using (auth.uid() = id);

create policy "Users can insert own profile" 
on public.user_profiles for insert 
with check (auth.uid() = id);

-- ② updated_atを自動更新するトリガー関数
create or replace function public.handle_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ③ 新規ユーザー作成時にプロフィールを自動作成するトリガー関数
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.user_profiles(id, user_name, display_name) 
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'userName', 'ユーザー'),
    coalesce(new.raw_user_meta_data->>'userName', 'ユーザー')
  )
  on conflict (id) do nothing;     -- 二重登録対策
  return new;
end;
$$;

-- ④ トリガーの作成
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger handle_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();

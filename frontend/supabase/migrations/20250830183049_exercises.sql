-- 題材タイプ
do $$ begin
  create type public.exercise_type as enum ('summary','explain','rewrite');
exception when duplicate_object then null; end $$;

-- 公開状態
do $$ begin
  create type public.exercise_status as enum ('draft','ready','hidden');
exception when duplicate_object then null; end $$;

-- 作成元
do $$ begin
  create type public.create_type as enum ('system','user','admin','import');
exception when duplicate_object then null; end $$;


create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  status        public.exercise_status not null default 'ready',
  create_type   public.create_type not null,
  exercise_type public.exercise_type not null,
  title         text not null check (char_length(title) between 1 and 120),
  description   text,                                -- 一覧に出す短いサマリ
  difficulty    int2 not null default 1 check (difficulty between 1 and 5),
  storage_path  text not null,                       -- Storage の index.json 等へのパス
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- 同一パスの重複登録を防止
  constraint    uq_exercises_storage_path unique (storage_path)
);

-- 更新日時を自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists trg_exercises_set_updated_at on public.exercises;
create trigger trg_exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

-- よく使う検索キーのインデックス
create index if not exists idx_exercises_status_created_at
  on public.exercises (status, created_at desc);
create index if not exists idx_exercises_created_by
  on public.exercises (created_by);


-- まずは強めに締める
revoke all on table public.exercises from anon, authenticated;

-- 行レベルセキュリティを有効化
alter table public.exercises enable row level security;

-- 参照（select）は付与する（RLSでさらに絞る）
grant select on table public.exercises to authenticated;

-- ★ 読み取りポリシー：認証済みユーザーは 'ready' の行だけ見える
drop policy if exists "read_ready_exercises_auth" on public.exercises;
create policy "read_ready_exercises_auth"
on public.exercises
for select
to authenticated
using (status = 'ready');


-- （任意）作成者は自分の draft/hidden も見られるようにする
drop policy if exists "read_own_non_ready" on public.exercises;
create policy "read_own_non_ready"
on public.exercises
for select
to authenticated
using (created_by = auth.uid());




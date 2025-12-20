-- 状態（queued を入れるのがポイント：未起動の穴を検知できる）
do $$ begin
  create type job_status as enum ('running','success','failed','warn');
exception when duplicate_object then null; end $$;

-- 実行パターン
do $$ begin
  create type job_run_mode as enum ('scheduled','manual','retry','test');
exception when duplicate_object then null; end $$;

create table if not exists public.job_runs (
  id               uuid primary key default gen_random_uuid(),
  job_key          text not null,                         -- 例: 'generate-exercises'
  run_mode         job_run_mode not null,                 -- 例: 'scheduled'
  status           job_status not null,                   -- running → success/failed/warn
  attempt          smallint not null default 0,           -- 実行試行回数（リトライで+1）
  started_at       timestamptz,                           -- running に遷移した時刻
  finished_at      timestamptz,                           -- 終了時刻
  duration_ms      integer generated always as (          -- サブクエリ不使用の生成列（OK）
                        case when started_at is not null and finished_at is not null
                             then (extract(epoch from (finished_at - started_at)) * 1000)::int
                             else null end
                      ) stored,
  metrics          jsonb not null default '{}'::jsonb,    -- {created: 42, updated: 3, ...}
  error_code       text,
  error_summary    text,                                  -- 短い要約（通知に載せる）
  error_detail     text,                                  -- 詳細（長文）
  request_id       text,                                  -- Supabase/Lambda の相関IDなど
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- updated_at 自動更新
create or replace function public._job_runs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_job_runs_set_updated_at on public.job_runs;
create trigger trg_job_runs_set_updated_at
before update on public.job_runs
for each row execute function public._job_runs_set_updated_at();

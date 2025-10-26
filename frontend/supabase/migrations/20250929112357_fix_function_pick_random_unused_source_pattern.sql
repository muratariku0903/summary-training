-- 事前：同一プロファイル×同一組合せを一意化
-- create unique index if not exists uq_profile_set
--   on public.exercise_generator_profile_source_patterns(profile_id, source_set_key);

create or replace function public.pick_random_unused_source_pattern(
  p_profile_id   uuid,
  p_kmin         int  default null,        -- NULLなら1
  p_kmax         int  default null,        -- NULLなら1
  p_max_attempts int     default 10,        -- 衝突時の軽い内部リトライ回数
  p_allow_duplicates bool default false     -- 重複許可フラグ（デフォルト：false）
)
returns table(
  pattern_id      uuid,
  source_ids      uuid[],                  -- 選ばれたソースIDの昇順配列
  source_set_key  text,                    -- 昇順連結キー（順不同を一意化）
  pattern_size    int
)
language plpgsql
as $$
declare
  v_kmin int := coalesce(p_kmin, 1);
  v_kmax int := coalesce(p_kmax, 1);
  v_k    int;
  v_n    int;        -- プール件数
  v_sid  uuid[];     -- サンプルされたID集合（昇順）
  v_id   uuid;
  v_key  text;  -- 追加: source_set_key用の変数
  i      int := 0;
begin
  -- 候補プールをSOURCESから作る（関連テーブルは見ない）
  with pool as (
    select s.id
    from public.exercise_generator_sources s
    where s.is_active = true
  )
  select count(*) into v_n from pool;

  if coalesce(v_n,0) = 0 then
    return; -- 候補ゼロ
  end if;

  -- 1 ≤ kmin ≤ kmax ≤ n にクランプ
  v_kmin := greatest(1, least(v_kmin, v_n));
  v_kmax := greatest(v_kmin, least(v_kmax, v_n));

  -- 重複許可の場合は単純にランダム選択
  if p_allow_duplicates then
    v_k := floor(random() * (v_kmax - v_kmin + 1))::int + v_kmin;

    -- ランダム抽出のみ（重複チェックなし）
    with pool as (
      select s.id
      from public.exercise_generator_sources s
      where s.is_active = true
    )
    select array_agg(id order by id) into v_sid
    from (
      select id from pool
      order by random()
      limit v_k
    ) t;

    if v_sid is not null and cardinality(v_sid) = v_k then
      -- 一時的なパターンとして返す（DBには保存しない）
      pattern_id      := null;  -- 重複許可時は新規レコードを作らない
      source_ids      := v_sid;
      source_set_key  := public.uuid_array_sorted_key(v_sid);
      pattern_size    := cardinality(v_sid);
      return next;
    end if;
    
    return;
  end if;

  -- 重複不許可の場合は未選択パターンを確保できるまで再試行
  -- 未選択（未登録）パターンを確保できるまで小さく再試行
  while i < coalesce(p_max_attempts, 10) loop
    i := i + 1;

    v_k := floor(random() * (v_kmax - v_kmin + 1))::int + v_kmin;

    -- ランダム抽出 → 昇順でキー化（ORDER BY random() は後で差替え可能）
    with pool as (
      select s.id
      from public.exercise_generator_sources s
      where s.is_active = true
    )
    select array_agg(id order by id) into v_sid
    from (
      select id from pool
      order by random()
      limit v_k
    ) t;

    if v_sid is null or cardinality(v_sid) <> v_k then
      continue;
    end if;

    -- “確保”として挿入（既に使われていれば衝突→空振り）
    insert into public.exercise_generator_profile_source_patterns
      (profile_id, source_ids, pattern_size)
    values
      (p_profile_id, v_sid, cardinality(v_sid))
    on conflict (profile_id, source_set_key) do nothing
    returning id, source_set_key into v_id, v_key;

    if v_id is not null then
      pattern_id      := v_id;
      source_ids      := v_sid;
      source_set_key  := v_key;
      pattern_size    := cardinality(v_sid);
      return next;
      return;
    end if;
  end loop;

  -- 確保できず（衝突/枯渇等）：0行で終了
  return;
end;
$$;

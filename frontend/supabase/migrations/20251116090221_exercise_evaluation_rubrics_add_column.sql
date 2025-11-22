-- NOT NULL 制約を追加
alter table public.exercise_evaluation_rubrics
alter column weight set not null;

-- デフォルト値を設定（今後の INSERT 時に省略可能に）
alter table public.exercise_evaluation_rubrics
alter column weight set default 1.0;

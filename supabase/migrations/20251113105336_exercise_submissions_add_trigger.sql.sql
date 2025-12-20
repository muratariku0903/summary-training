-- updated_at 自動更新トリガ
drop trigger if exists trg_exercise_submissions_updated_at on public.exercise_submissions;
create trigger trg_exercise_submissions_updated_at
  before update on public.exercise_submissions
  for each row execute function public.trigger_set_timestamp();

resource "supabase_project" "summary_training" {
  name = "summary-training"

  organization_id = var.supabase_org_id

  plan = "free"

  region = "ap-northeast-1"

  # optionalパラメータ（DBパスワードなどを指定したい場合）
  # db_pass = var.db_pass
}

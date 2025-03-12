terraform {
  required_providers {
    supabase = {
      source = "supabase/supabase"
    }
  }
}

resource "supabase_project" "summary_training" {
  name = "summary-training"

  organization_id = var.supabase_org_id

  region = "ap-northeast-1"

  database_password = "password"

  # optionalパラメータ（DBパスワードなどを指定したい場合）
  # db_pass = var.db_pass
}

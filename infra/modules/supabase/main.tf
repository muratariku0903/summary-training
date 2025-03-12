# 定義がprovider.tfと重複しているがmodule配下にも定義しないと参照するterraformレポジトリの場所が合わなくなる
terraform {
  required_providers {
    supabase = {
      source = "supabase/supabase"
    }
  }
}

# supabaseプロジェクトを作成
resource "supabase_project" "summary_training" {
  name = "summary-training"

  organization_id = var.supabase_org_id

  region = "ap-northeast-1"

  database_password = var.supabase_database_password

  # optionalパラメータ（DBパスワードなどを指定したい場合）
  # db_pass = var.db_pass
}

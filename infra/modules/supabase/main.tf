# 定義がprovider.tfと重複しているがmodule配下にも定義しないと参照するterraformレポジトリの場所が合わなくなる
terraform {
  required_providers {
    supabase = {
      source = "supabase/supabase"
    }
  }
}

# supabaseプロジェクトを作成
# 基本的プロジェクト作成後、変数を後から更新することはできない
# そのため、プロジェクト設定を変更したい場合はモジュールを呼び出してる箇所をコメントアウトし一度リソース自体を削除して再作成する必要がある。
# supabaseでは各環境ごとにプロジェクトを作成することが推奨されている
resource "supabase_project" "summary_training" {
  name = "summary-training-dev"

  organization_id = var.supabase_org_id

  region = "ap-northeast-1"

  database_password = var.supabase_database_password

  lifecycle {
    ignore_changes = [database_password]
  }
}

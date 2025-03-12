# 初期設定時、GitHub OIDCを信頼するIRMロールの作成
module "iam" {
  source          = "../../modules/iam"
  github_owner    = "muratariku0903"
  github_repo     = "summary-training"
  tf_state_bucket = "summary-training-tf-state"
}

module "supabase" {
  source          = "../../modules/supabase"
  supabase_org_id = var.supabase_org_id

  providers = {
    supabase = supabase
  }
}

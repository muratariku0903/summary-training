# 初期設定時、GitHub OIDCを信頼するIRMロールの作成
module "iam" {
  source          = "../../modules/iam"
  github_owner    = "muratariku0903"
  github_repo     = "summary-training"
  tf_state_bucket = "summary-training-tf-state"
}


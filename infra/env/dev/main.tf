# 以下リソース定義をコメントアウトするとtf.stateには存在するが定義がないのでdestroy処理が走るので注意
# 監視から除外したい場合は、terraform state rm リソース名

# 初期設定時、GitHub OIDCを信頼するIRMロールの作成
module "iam" {
  source          = "../../modules/iam"
  github_owner    = "muratariku0903"
  github_repo     = "summary-training"
  tf_state_bucket = "summary-training-tf-state"
}

terraform {
  backend "s3" {
    bucket         = "summary-training-tf-state-stage"
    key            = "terraform/state/default.tfstate" # 状態ファイルの保存パス
    region         = "ap-northeast-1"
    encrypt        = true                             # サーバーサイド暗号化を有効
  }
}

# AWS アカウントIDを動的に取得
data "aws_caller_identity" "current" {}

# GitHub OIDCを信頼するIRMロール↓
# Github　Actionsがこのロールを引き受ける。
resource "aws_iam_role" "github_actions_role" {
  name = "GitHubActionsTerraformRole"

  # GitHubのOIDCプロバイダを信頼
  # 前提としてAWSでは、信頼ポリシーを使ってロールを引き受ける主体を指定する　
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        # 厳密にいうとGithub ActionsのOIDCプロバイダ(事前にAWS上に作成しておく)から発行されたトークンを保有している者,つまりGithub Actions
        #　Github Actionsが以下のエンドポイントに対してOIDCトークンの発行をリクエストする。このトークンを保有していることがGithub上で動いていることを保証する
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        #　OIDCトークンを使ってGithub actionsがIAMロールを引き受けるAPIを呼び出すことを許可
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/*",
              "repo:${var.github_owner}/${var.github_repo}:pull_request",
            ],
          }
        }
      }
    ]
  })
}

# IAMポリシー（Terraformの実行に必要な最小限の権限）
# ポリシーを変更した際は、手動でAWSのロールに反映させる、その上で、Github ActionsのPipelineが正常に動作可能
resource "aws_iam_policy" "terraform_policy" {
  name        = "GitHubActionsTerraformPolicy"
  description = "Least privilege policy for GitHub Actions running Terraform"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:PassRole",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:ListPolicyVersions",
          "sts:GetCallerIdentity",
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "SNS:GetTopicAttributes",
          "SNS:ListTagsForResource",
          "SNS:DeleteTopic"
        ]
        Resource = "*"
      },
    ]
  })
}

# IAM ROleにポリシーをアタッチ
resource "aws_iam_role_policy_attachment" "terraform_policy_attach" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.terraform_policy.arn
}

# IAM　RoleのARNを出力
output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_role.arn
}

variable "supabase_org_id" {
  type        = string
  description = "SupabaseのOrganization ID"
}

# データベースパスワードなど、他に必要な値がある場合も同様に変数化
# variable "db_pass" {
#   type        = string
#   description = "DBのパスワード"
#   sensitive   = true
# }

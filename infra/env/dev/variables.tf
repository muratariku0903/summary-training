variable "supabase_access_token" {
  type        = string
  description = "Supabaseの個人アクセストークン"
  sensitive   = true
}

variable "supabase_org_id" {
  type        = string
  description = "SupabaseのOrganization ID"
}

variable "supabase_database_password" {
  type        = string
  description = "DBのパスワード"
  sensitive   = true
}

variable "supabase_database_env" {
  type        = string
  description = "DBの環境"
}

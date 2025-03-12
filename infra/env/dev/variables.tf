variable "supabase_access_token" {
  type        = string
  description = "Supabaseの個人アクセストークン"
  sensitive   = true
}

variable "supabase_org_id" {
  type        = string
  description = "SupabaseのOrganization ID"
}

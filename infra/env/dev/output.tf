output "supabase_project_ref" {
  value       = module.supabase.supabase_project_id
  description = "project-ref for CI/CD push"
}

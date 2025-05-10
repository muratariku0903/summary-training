output "supabase_project_ref" {
  description = "project-ref for CI/CD push"
  value       = module.supabase.project_id
}

output "supabase_project_ref" {
  value       = module.supabase.supabase_project.summary_training.id
  description = "project-ref for CI/CD push"
}

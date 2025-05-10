output "supabase_project_ref" {
  value       = supabase_project.this.id 
  description = "project-ref for CI/CD push"
}

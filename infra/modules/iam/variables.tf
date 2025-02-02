variable "github_owner" {
  description = "Github Owner"
  type        = string
}

variable "github_repo" {
  description = "Github repository name"
  type        = string
}

variable "tf_state_bucket" {
  description = "Terraform state s3 bucket name"
  type        = string
  default     = "summary-training-tf-state"
}

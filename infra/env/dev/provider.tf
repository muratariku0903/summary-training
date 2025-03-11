terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.68.0" # https://github.com/hashicorp/terraform-provider-aws/issues/39523
    }

    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

provider "supabase" {
  access_token = env("SUPABASE_ACCESS_TOKEN")
}

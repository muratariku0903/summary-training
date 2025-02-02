terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.68.0" # https://github.com/hashicorp/terraform-provider-aws/issues/39523
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

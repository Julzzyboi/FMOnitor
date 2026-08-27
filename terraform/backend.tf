# Remote state, shared across the team. The bucket itself was created
# once, manually, outside Terraform (a backend can't create its own home).
#
# Backend config can't reference variables - values here must be literal.
# Anyone on the team just needs their own AWS credentials with access to
# this bucket, then `terraform init` picks this up automatically.
terraform {
  backend "s3" {
    bucket       = "fmonitor-tfstate-497902364230"
    key          = "fmonitor/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}

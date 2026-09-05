# Remote state in S3. Bucket was created manually (a backend can't provision
# its own home). Backend blocks can't use variables - values must be literal.
terraform {
  backend "s3" {
    bucket       = "fmonitor-tfstate-497902364230"
    key          = "fmonitor/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}

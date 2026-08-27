variable "aws_region" {
  description = "AWS region for the new RDS instance"
  type        = string
  default     = "ap-southeast-1" # Singapore
}

variable "db_identifier" {
  description = "RDS instance identifier"
  type        = string
  default     = "fmonitor-sg-db"
}

variable "db_name" {
  description = "Initial database name created on the instance"
  type        = string
  default     = "fmonitor"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "postgres"
}

variable "db_instance_class" {
  description = "RDS instance size"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Storage size in GB"
  type        = number
  default     = 20
}

variable "postgres_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16"
}

variable "publicly_accessible" {
  description = "Whether the instance gets a public endpoint reachable from outside the VPC"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to Postgres on port 5432 (e.g. your own IP as x.x.x.x/32) - never leave this as 0.0.0.0/0 beyond quick throwaway testing"
  type        = list(string)
}

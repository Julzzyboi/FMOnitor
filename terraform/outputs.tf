output "db_endpoint" {
  description = "RDS connection endpoint (host:port)"
  value       = aws_db_instance.this.endpoint
}

output "db_name" {
  value = aws_db_instance.this.db_name
}

output "db_username" {
  value = aws_db_instance.this.username
}

output "db_password_secret_arn" {
  description = "Retrieve the actual password via: aws secretsmanager get-secret-value --secret-id <this-arn>"
  value       = aws_secretsmanager_secret.db_password.arn
}

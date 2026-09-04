# IAM roles for the Fargate tasks.
# - execution role: used by ECS to pull images, write logs, read the DB secret
# - task role: assumed by the app itself (no AWS API calls yet, kept empty)

locals {
  ecs_assume_role = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role" "ecs_execution" {
  name               = "fmonitor-ecs-execution"
  assume_role_policy = local.ecs_assume_role
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "read-db-password"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = aws_secretsmanager_secret.db_password.arn
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name               = "fmonitor-ecs-task"
  assume_role_policy = local.ecs_assume_role
}

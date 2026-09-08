# ECS cluster + task definitions + Fargate services. Billable - only created
# when var.deploy_runtime = true (shares local.runtime_count from alb.tf).
#
# Not wired yet: GOOGLE_CLIENT_SECRET, JWT_SECRET, MAIL_* - add them as
# Secrets Manager entries, grant them in iam.tf, then list them under
# `secrets` in the backend container below before OAuth / email will work.

resource "aws_ecs_cluster" "main" {
  count = local.runtime_count
  name  = "fmonitor"

  setting {
    name  = "containerInsights"
    value = "disabled" # Container Insights is a paid add-on
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  count             = local.runtime_count
  name              = "/ecs/fmonitor-backend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "frontend" {
  count             = local.runtime_count
  name              = "/ecs/fmonitor-frontend"
  retention_in_days = 7
}

# --- Backend: Spring Boot on :8080 ---
resource "aws_ecs_task_definition" "backend" {
  count                    = local.runtime_count
  family                   = "fmonitor-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
    essential = true
    portMappings = [{
      containerPort = 8080
    }]
    environment = [
      { name = "DB_USERNAME", value = var.db_username },
      { name = "APP_FRONTEND_URL", value = "http://${aws_lb.main[0].dns_name}" },
    ]
    secrets = [
      { name = "DB_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend[0].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }
  }])
}

# --- Frontend: nginx on :80 (VITE_API_BASE_URL is baked in at image build) ---
resource "aws_ecs_task_definition" "frontend" {
  count                    = local.runtime_count
  family                   = "fmonitor-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"
    essential = true
    portMappings = [{
      containerPort = 80
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend[0].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])
}

resource "aws_ecs_service" "backend" {
  count           = local.runtime_count
  name            = "fmonitor-backend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = 60 # Spring needs time to boot before the ALB checks it

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_service.id]
    assign_public_ip = true # required to pull from ECR without a NAT Gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend[0].arn
    container_name   = "backend"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "frontend" {
  count           = local.runtime_count
  name            = "fmonitor-frontend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.frontend[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_service.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.http]
}

# Application Load Balancer + path routing. Billable - only created when
# var.deploy_runtime = true. HTTP :80 only (no domain/cert yet).
#   default        -> frontend target group (nginx :80)
#   /api/*, /hello -> backend target group  (Spring :8080)

locals {
  runtime_count = var.deploy_runtime ? 1 : 0
}

resource "aws_lb" "main" {
  count              = local.runtime_count
  name               = "fmonitor-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "backend" {
  count       = local.runtime_count
  name        = "fmonitor-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  deregistration_delay = 30

  health_check {
    path    = "/"
    matcher = "200-404" # any HTTP response = container is up; tighten once /actuator/health exists
  }
}

resource "aws_lb_target_group" "frontend" {
  count       = local.runtime_count
  name        = "fmonitor-frontend-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  deregistration_delay = 30

  health_check {
    path    = "/"
    matcher = "200"
  }
}

resource "aws_lb_listener" "http" {
  count             = local.runtime_count
  load_balancer_arn = aws_lb.main[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend[0].arn
  }
}

resource "aws_lb_listener_rule" "api" {
  count        = local.runtime_count
  listener_arn = aws_lb_listener.http[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/hello"]
    }
  }
}

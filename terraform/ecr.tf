# Private container registries. `docker push` targets these; ECS pulls from them.

resource "aws_ecr_repository" "backend" {
  name                 = "fmonitor-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "fmonitor-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Expire untagged images once more than 5 accumulate
locals {
  ecr_untagged_cleanup = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images beyond 5"
      selection = {
        tagStatus   = "untagged"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy     = local.ecr_untagged_cleanup
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name
  policy     = local.ecr_untagged_cleanup
}

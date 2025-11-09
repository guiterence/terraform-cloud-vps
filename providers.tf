terraform {
  required_version = ">= 1.0"

  required_providers {
    contabo = {
      source  = "contabo/contabo"
      version = ">= 0.1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
}

provider "contabo" {
  # Credenciais serão fornecidas via variáveis de ambiente ou terraform.tfvars
  oauth2_client_id     = var.contabo_client_id
  oauth2_client_secret = var.contabo_client_secret
  oauth2_user          = var.contabo_user
  oauth2_pass          = var.contabo_pass
}

provider "cloudflare" {
  # API token será fornecido via variável
  api_token = var.cloudflare_api_token
}


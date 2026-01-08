variable "vps_ip" {
  description = "IP público da VPS"
  type        = string
}

variable "vps_root_password" {
  description = "Senha root da VPS"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vps_ssh_key" {
  description = "Chave SSH pública"
  type        = string
}

variable "domain_name" {
  description = "Nome do domínio"
  type        = string
}

variable "enable_n8n" {
  description = "Habilitar N8N"
  type        = bool
  default     = true
}

variable "enable_portainer" {
  description = "Habilitar Portainer"
  type        = bool
  default     = true
}

variable "enable_traefik" {
  description = "Habilitar Traefik"
  type        = bool
  default     = true
}

variable "enable_supabase" {
  description = "Habilitar Supabase"
  type        = bool
  default     = true
}

variable "enable_postgres" {
  description = "Habilitar PostgreSQL"
  type        = bool
  default     = true
}

variable "enable_minio" {
  description = "Habilitar MinIO"
  type        = bool
  default     = true
}

variable "enable_rabbitmq" {
  description = "Habilitar RabbitMQ"
  type        = bool
  default     = true
}

variable "traefik_email" {
  description = "Email para certificados Let's Encrypt"
  type        = string
  default     = ""
}

variable "traefik_basic_auth_user" {
  description = "Usuário (email) para autenticação básica do dashboard Traefik"
  type        = string
  default     = ""
}

variable "traefik_basic_auth_password" {
  description = "Senha para autenticação básica do dashboard Traefik"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_db_password" {
  description = "Senha do banco de dados Supabase"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_service_key" {
  description = "Service key do Supabase (chave de API para operações privilegiadas)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "postgres_password" {
  description = "Senha do usuário do PostgreSQL principal"
  type        = string
  sensitive   = true
  default     = ""
}

variable "minio_root_user" {
  description = "Usuário root do MinIO"
  type        = string
  default     = "minioadmin"
}

variable "minio_root_password" {
  description = "Senha root do MinIO"
  type        = string
  sensitive   = true
  default     = ""
}

variable "minio_bucket_name" {
  description = "Nome do bucket padrão a ser criado automaticamente no MinIO"
  type        = string
  default     = "terraform-cloud-vps"
}

variable "minio_service_account_name" {
  description = "Nome descritivo para a service account padrão do MinIO (usada pelo Supabase)"
  type        = string
  default     = "supabase"
}

variable "minio_service_account_access_key" {
  description = "Access key da service account padrão do MinIO (usada pelo Supabase)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "minio_service_account_secret_key" {
  description = "Secret key da service account padrão do MinIO (usada pelo Supabase)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ssh_private_key_path" {
  description = "Caminho para a chave SSH privada"
  type        = string
  default     = "~/.ssh/id_rsa"
}

variable "rabbitmq_user" {
  description = "Usuário do RabbitMQ"
  type        = string
  default     = "admin"
}

variable "rabbitmq_password" {
  description = "Senha do RabbitMQ"
  type        = string
  sensitive   = true
  default     = ""
}

variable "n8n_anthropic_api_key" {
  description = "API Key da Anthropic (Claude) para usar MCP no N8N"
  type        = string
  sensitive   = true
  default     = ""
}

variable "enable_campaign_builder" {
  description = "Habilitar Campaign Builder (frontend React)"
  type        = bool
  default     = true
}


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

variable "supabase_db_password" {
  description = "Senha do banco de dados Supabase"
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


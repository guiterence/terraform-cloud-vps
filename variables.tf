# Variáveis do Contabo
variable "contabo_client_id" {
  description = "Contabo OAuth2 Client ID"
  type        = string
  sensitive   = true
}

variable "contabo_client_secret" {
  description = "Contabo OAuth2 Client Secret"
  type        = string
  sensitive   = true
}

variable "contabo_user" {
  description = "Contabo OAuth2 User"
  type        = string
  sensitive   = true
}

variable "contabo_pass" {
  description = "Contabo OAuth2 Password"
  type        = string
  sensitive   = true
}

# Variáveis do Cloudflare
variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain_name" {
  description = "Nome do domínio principal"
  type        = string
  default     = "example.com"
}

variable "skip_cloudflare_dns" {
  description = "Pular configuração de DNS no Cloudflare (útil se tiver problemas de autenticação)"
  type        = bool
  default     = false
}

# Variáveis da VPS
variable "vps_name" {
  description = "Nome da VPS"
  type        = string
  default     = "terraform-vps"
}

variable "vps_region" {
  description = "Região da VPS (ex: EU, US)"
  type        = string
  default     = "EU"
}

variable "vps_image_id" {
  description = "ID da imagem do sistema operacional"
  type        = string
  default     = "Ubuntu 22.04"
}

variable "vps_instance_type" {
  description = "Tipo de instância da VPS"
  type        = string
  default     = "VPS S"
}

variable "vps_ssh_key" {
  description = "Chave SSH pública para acesso à VPS"
  type        = string
}

variable "vps_root_password" {
  description = "Senha root da VPS (será gerada se não fornecida)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ssh_private_key_path" {
  description = "Caminho para a chave SSH privada"
  type        = string
  default     = "~/.ssh/id_rsa"
}

# Opção para usar VPS existente
variable "use_existing_vps" {
  description = "Usar VPS existente ao invés de criar uma nova"
  type        = bool
  default     = false
}

variable "existing_vps_ip" {
  description = "IP da VPS existente (usado quando use_existing_vps = true). Exemplo: '123.45.67.89'"
  type        = string
  default     = ""
}

# Variáveis de configuração das ferramentas
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

# Variáveis de configuração do Traefik
variable "traefik_email" {
  description = "Email para certificados Let's Encrypt"
  type        = string
  default     = ""
}

# Variáveis de configuração do Supabase
variable "supabase_db_password" {
  description = "Senha do banco de dados Supabase"
  type        = string
  sensitive   = true
  default     = ""
}

# Variáveis de configuração do MinIO
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

# Variáveis de configuração do RabbitMQ
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


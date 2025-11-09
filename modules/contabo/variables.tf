variable "vps_name" {
  description = "Nome da VPS"
  type        = string
}

variable "vps_region" {
  description = "Região da VPS"
  type        = string
}

variable "vps_image_id" {
  description = "ID da imagem do sistema operacional"
  type        = string
}

variable "vps_instance_type" {
  description = "Tipo de instância da VPS"
  type        = string
}

variable "vps_ssh_key" {
  description = "Chave SSH pública"
  type        = string
}

variable "vps_root_password" {
  description = "Senha root da VPS"
  type        = string
  sensitive   = true
  default     = ""
}


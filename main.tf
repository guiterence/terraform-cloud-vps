# Determinar o IP da VPS (existente ou nova)
locals {
  vps_ip = var.use_existing_vps ? var.existing_vps_ip : module.contabo_vps[0].vps_ip
}

# Módulo para criar VPS no Contabo (apenas se não estiver usando VPS existente)
module "contabo_vps" {
  count  = var.use_existing_vps ? 0 : 1
  source = "./modules/contabo"

  vps_name         = var.vps_name
  vps_region       = var.vps_region
  vps_image_id     = var.vps_image_id
  vps_instance_type = var.vps_instance_type
  vps_ssh_key      = var.vps_ssh_key
  vps_root_password = var.vps_root_password
}

# Módulo para configurar DNS no Cloudflare
module "cloudflare_dns" {
  source = "./modules/cloudflare"

  zone_id    = var.cloudflare_zone_id
  domain     = var.domain_name
  vps_ip     = local.vps_ip
  vps_name   = var.vps_name
}

# Módulo para provisionar ferramentas
module "provisioning" {
  source = "./modules/provisioning"

  depends_on = [
    module.cloudflare_dns
  ]

  vps_ip              = local.vps_ip
  vps_root_password   = var.vps_root_password
  vps_ssh_key         = var.vps_ssh_key
  domain_name         = var.domain_name
  ssh_private_key_path = var.ssh_private_key_path

  # Flags de habilitação
  enable_n8n          = var.enable_n8n
  enable_portainer    = var.enable_portainer
  enable_traefik      = var.enable_traefik
  enable_supabase     = var.enable_supabase
  enable_postgres      = var.enable_postgres
  enable_minio         = var.enable_minio

  # Configurações específicas
  traefik_email       = var.traefik_email
  supabase_db_password = var.supabase_db_password
  minio_root_user     = var.minio_root_user
  minio_root_password = var.minio_root_password
}


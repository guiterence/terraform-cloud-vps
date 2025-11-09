output "vps_ip" {
  description = "IP público da VPS"
  value       = local.vps_ip
}

output "vps_id" {
  description = "ID da VPS no Contabo (apenas se criada via Terraform)"
  value       = var.use_existing_vps ? "VPS existente" : module.contabo_vps[0].vps_id
}

output "vps_status" {
  description = "Status da VPS (apenas se criada via Terraform)"
  value       = var.use_existing_vps ? "Usando VPS existente" : module.contabo_vps[0].vps_status
}

output "dns_records" {
  description = "Registros DNS criados no Cloudflare"
  value       = module.cloudflare_dns.dns_records
}

output "n8n_url" {
  description = "URL do N8N"
  value       = var.enable_n8n ? "https://n8n.${var.domain_name}" : null
}

output "portainer_url" {
  description = "URL do Portainer"
  value       = var.enable_portainer ? "https://portainer.${var.domain_name}" : null
}

output "traefik_url" {
  description = "URL do Traefik Dashboard"
  value       = var.enable_traefik ? "https://traefik.${var.domain_name}" : null
}

output "supabase_url" {
  description = "URL do Supabase"
  value       = var.enable_supabase ? "https://supabase.${var.domain_name}" : null
}

output "minio_url" {
  description = "URL do MinIO"
  value       = var.enable_minio ? "https://minio.${var.domain_name}" : null
}


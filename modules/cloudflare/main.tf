# Registro A principal para o domínio
resource "cloudflare_record" "root" {
  zone_id        = var.zone_id
  name           = var.domain
  content        = var.vps_ip
  type           = "A"
  ttl            = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para subdomínio da VPS
resource "cloudflare_record" "vps" {
  zone_id = var.zone_id
  name    = "${var.vps_name}.${var.domain}"
  content = var.vps_ip
  type    = "A"
  ttl     = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para N8N
resource "cloudflare_record" "n8n" {
  zone_id        = var.zone_id
  name           = "n8n.${var.domain}"
  content        = var.vps_ip
  type           = "A"
  ttl            = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para Portainer
resource "cloudflare_record" "portainer" {
  zone_id        = var.zone_id
  name           = "portainer.${var.domain}"
  content        = var.vps_ip
  type           = "A"
  ttl            = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para Traefik
resource "cloudflare_record" "traefik" {
  zone_id = var.zone_id
  name    = "traefik.${var.domain}"
  content = var.vps_ip
  type    = "A"
  ttl     = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para Supabase
resource "cloudflare_record" "supabase" {
  zone_id = var.zone_id
  name    = "supabase.${var.domain}"
  content = var.vps_ip
  type    = "A"
  ttl     = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para MinIO
resource "cloudflare_record" "minio" {
  zone_id = var.zone_id
  name    = "minio.${var.domain}"
  content = var.vps_ip
  type    = "A"
  ttl     = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para RabbitMQ
resource "cloudflare_record" "rabbitmq" {
  zone_id = var.zone_id
  name    = "rabbitmq.${var.domain}"
  content = var.vps_ip
  type    = "A"
  ttl     = 3600
  proxied        = false
  allow_overwrite = true
}

# Registro A para MinIO Console
resource "cloudflare_record" "minio_console" {
  zone_id = var.zone_id
  name    = "minio-console.${var.domain}"
  content = var.vps_ip
  type    = "A"
  ttl     = 3600
  proxied        = false
  allow_overwrite = true
}


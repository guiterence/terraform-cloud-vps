output "dns_records" {
  description = "Registros DNS criados"
  value = {
    root         = cloudflare_record.root.hostname
    vps          = cloudflare_record.vps.hostname
    n8n          = cloudflare_record.n8n.hostname
    portainer    = cloudflare_record.portainer.hostname
    traefik      = cloudflare_record.traefik.hostname
    supabase     = cloudflare_record.supabase.hostname
    minio        = cloudflare_record.minio.hostname
    minio_console = cloudflare_record.minio_console.hostname
    rabbitmq     = cloudflare_record.rabbitmq.hostname
  }
}


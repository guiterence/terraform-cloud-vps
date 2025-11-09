# Outputs placeholder - este módulo não é usado quando use_existing_vps = true
output "vps_id" {
  description = "ID da VPS no Contabo (não usado quando use_existing_vps = true)"
  value       = "not-used"
}

output "vps_ip" {
  description = "IP público da VPS (não usado quando use_existing_vps = true)"
  value       = "0.0.0.0"
}

output "vps_status" {
  description = "Status da VPS (não usado quando use_existing_vps = true)"
  value       = "not-created"
}

output "vps_private_ip" {
  description = "IP privado da VPS (não usado quando use_existing_vps = true)"
  value       = "0.0.0.0"
}

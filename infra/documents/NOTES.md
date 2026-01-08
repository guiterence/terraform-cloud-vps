# Notas Importantes

## Provider Contabo

O provider do Contabo usado neste projeto (`contabo/contabo`) pode precisar de ajustes dependendo da versão disponível no Terraform Registry. 

### Se o provider não funcionar:

1. **Verifique a documentação oficial**: Acesse o [Terraform Registry](https://registry.terraform.io/providers/contabo/contabo/latest/docs) para verificar a sintaxe correta.

2. **Alternativa - Criar VPS manualmente**: Se o provider não estiver funcionando, você pode:
   - Criar a VPS manualmente no painel do Contabo
   - Usar uma variável `vps_ip` diretamente no `terraform.tfvars`
   - Comentar o módulo `contabo_vps` no `main.tf`
   - Ajustar o módulo `cloudflare_dns` para usar a variável diretamente

3. **Usar API REST do Contabo**: Como alternativa, você pode usar o provider `http` do Terraform para fazer chamadas à API REST do Contabo.

### Exemplo de ajuste no main.tf (se necessário):

```hcl
# Comentar o módulo Contabo e usar IP direto
# module "contabo_vps" {
#   source = "./modules/contabo"
#   ...
# }

# Usar variável direta
variable "vps_ip" {
  description = "IP da VPS (se criada manualmente)"
  type        = string
}

# Ajustar módulo Cloudflare
module "cloudflare_dns" {
  source = "./modules/cloudflare"
  zone_id    = var.cloudflare_zone_id
  domain     = var.domain_name
  vps_ip     = var.vps_ip  # Usar variável direta
  vps_name   = var.vps_name
}
```

## Configuração do SSH

Certifique-se de que:
- A chave SSH privada está no caminho especificado em `ssh_private_key_path`
- A chave pública foi adicionada à VPS (via Contabo ou manualmente)
- As permissões da chave privada estão corretas: `chmod 600 ~/.ssh/id_rsa`

## Ordem de Provisionamento

O provisionamento segue esta ordem:
1. Criação da VPS (ou uso de VPS existente)
2. Configuração do DNS no Cloudflare
3. Setup inicial do servidor (Docker, Docker Compose)
4. Criação da rede Docker do Traefik
5. Provisionamento das ferramentas (Traefik primeiro, depois as outras)

## Troubleshooting

### Erro de conexão SSH
- Verifique se a VPS está acessível: `ping <ip_da_vps>`
- Teste a conexão SSH manualmente: `ssh root@<ip_da_vps>`
- Verifique se o firewall da VPS permite conexões SSH

### Erro no provider Contabo
- Verifique as credenciais OAuth2
- Confirme que a API do Contabo está acessível
- Verifique a documentação do provider para sintaxe atualizada

### Erro no Cloudflare
- Verifique se o API Token tem as permissões corretas
- Confirme que o Zone ID está correto
- Verifique se o domínio está gerenciado pelo Cloudflare

### Erro no provisionamento
- Verifique os logs do Terraform: `terraform apply -verbose`
- Acesse a VPS via SSH e verifique os logs do Docker: `docker logs <container>`
- Verifique se todas as portas necessárias estão abertas no firewall


# Estrutura do Projeto

## Visão Geral

Este projeto Terraform automatiza a criação de uma infraestrutura completa na nuvem:

1. **VPS no Contabo** - Servidor virtual
2. **DNS no Cloudflare** - Configuração automática de registros
3. **Ferramentas Docker** - Provisionamento automático de serviços

## Arquivos Principais

### Raiz do Projeto

- `main.tf` - Arquivo principal que orquestra todos os módulos
- `providers.tf` - Configuração dos providers (Contabo, Cloudflare, Time)
- `variables.tf` - Definição de todas as variáveis
- `outputs.tf` - Outputs do Terraform (IPs, URLs, etc.)
- `terraform.tfvars.example` - Exemplo de configuração
- `.gitignore` - Arquivos ignorados pelo Git
- `README.md` - Documentação principal
- `NOTES.md` - Notas importantes e troubleshooting
- `STRUCTURE.md` - Este arquivo

## Módulos

### 1. Módulo Contabo (`modules/contabo/`)

Responsável por criar a VPS no Contabo.

**Arquivos:**
- `main.tf` - Recursos do Terraform (instância, data sources)
- `variables.tf` - Variáveis de entrada
- `outputs.tf` - Outputs (IP, ID, status)

**Recursos:**
- `data.contabo_image` - Busca imagem do sistema operacional
- `data.contabo_instance_size` - Busca tipo de instância
- `contabo_instance.vps` - Cria a instância VPS
- `time_sleep.wait_for_vps` - Aguarda VPS estar pronta

### 2. Módulo Cloudflare (`modules/cloudflare/`)

Responsável por configurar os registros DNS no Cloudflare.

**Arquivos:**
- `main.tf` - Recursos de DNS
- `variables.tf` - Variáveis de entrada
- `outputs.tf` - Outputs (registros criados)

**Recursos:**
- `cloudflare_record.root` - Registro A do domínio principal
- `cloudflare_record.vps` - Registro A da VPS
- `cloudflare_record.n8n` - Registro A para N8N
- `cloudflare_record.portainer` - Registro A para Portainer
- `cloudflare_record.traefik` - Registro A para Traefik
- `cloudflare_record.supabase` - Registro A para Supabase
- `cloudflare_record.minio` - Registro A para MinIO

### 3. Módulo Provisioning (`modules/provisioning/`)

Responsável por provisionar todas as ferramentas na VPS.

**Arquivos:**
- `main.tf` - Provisionamento via SSH
- `variables.tf` - Variáveis de entrada
- `outputs.tf` - Outputs do provisionamento
- `templates/` - Templates Docker Compose

**Templates Docker Compose:**
- `traefik.yml.tpl` - Configuração do Traefik
- `traefik-config.yml.tpl` - Configuração do Traefik (arquivo de config)
- `portainer.yml.tpl` - Configuração do Portainer
- `n8n.yml.tpl` - Configuração do N8N
- `postgres.yml.tpl` - Configuração do PostgreSQL
- `minio.yml.tpl` - Configuração do MinIO
- `supabase.yml.tpl` - Configuração do Supabase

**Fluxo de Provisionamento:**
1. `time_sleep.wait_for_vps_ready` - Aguarda VPS estar acessível
2. `null_resource.initial_setup` - Setup inicial (apt, firewall)
3. `null_resource.install_docker` - Instala Docker
4. `null_resource.install_docker_compose` - Instala Docker Compose
5. `null_resource.create_traefik_network` - Cria rede Docker do Traefik
6. `null_resource.create_directories` - Cria diretórios necessários
7. `null_resource.provision_traefik` - Provisiona Traefik
8. `null_resource.provision_portainer` - Provisiona Portainer
9. `null_resource.provision_postgres` - Provisiona PostgreSQL
10. `null_resource.provision_minio` - Provisiona MinIO
11. `null_resource.provision_n8n` - Provisiona N8N
12. `null_resource.provision_supabase` - Provisiona Supabase

## Fluxo de Execução

```
terraform init
    ↓
terraform plan
    ↓
terraform apply
    ↓
1. Cria VPS no Contabo
    ↓
2. Configura DNS no Cloudflare
    ↓
3. Aguarda VPS estar pronta
    ↓
4. Setup inicial (Docker, firewall)
    ↓
5. Provisiona ferramentas
    ↓
6. Configura Traefik como reverse proxy
    ↓
7. Aplica certificados SSL automáticos
```

## Variáveis Principais

### Contabo
- `contabo_client_id`
- `contabo_client_secret`
- `contabo_user`
- `contabo_pass`

### Cloudflare
- `cloudflare_api_token`
- `cloudflare_zone_id`
- `domain_name`

### VPS
- `vps_name`
- `vps_region`
- `vps_image_id`
- `vps_instance_type`
- `vps_ssh_key`
- `vps_root_password`
- `ssh_private_key_path`

### Ferramentas
- `enable_n8n`
- `enable_portainer`
- `enable_traefik`
- `enable_supabase`
- `enable_postgres`
- `enable_minio`

## Outputs

- `vps_ip` - IP público da VPS
- `vps_id` - ID da VPS no Contabo
- `vps_status` - Status da VPS
- `dns_records` - Registros DNS criados
- `n8n_url` - URL do N8N
- `portainer_url` - URL do Portainer
- `traefik_url` - URL do Traefik
- `supabase_url` - URL do Supabase
- `minio_url` - URL do MinIO

## Próximos Passos

1. Configure o arquivo `terraform.tfvars` com suas credenciais
2. Execute `terraform init` para baixar os providers
3. Execute `terraform plan` para verificar o plano
4. Execute `terraform apply` para criar a infraestrutura
5. Acesse as URLs fornecidas nos outputs


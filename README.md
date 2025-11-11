# Terraform Cloud VPS

Projeto Terraform para automatizar a criação e configuração de uma infraestrutura completa na nuvem, incluindo:

- **VPS no Contabo**: Criação automática de servidor virtual
- **DNS no Cloudflare**: Configuração automática de registros DNS
- **Ferramentas provisionadas**:
  - **Traefik**: Reverse proxy e load balancer com SSL automático
  - **Portainer**: Interface web para gerenciamento de containers Docker
  - **N8N**: Plataforma de automação de workflows
- **Supabase**: Backend-as-a-Service (BaaS) com Supabase Studio, Postgres, Postgres Meta e Storage integrados ao MinIO
  - **PostgreSQL**: Banco de dados relacional
  - **MinIO**: Armazenamento de objetos compatível com S3

## 📋 Pré-requisitos

1. **Terraform** instalado (versão >= 1.0)
2. **Conta no Contabo** com credenciais de API
3. **Conta no Cloudflare** com API Token
4. **Chave SSH** configurada para acesso ao servidor

## 🚀 Configuração Inicial

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd terraform-cloud-vps
```

### 2. Instale as dependências

**Opção A: Usando Make (Recomendado)**

```bash
# Instala dependências do sistema e Terraform
./setup.sh

# Instala ambiente virtual Python e dependências
make install
```

**Opção B: Manual**

```bash
# Instalar dependências do sistema (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv wget unzip curl git make

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências Python
pip install -r requirements.txt
```

### 3. Configure as variáveis

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edite o arquivo `terraform.tfvars` com suas informações:

```hcl
# Contabo Credentials
contabo_client_id     = "seu_client_id"
contabo_client_secret = "seu_client_secret"
contabo_user          = "seu_usuario"
contabo_pass          = "sua_senha"

# Cloudflare Credentials
cloudflare_api_token = "seu_api_token"
cloudflare_zone_id   = "seu_zone_id"
domain_name          = "seudominio.com"

# VPS Configuration
vps_name         = "minha-vps"
vps_region       = "EU"
vps_image_id     = "Ubuntu 22.04"
vps_instance_type = "VPS S"
vps_ssh_key      = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC..."
vps_root_password = "senha_segura"

# Tool Configuration
enable_n8n       = true
enable_portainer = true
enable_traefik   = true
enable_supabase  = true
enable_postgres  = true
enable_minio     = true

# Traefik Configuration
traefik_email               = "seu_email@exemplo.com"
traefik_basic_auth_user     = "admin@exemplo.com"
traefik_basic_auth_password = "senha_segura"

# Supabase Configuration
supabase_db_password = "senha_do_banco"
supabase_service_key = "chave_de_servico_supabase"
postgres_password    = "senha_postgres_principal"

# MinIO Configuration
minio_root_user                   = "minioadmin"
minio_root_password               = "senha_minio"
minio_bucket_name                 = "meu-bucket"
minio_service_account_name        = "supabase"
minio_service_account_access_key  = "minha_access_key"
minio_service_account_secret_key  = "minha_secret_key"
```

> 💡 **Dica:** mantenha todas as senhas e chaves em um cofre seguro (1Password, Bitwarden, etc.).

### 3. Obter credenciais

#### Contabo
1. Acesse o [Contabo Customer Control Panel](https://www.contabo.com/en/customer/)
2. Vá em **API** > **OAuth2 Credentials**
3. Crie uma nova aplicação OAuth2
4. Copie o Client ID e Client Secret

#### Cloudflare
1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá em **My Profile** > **API Tokens**
3. Crie um novo token com permissões:
   - Zone:Zone:Read
   - Zone:DNS:Edit
4. Copie o Zone ID da sua zona DNS

### 4. Inicializar o Terraform

```bash
# Usando Make
make init

# Ou manualmente
terraform init
```

### 5. Planejar a infraestrutura

```bash
# Usando Make
make plan

# Ou manualmente
terraform plan
```

### 6. Aplicar a configuração

```bash
# Usando Make (com confirmação)
make apply

# Ou automaticamente (sem confirmação)
make apply-auto

# Ou manualmente
terraform apply
```

## 🛠️ Comandos Make Disponíveis

O projeto inclui um `Makefile` com vários comandos úteis:

```bash
make help          # Mostra todos os comandos disponíveis
make install       # Instala venv e dependências do requirements.txt
make setup         # Instala Terraform (se necessário)
make init          # Inicializa o Terraform
make plan          # Mostra o plano de execução
make apply         # Aplica a configuração
make apply-auto    # Aplica automaticamente (sem confirmação)
make validate      # Valida a configuração
make format        # Formata os arquivos Terraform
make destroy       # Destroi a infraestrutura
make output        # Mostra os outputs
make clean         # Remove arquivos temporários
make clean-all     # Remove tudo (incluindo venv)
make check         # Executa todas as verificações
make dev-setup     # Setup completo para desenvolvimento
make info          # Mostra informações do ambiente
```

Para ver todos os comandos disponíveis:

```bash
make help
```

## 📁 Estrutura do Projeto

```
terraform-cloud-vps/
├── main.tf                    # Arquivo principal
├── providers.tf               # Configuração dos providers
├── variables.tf               # Definição de variáveis
├── outputs.tf                 # Outputs do Terraform
├── terraform.tfvars.example   # Exemplo de variáveis
├── .gitignore                 # Arquivos ignorados pelo Git
├── README.md                  # Este arquivo
└── modules/
    ├── contabo/              # Módulo para criar VPS no Contabo
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── cloudflare/            # Módulo para configurar DNS
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── provisioning/          # Módulo para provisionar ferramentas
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── templates/         # Templates Docker Compose
            ├── traefik.yml.tpl
            ├── traefik-config.yml.tpl
            ├── portainer.yml.tpl
            ├── n8n.yml.tpl
            ├── postgres.yml.tpl
            ├── minio.yml.tpl
            └── supabase.yml.tpl
```

## 🔧 Funcionalidades

### Módulo Contabo
- Criação automática de VPS
- Configuração de chaves SSH
- Seleção de região e tipo de instância

### Módulo Cloudflare
- Criação automática de registros DNS A
- Configuração de subdomínios para cada ferramenta:
  - `n8n.seudominio.com`
  - `portainer.seudominio.com`
  - `traefik.seudominio.com`
  - `supabase.seudominio.com`
  - `minio.seudominio.com`

### Módulo Provisioning
- Instalação automática do Docker e Docker Compose
- Configuração de firewall (UFW)
- Provisionamento de todas as ferramentas via Docker Compose
- Configuração do Traefik como reverse proxy
- SSL automático via Let's Encrypt

## 🌐 URLs de Acesso

Após o provisionamento, você terá acesso às seguintes URLs:

- **Traefik Dashboard**: `https://traefik.seudominio.com`
- **Portainer**: `https://portainer.seudominio.com`
- **N8N**: `https://n8n.seudominio.com`
- **Supabase**: `https://supabase.seudominio.com`
- **MinIO**: `https://minio.seudominio.com`
- **MinIO Console**: `https://minio-console.seudominio.com`

## 🔐 Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite o arquivo `terraform.tfvars` no Git
- Use senhas fortes para todas as ferramentas
- Configure autenticação básica no Traefik Dashboard
- Mantenha suas chaves SSH seguras

## 🛠️ Comandos Úteis

```bash
# Ver o estado atual
terraform show

# Ver outputs
terraform output

# Destruir a infraestrutura
terraform destroy

# Atualizar apenas um módulo específico
terraform apply -target=module.provisioning
```

## 📝 Notas

- O provisionamento pode levar alguns minutos para completar
- Certifique-se de que o domínio está apontando para o Cloudflare antes de executar
- As senhas padrão devem ser alteradas após o primeiro acesso
- O Traefik precisa de um email válido para gerar certificados SSL
- O Traefik já pode ser protegido por usuário/senha via `traefik_basic_auth_user` e `traefik_basic_auth_password`
  definidos no `terraform.tfvars`
- O Supabase cria automaticamente as roles necessárias no Postgres através do arquivo `init.sql`
- O Supabase Meta (`supabase-meta`) é provisionado para que o Supabase Studio funcione corretamente

## 🔗 Integração MinIO + Supabase

1. **Gerar credenciais no MinIO**  
   - Acesse `https://minio-console.seudominio.com` com o usuário root (`minio_root_user`).  
   - Crie (ou confirme) o bucket padrão definido em `minio_bucket_name`.  
   - Gere manualmente uma *Service Account* com permissões completas para o Supabase.  
   - Copie o `Access Key` e o `Secret Key`.
2. **Configurar o Terraform**  
   - Preencha `minio_service_account_access_key` e `minio_service_account_secret_key` no `terraform.tfvars`.  
   - Execute `terraform apply` para que o Supabase consuma essas credenciais automaticamente.
3. **Reaplicar quando trocar as chaves**  
   - Sempre que gerar novas chaves no MinIO, atualize o `terraform.tfvars` e rode `terraform apply`.

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues ou pull requests!

## 📄 Licença

Este projeto está sob a licença MIT.

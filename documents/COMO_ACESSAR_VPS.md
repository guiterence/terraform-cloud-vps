# 🔐 Como Acessar e Gerenciar as Aplicações no VPS

## 📍 Localização das Aplicações

Todas as aplicações foram instaladas em: **`/opt/docker/`**

## 🚀 Como Acessar via SSH

```bash
# Conectar ao servidor
ssh root@86.48.17.133

# Navegar para o diretório das aplicações
cd /opt/docker

# Listar todas as aplicações
ls -la
```

## 📁 Estrutura de Diretórios

```
/opt/docker/
├── traefik/          # Reverse Proxy
│   ├── docker-compose.yml
│   ├── config/
│   │   └── traefik.yml
│   └── acme/         # Certificados SSL
├── n8n/              # Automação
│   └── docker-compose.yml
├── portainer/        # Gerenciamento Docker
│   └── docker-compose.yml
├── rabbitmq/         # Message Broker
│   └── docker-compose.yml
├── supabase/         # Backend as a Service
│   └── docker-compose.yml
├── minio/            # Object Storage
│   └── docker-compose.yml
└── postgres/         # Banco de Dados
    └── docker-compose.yml
```

## 🐳 Gerenciamento via Docker Compose

### Ver status de uma aplicação:
```bash
cd /opt/docker/n8n
docker-compose ps
```

### Parar uma aplicação:
```bash
cd /opt/docker/n8n
docker-compose down
```

### Iniciar uma aplicação:
```bash
cd /opt/docker/n8n
docker-compose up -d
```

### Ver logs de uma aplicação:
```bash
cd /opt/docker/n8n
docker-compose logs -f
```

### Reiniciar uma aplicação:
```bash
cd /opt/docker/n8n
docker-compose restart
```

## 💾 Dados Persistentes

Os dados são armazenados em **volumes Docker**:

```bash
# Listar volumes
docker volume ls

# Volumes criados:
# - minio_minio_data
# - n8n_n8n_data
# - n8n_n8n_postgres_data
# - portainer_portainer_data
# - postgres_postgres_data
# - rabbitmq_rabbitmq_data
# - supabase_supabase_db_data
```

### Ver localização física de um volume:
```bash
docker volume inspect minio_minio_data
```

## 📝 Editar Configurações

### Exemplo: Editar configuração do Traefik
```bash
cd /opt/docker/traefik
nano config/traefik.yml
docker-compose restart
```

### Exemplo: Editar docker-compose do N8N
```bash
cd /opt/docker/n8n
nano docker-compose.yml
docker-compose up -d
```

## 🔍 Comandos Úteis

### Ver todos os containers:
```bash
docker ps -a
```

### Ver uso de recursos:
```bash
docker stats
```

### Ver logs de um container específico:
```bash
docker logs -f n8n
```

### Acessar shell de um container:
```bash
docker exec -it n8n sh
```

## 📦 MinIO – Bucket e Credenciais

- Bucket padrão criado automaticamente: **`terraform-cloud-vps`**
- Console administrativo: `https://minio-console.terenceconsultoria.com.br`
- API S3: `https://minio.terenceconsultoria.com.br`
- Para listar buckets via CLI:
  ```bash
  docker exec minio mc alias set local http://127.0.0.1:9000 "<seu usuário>"
  docker exec minio mc ls local
  ```
  Substitua `<seu usuário>` pela variável `minio_root_user` definida no `terraform.tfvars`.

## ⚠️ Importante

- **Backup**: Faça backup dos volumes Docker antes de modificar
- **Permissões**: Todos os arquivos são do usuário `root`
- **Edições**: Sempre reinicie o container após editar configurações

## 📚 Documentação Adicional

- Ver logs: `docker-compose logs -f [serviço]`
- Ver status: `docker-compose ps`
- Atualizar imagem: `docker-compose pull && docker-compose up -d`


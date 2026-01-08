# Como Provisionar o Campaign Builder

## Configuração Criada

O Campaign Builder foi configurado para ser exposto em `campaign-builder.terenceconsultoria.com.br` via Traefik.

### Arquivos Criados

1. **Templates Terraform**:
   - `infra/modules/provisioning/templates/campaign-builder.yml.tpl` - Docker Compose
   - `infra/modules/provisioning/templates/campaign-builder.Dockerfile` - Dockerfile multi-stage
   - `infra/modules/provisioning/templates/campaign-builder.nginx.conf` - Configuração Nginx

2. **Configurações**:
   - Variável `enable_campaign_builder` adicionada (default: true)
   - Registro DNS no Cloudflare
   - Output `campaign_builder_url` adicionado

## Como Aplicar

### 1. Verificar Configuração

```bash
cd infra
terraform init
terraform plan
```

### 2. Aplicar Mudanças

```bash
terraform apply
```

Isso irá:
- Criar registro DNS `campaign-builder.terenceconsultoria.com.br`
- Copiar arquivos do frontend para `/opt/docker/campaign-builder` na VPS
- Buildar a imagem Docker do React app
- Iniciar o container com Nginx
- Configurar Traefik para rotear o domínio

### 3. Verificar Status

Após aplicar, verifique:

```bash
# No servidor VPS
ssh root@86.48.17.133
cd /opt/docker/campaign-builder
docker-compose ps
docker-compose logs campaign-builder
```

### 4. Acessar

O frontend estará disponível em:
- **URL**: `https://campaign-builder.terenceconsultoria.com.br`

## Estrutura no Servidor

```
/opt/docker/campaign-builder/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── package.json
├── tsconfig.json
├── src/
│   ├── components/
│   ├── services/
│   └── ...
└── public/
    └── index.html
```

## Troubleshooting

### Container não inicia
```bash
cd /opt/docker/campaign-builder
docker-compose logs
docker-compose build --no-cache
docker-compose up -d
```

### Erro de build
- Verifique se todos os arquivos foram copiados
- Verifique se `package.json` está correto
- Verifique logs: `docker-compose build 2>&1 | tee build.log`

### Traefik não roteia
- Verifique se o container está na rede `traefik-network`
- Verifique labels do Traefik: `docker inspect campaign-builder | grep -A 10 Labels`
- Verifique logs do Traefik: `docker logs traefik`

### DNS não resolve
- Verifique no Cloudflare se o registro foi criado
- Aguarde propagação DNS (pode levar alguns minutos)
- Teste: `dig campaign-builder.terenceconsultoria.com.br`

## Atualizar Frontend

Para atualizar o frontend após mudanças:

1. Faça as alterações em `apps/campaign-builder/`
2. Execute `terraform apply` novamente
3. O Terraform detectará mudanças e reconstruirá o container

Ou manualmente no servidor:

```bash
ssh root@86.48.17.133
cd /opt/docker/campaign-builder
# Fazer alterações ou copiar novos arquivos
docker-compose build --no-cache
docker-compose up -d
```

## Variáveis de Ambiente

O frontend usa variáveis de ambiente que devem ser configuradas no build:

- `REACT_APP_N8N_URL`: URL da API do N8N (default: `https://n8n.terenceconsultoria.com.br/api/v1`)
- `REACT_APP_N8N_WEBHOOK_URL`: URL base dos webhooks (default: `https://n8n.terenceconsultoria.com.br/webhook`)

Essas variáveis são "baked in" no build do React, então se precisar alterá-las, será necessário reconstruir a imagem.


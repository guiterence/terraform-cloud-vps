# Terraform Cloud VPS

Infraestrutura como código para provisionar e gerenciar serviços na VPS, incluindo N8N, Supabase, MinIO, Traefik e outros.

## Estrutura do Projeto

```
.
├── infra/              # Infraestrutura Terraform
│   ├── main.tf
│   ├── modules/
│   ├── terraform.tfvars
│   └── ...
├── apps/               # Aplicações Frontend
│   └── campaign-builder/  # Frontend React para criar campanhas
│       ├── src/
│       ├── package.json
│       └── ...
└── README.md
```

## Infraestrutura (`/infra`)

A infraestrutura Terraform está localizada em `/infra`. Para trabalhar com ela:

```bash
cd infra
terraform init
terraform plan
terraform apply
```

Veja o README em `/infra/README.md` para mais detalhes sobre a infraestrutura.

## Aplicações (`/apps`)

### Campaign Builder

Frontend React com ReactFlow para criar campanhas de envio de mensagens integrado com N8N.

```bash
cd apps/campaign-builder
npm install
npm start
```

Veja o README em `/apps/campaign-builder/README.md` para mais detalhes.

## Serviços Provisionados

- **N8N**: Automação de workflows - `https://n8n.terenceconsultoria.com.br`
- **Supabase**: Backend como serviço - `https://supabase.terenceconsultoria.com.br`
- **MinIO**: Armazenamento de objetos - `https://minio.terenceconsultoria.com.br`
- **Traefik**: Reverse proxy e load balancer - `https://traefik.terenceconsultoria.com.br`
- **Portainer**: Gerenciamento de containers Docker
- **RabbitMQ**: Message broker

## Webhooks

- **Campaign Builder**: `https://n8n.terenceconsultoria.com.br/webhook/campaign-builder`

## Documentação

- Infraestrutura: `/infra/documents/`
- Aplicações: `/apps/campaign-builder/README.md`

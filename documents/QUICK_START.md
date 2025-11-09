# 🚀 Quick Start Guide

Guia rápido para começar a usar o projeto.

## Instalação Rápida

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd terraform-cloud-vps

# 2. Execute o setup (instala dependências do sistema e Terraform)
./setup.sh

# 3. Instale ambiente virtual e dependências Python
make install

# 4. Configure suas credenciais
cp terraform.tfvars.example terraform.tfvars
# Edite terraform.tfvars com suas credenciais

# 5. Inicialize e aplique
make init
make plan
make apply
```

## Comandos Mais Usados

```bash
# Ver ajuda
make help

# Instalar tudo
make install

# Setup completo para desenvolvimento
make dev-setup

# Trabalhar com Terraform
make init      # Inicializar
make plan      # Ver o que será criado
make apply     # Criar infraestrutura
make destroy   # Destruir infraestrutura

# Validação e formatação
make validate  # Validar configuração
make format    # Formatar arquivos
make check     # Executar todas verificações

# Limpeza
make clean     # Limpar arquivos temporários
make clean-all  # Limpar tudo (incluindo venv)
```

## Fluxo de Trabalho Típico

```bash
# 1. Primeira vez
make install
make init

# 2. Fazer alterações nos arquivos .tf
# 3. Validar e formatar
make format
make validate

# 4. Ver o que será alterado
make plan

# 5. Aplicar mudanças
make apply

# 6. Ver outputs
make output
```

## Ambiente Virtual Python

O `make install` cria um ambiente virtual Python em `venv/`.

Para ativar manualmente:

```bash
source venv/bin/activate
```

Para desativar:

```bash
deactivate
```

## Informações do Ambiente

Para ver informações sobre o ambiente configurado:

```bash
make info
```

## Troubleshooting

### Terraform não encontrado
```bash
make setup  # Instala Terraform automaticamente
```

### Erro ao criar venv
```bash
# Instalar python3-venv
sudo apt-get install python3-venv
make venv
```

### Limpar e começar de novo
```bash
make clean-all
make install
make init
```


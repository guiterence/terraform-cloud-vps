#!/bin/bash

# Script de setup para Ubuntu/Debian
# Instala dependências do sistema necessárias para o projeto

set -e

echo "🚀 Configurando ambiente para Terraform Cloud VPS..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    echo -e "${RED}Erro: Este script é para Ubuntu/Debian${NC}"
    exit 1
fi

echo -e "${YELLOW}Atualizando lista de pacotes...${NC}"
sudo apt-get update

echo -e "${YELLOW}Instalando dependências do sistema...${NC}"
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    unzip \
    curl \
    git \
    make

echo -e "${GREEN}✓ Dependências do sistema instaladas${NC}"

# Verificar se Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo -e "${YELLOW}Terraform não encontrado. Instalando...${NC}"
    TERRAFORM_VERSION="1.6.0"
    TERRAFORM_URL="https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip"
    
    wget -q ${TERRAFORM_URL} -O /tmp/terraform.zip
    unzip -q /tmp/terraform.zip -d /tmp
    sudo mv /tmp/terraform /usr/local/bin/
    rm /tmp/terraform.zip
    
    echo -e "${GREEN}✓ Terraform instalado${NC}"
else
    echo -e "${GREEN}✓ Terraform já está instalado${NC}"
fi

# Verificar versões
echo -e "${GREEN}Versões instaladas:${NC}"
python3 --version
terraform version | head -n 1

echo -e "${GREEN}✓ Setup concluído!${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Execute: make install"
echo "  2. Configure o arquivo terraform.tfvars"
echo "  3. Execute: make init"
echo "  4. Execute: make plan"


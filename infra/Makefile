.PHONY: help install init plan apply destroy validate format clean venv check-terraform setup

# Variáveis
PYTHON := python3
VENV := venv
TERRAFORM_VERSION := 1.6.0
TERRAFORM_URL := https://releases.hashicorp.com/terraform/$(TERRAFORM_VERSION)/terraform_$(TERRAFORM_VERSION)_linux_amd64.zip

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Mostra esta mensagem de ajuda
	@echo "$(GREEN)Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

check-terraform: ## Verifica se Terraform está instalado
	@which terraform > /dev/null || (echo "$(RED)Terraform não encontrado. Execute: make setup$(NC)" && exit 1)
	@echo "$(GREEN)✓ Terraform encontrado:$$(terraform version | head -n 1)$(NC)"

setup: ## Instala Terraform (se necessário)
	@echo "$(YELLOW)Verificando instalação do Terraform...$(NC)"
	@if ! command -v terraform > /dev/null; then \
		echo "$(YELLOW)Instalando Terraform...$(NC)"; \
		wget -q $(TERRAFORM_URL) -O /tmp/terraform.zip; \
		unzip -q /tmp/terraform.zip -d /tmp; \
		sudo mv /tmp/terraform /usr/local/bin/; \
		rm /tmp/terraform.zip; \
		echo "$(GREEN)✓ Terraform instalado$(NC)"; \
	else \
		echo "$(GREEN)✓ Terraform já está instalado$(NC)"; \
	fi
	@terraform version

venv: ## Cria ambiente virtual Python
	@echo "$(YELLOW)Criando ambiente virtual...$(NC)"
	@if [ ! -d "$(VENV)" ]; then \
		$(PYTHON) -m venv $(VENV); \
		echo "$(GREEN)✓ Ambiente virtual criado$(NC)"; \
	else \
		echo "$(GREEN)✓ Ambiente virtual já existe$(NC)"; \
	fi

install: venv setup ## Instala dependências (venv + requirements)
	@echo "$(YELLOW)Instalando dependências...$(NC)"
	@if [ ! -f "$(VENV)/bin/activate" ]; then \
		echo "$(RED)Erro: Ambiente virtual não encontrado. Execute: make venv$(NC)"; \
		exit 1; \
	fi
	@bash -c "source $(VENV)/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"
	@echo "$(GREEN)✓ Dependências instaladas$(NC)"
	@echo "$(GREEN)Para ativar o ambiente virtual, execute: source $(VENV)/bin/activate$(NC)"

init: check-terraform ## Inicializa o Terraform
	@echo "$(YELLOW)Inicializando Terraform...$(NC)"
	@terraform init
	@echo "$(GREEN)✓ Terraform inicializado$(NC)"

validate: check-terraform ## Valida a configuração do Terraform
	@echo "$(YELLOW)Validando configuração...$(NC)"
	@terraform validate
	@echo "$(GREEN)✓ Configuração válida$(NC)"

format: check-terraform ## Formata os arquivos Terraform
	@echo "$(YELLOW)Formatando arquivos...$(NC)"
	@terraform fmt -recursive
	@echo "$(GREEN)✓ Arquivos formatados$(NC)"

plan: check-terraform init ## Mostra o plano de execução
	@echo "$(YELLOW)Gerando plano de execução...$(NC)"
	@terraform plan

apply: check-terraform init ## Aplica a configuração
	@echo "$(YELLOW)Aplicando configuração...$(NC)"
	@terraform apply

apply-auto: check-terraform init ## Aplica a configuração automaticamente (sem confirmação)
	@echo "$(YELLOW)Aplicando configuração (auto-approve)...$(NC)"
	@terraform apply -auto-approve

destroy: check-terraform ## Destroi a infraestrutura
	@echo "$(RED)ATENÇÃO: Isso irá destruir toda a infraestrutura!$(NC)"
	@terraform destroy

output: check-terraform ## Mostra os outputs do Terraform
	@terraform output

refresh: check-terraform ## Atualiza o estado do Terraform
	@echo "$(YELLOW)Atualizando estado...$(NC)"
	@terraform refresh
	@echo "$(GREEN)✓ Estado atualizado$(NC)"

clean: ## Remove arquivos temporários e cache
	@echo "$(YELLOW)Limpando arquivos temporários...$(NC)"
	@rm -rf .terraform
	@rm -f .terraform.lock.hcl
	@rm -f terraform.tfstate.backup
	@echo "$(GREEN)✓ Limpeza concluída$(NC)"

clean-all: clean ## Remove tudo (incluindo venv)
	@echo "$(YELLOW)Removendo ambiente virtual...$(NC)"
	@rm -rf $(VENV)
	@echo "$(GREEN)✓ Limpeza completa$(NC)"

check: check-terraform validate format ## Executa todas as verificações
	@echo "$(GREEN)✓ Todas as verificações passaram$(NC)"

# Comandos de desenvolvimento
dev-setup: install init ## Setup completo para desenvolvimento
	@echo "$(GREEN)✓ Ambiente de desenvolvimento configurado$(NC)"
	@echo "$(YELLOW)Próximos passos:$(NC)"
	@echo "  1. Configure o arquivo terraform.tfvars"
	@echo "  2. Execute: make plan"
	@echo "  3. Execute: make apply"

# Comandos úteis
show: check-terraform ## Mostra o estado atual
	@terraform show

graph: check-terraform ## Gera gráfico de dependências
	@echo "$(YELLOW)Gerando gráfico...$(NC)"
	@terraform graph | dot -Tpng > graph.png
	@echo "$(GREEN)✓ Gráfico gerado: graph.png$(NC)"

workspace-list: check-terraform ## Lista workspaces
	@terraform workspace list

workspace-new: check-terraform ## Cria novo workspace (use: make workspace-new NAME=nome)
	@if [ -z "$(NAME)" ]; then \
		echo "$(RED)Erro: Especifique o nome do workspace: make workspace-new NAME=nome$(NC)"; \
		exit 1; \
	fi
	@terraform workspace new $(NAME)

workspace-select: check-terraform ## Seleciona workspace (use: make workspace-select NAME=nome)
	@if [ -z "$(NAME)" ]; then \
		echo "$(RED)Erro: Especifique o nome do workspace: make workspace-select NAME=nome$(NC)"; \
		exit 1; \
	fi
	@terraform workspace select $(NAME)

# Informações do sistema
info: ## Mostra informações do ambiente
	@echo "$(GREEN)Informações do ambiente:$(NC)"
	@echo "  Python: $$(python3 --version 2>/dev/null || echo 'Não instalado')"
	@echo "  Terraform: $$(terraform version 2>/dev/null | head -n 1 || echo 'Não instalado')"
	@echo "  Sistema: $$(uname -a)"
	@echo "  Diretório: $$(pwd)"


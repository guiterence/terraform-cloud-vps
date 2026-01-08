# Resumo da Configuração - VPS Existente

## ✅ O que foi configurado

O Terraform agora está configurado para usar sua VPS existente no Contabo!

## 📋 O que você precisa fazer agora

### 1. Obter o IP da sua VPS

Siga o guia em `COMO_OBTER_IP_VPS.md` ou:

**Método rápido:**
1. Acesse: https://www.contabo.com/en/customer/
2. Vá em **VPS** ou **Servers**
3. Clique na sua VPS
4. Copie o **IP Address** (IPv4)

### 2. Configurar o IP no terraform.tfvars

Abra o arquivo `terraform.tfvars` e preencha:

```hcl
# VPS Existente
use_existing_vps = true
existing_vps_ip  = "SEU_IP_AQUI"  # Exemplo: "123.45.67.89"
```

### 3. Verificar outras configurações

Certifique-se de que:

- ✅ `vps_ssh_key` - Sua chave SSH pública está correta
- ✅ `ssh_private_key_path` - Caminho para sua chave SSH privada
- ✅ `vps_root_password` - Senha root da VPS (se necessário)
- ✅ Todas as outras credenciais estão preenchidas

### 4. Testar a conexão SSH

Antes de executar o Terraform, teste se consegue conectar:

```bash
ssh root@<IP_DA_VPS>
```

Se funcionar, está tudo certo! 🎉

## 🚀 Próximos passos

Depois de configurar o IP:

```bash
# 1. Inicializar o Terraform (se ainda não fez)
terraform init

# 2. Verificar o plano
terraform plan

# 3. Aplicar a configuração
terraform apply
```

## ⚠️ Importante

- A VPS deve estar **ligada** e **acessível**
- O firewall deve permitir conexões nas portas: **22** (SSH), **80** (HTTP), **443** (HTTPS)
- Você deve ter acesso **root** ou **sudo** na VPS
- A chave SSH deve estar configurada corretamente

## 📝 Notas

- Quando `use_existing_vps = true`, o Terraform **NÃO** tentará criar uma nova VPS
- Ele apenas usará o IP fornecido para:
  - Configurar o DNS no Cloudflare
  - Provisionar as ferramentas na VPS existente

## 🔍 Verificação

Para verificar se tudo está configurado corretamente:

```bash
# Ver as variáveis que serão usadas
terraform plan

# Verificar se o IP está correto nos outputs
terraform output vps_ip
```


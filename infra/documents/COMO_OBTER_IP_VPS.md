# Como Obter o IP da VPS Existente no Contabo

## Método 1: Painel Web do Contabo

1. **Acesse o painel do Contabo:**
   - Vá para: https://www.contabo.com/en/customer/
   - Faça login com suas credenciais

2. **Navegue até suas VPS:**
   - No menu lateral, clique em **"VPS"** ou **"Servers"**
   - Você verá a lista de suas VPS

3. **Encontre sua VPS:**
   - Clique na VPS que você quer usar
   - Na página de detalhes, procure por **"IP Address"** ou **"IPv4 Address"**
   - O IP será algo como: `123.45.67.89`

4. **Copie o IP:**
   - Copie o endereço IP completo
   - Cole no arquivo `terraform.tfvars` na variável `existing_vps_ip`

## Método 2: Via SSH (se já tiver acesso)

Se você já tem acesso SSH à VPS, pode obter o IP executando:

```bash
# Conecte-se à VPS
ssh root@<ip_da_vps>

# Execute um dos comandos abaixo para ver o IP
hostname -I
# ou
ip addr show
# ou
curl ifconfig.me  # Para ver o IP público
```

## Método 3: Via API do Contabo

Se você tiver as credenciais da API configuradas, pode usar:

```bash
# Usando curl (substitua as credenciais)
curl -X GET "https://api.contabo.com/v1/compute/instances" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

## Configuração no Terraform

Depois de obter o IP, configure no arquivo `terraform.tfvars`:

```hcl
# VPS Existente
use_existing_vps = true
existing_vps_ip  = "123.45.67.89"  # Substitua pelo IP real da sua VPS
```

## Verificação

Para verificar se o IP está correto, você pode testar a conexão:

```bash
# Teste de ping
ping <ip_da_vps>

# Teste de conexão SSH
ssh root@<ip_da_vps>
```

## Importante

⚠️ **Certifique-se de que:**
- A VPS está ligada e acessível
- Você tem acesso SSH configurado
- O firewall permite conexões nas portas necessárias (22, 80, 443)
- A chave SSH está configurada corretamente


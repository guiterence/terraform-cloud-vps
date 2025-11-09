# Como Verificar e Corrigir Credenciais do Cloudflare

## 🔍 Erro: Authentication error (10000)

Este erro significa que o Cloudflare não conseguiu autenticar sua requisição. Vamos verificar:

## 1. Verificar o API Token

### Obter um novo API Token:

1. **Acesse o Cloudflare Dashboard:**
   - Vá para: https://dash.cloudflare.com/profile/api-tokens

2. **Criar um novo token:**
   - Clique em **"Create Token"**
   - Use o template **"Edit zone DNS"** ou crie um customizado

3. **Permissões necessárias:**
   - **Zone** → **Zone** → **Read**
   - **Zone** → **DNS** → **Edit**
   - **Account** → **Zone** → **Read** (opcional)

4. **Recursos:**
   - Selecione **"Include"** → **"Specific zone"** → Selecione `terenceconsultoria.com.br`

5. **Copie o token:**
   - ⚠️ **IMPORTANTE**: Copie o token imediatamente, ele só aparece uma vez!

### Atualizar no terraform.tfvars:

```hcl
cloudflare_api_token = "SEU_NOVO_TOKEN_AQUI"
```

## 2. Verificar o Zone ID

### Como obter o Zone ID correto:

**Método 1: Via Dashboard**
1. Acesse: https://dash.cloudflare.com/
2. Clique no domínio `terenceconsultoria.com.br`
3. Na página do domínio, role até o final
4. O **Zone ID** está na seção **"API"** no lado direito

**Método 2: Via API (se tiver token válido)**
```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

### Atualizar no terraform.tfvars:

```hcl
cloudflare_zone_id = "SEU_ZONE_ID_AQUI"
```

## 3. Verificar se o domínio está no Cloudflare

Certifique-se de que:
- O domínio `terenceconsultoria.com.br` está adicionado ao Cloudflare
- Os nameservers do domínio estão apontando para o Cloudflare
- O domínio está ativo no Cloudflare

## 4. Testar a autenticação

### Via curl:

```bash
# Testar o token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

Se retornar `"success": true`, o token está válido.

### Via Terraform:

```bash
# Testar com terraform
terraform console

# No console, teste:
var.cloudflare_api_token
var.cloudflare_zone_id
```

## 5. Solução Rápida

1. **Criar novo API Token:**
   - https://dash.cloudflare.com/profile/api-tokens
   - Use template "Edit zone DNS"
   - Selecione o zone `terenceconsultoria.com.br`

2. **Obter Zone ID:**
   - Dashboard → Domínio → Scroll até "API" → Copiar Zone ID

3. **Atualizar terraform.tfvars:**
   ```hcl
   cloudflare_api_token = "novo_token_aqui"
   cloudflare_zone_id   = "zone_id_aqui"
   ```

4. **Testar novamente:**
   ```bash
   make plan
   ```

## 6. Problemas Comuns

### Token expirado ou revogado
- **Solução**: Criar um novo token

### Token sem permissões suficientes
- **Solução**: Verificar permissões (precisa de DNS:Edit)

### Zone ID incorreto
- **Solução**: Verificar no dashboard do Cloudflare

### Domínio não está no Cloudflare
- **Solução**: Adicionar o domínio ao Cloudflare primeiro

## 7. Verificar via Terraform

Depois de atualizar, teste:

```bash
# Validar configuração
terraform validate

# Ver plano
terraform plan

# Se funcionar, aplicar
terraform apply
```


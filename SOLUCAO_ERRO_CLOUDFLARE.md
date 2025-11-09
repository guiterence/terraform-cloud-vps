# 🔧 Solução: Erro de Autenticação Cloudflare

## ⚠️ Erro Atual

```
Authentication error (10000)
Too many authentication failures. Please try again later.
```

## 🚨 O que fazer AGORA

### 1. Aguardar 10-15 minutos
O Cloudflare bloqueou temporariamente devido a muitas tentativas falhadas. Aguarde antes de tentar novamente.

### 2. Verificar/Criar novo API Token

**Passo a passo:**

1. **Acesse:** https://dash.cloudflare.com/profile/api-tokens

2. **Criar novo token:**
   - Clique em **"Create Token"**
   - Use o template **"Edit zone DNS"**
   - OU crie customizado com:
     - **Permissions:**
       - Zone → Zone → Read
       - Zone → DNS → Edit
     - **Zone Resources:**
       - Include → Specific zone → `terenceconsultoria.com.br`

3. **Copiar o token:**
   - ⚠️ **COPIE AGORA** - ele só aparece uma vez!

4. **Atualizar terraform.tfvars:**
   ```hcl
   cloudflare_api_token = "SEU_NOVO_TOKEN_AQUI"
   ```

### 3. Verificar Zone ID

1. **Acesse:** https://dash.cloudflare.com/
2. **Clique no domínio:** `terenceconsultoria.com.br`
3. **Role até o final da página**
4. **Na seção "API" (lado direito)**, copie o **Zone ID**

5. **Atualizar terraform.tfvars:**
   ```hcl
   cloudflare_zone_id = "SEU_ZONE_ID_AQUI"
   ```

### 4. Testar o token (depois de aguardar)

```bash
# Testar se o token está válido
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

### 5. Tentar novamente (depois de aguardar)

```bash
# Aguardar 10-15 minutos primeiro!

# Depois testar
make plan

# Se funcionar, aplicar
make apply
```

## 📋 Checklist

- [ ] Aguardar 10-15 minutos (bloqueio temporário)
- [ ] Criar novo API Token no Cloudflare
- [ ] Verificar Zone ID no dashboard
- [ ] Atualizar `terraform.tfvars` com novo token e Zone ID
- [ ] Testar token via curl
- [ ] Executar `make plan` novamente

## 🔍 Verificar se o domínio está no Cloudflare

Certifique-se de que:
- O domínio `terenceconsultoria.com.br` está adicionado ao Cloudflare
- Os nameservers estão configurados corretamente
- O domínio está ativo

## 💡 Dica

Se continuar com problemas, você pode:
1. **Pular o DNS por enquanto** - comentar o módulo Cloudflare e provisionar apenas as ferramentas
2. **Configurar DNS manualmente** - depois configurar os registros no Cloudflare manualmente
3. **Usar IP direto** - acessar as ferramentas via IP até resolver o DNS

## 🆘 Se nada funcionar

1. Verifique se o domínio está realmente no Cloudflare
2. Verifique se o token tem as permissões corretas
3. Tente usar a API Key ao invés do Token (método antigo, menos seguro)


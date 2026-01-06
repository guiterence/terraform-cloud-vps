# Como Conectar N8N ao Supabase Self-Hosted

## Problema Resolvido! ✅

O problema era que o `service_key` no `terraform.tfvars` era apenas um **secret** (45 caracteres), mas o N8N Supabase plugin espera um **JWT token válido** (180+ caracteres).

**Solução aplicada**: Geramos um JWT token válido usando o secret como chave de assinatura. O token foi atualizado no `terraform.tfvars` e está pronto para uso!

### Como foi resolvido:

1. O `service_key` original tinha apenas 45 caracteres (era apenas o secret)
2. Um JWT token válido tem ~180 caracteres e contém o payload assinado
3. Geramos o JWT token usando: `python3 scripts/generate_supabase_jwt.py '<secret>' service_role 365`
4. O token foi atualizado no `terraform.tfvars` e aplicado ao PostgREST

**Agora você pode usar o plugin Supabase do N8N normalmente!** 🎉

## Soluções

### Solução 1: Usar o Nó HTTP Request (Recomendado)

A forma mais simples e confiável é usar o nó **HTTP Request** do N8N em vez do plugin Supabase:

1. **Adicione um nó HTTP Request** no seu workflow
2. **Configure a URL**: `https://supabase.terenceconsultoria.com.br/rest/v1/{tabela}`
3. **Configure os Headers**:
   - `apikey`: `n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=`
   - `Authorization`: `Bearer n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=` (opcional, mas pode ser necessário)
   - `Content-Type`: `application/json`
   - `Prefer`: `return=representation` (para retornar dados após INSERT/UPDATE)

4. **Exemplos de uso**:

   **GET (Listar registros)**:
   ```
   Method: GET
   URL: https://supabase.terenceconsultoria.com.br/rest/v1/users?select=*
   Headers:
     - apikey: n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=
   ```

   **POST (Criar registro)**:
   ```
   Method: POST
   URL: https://supabase.terenceconsultoria.com.br/rest/v1/users
   Headers:
     - apikey: n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=
     - Content-Type: application/json
     - Prefer: return=representation
   Body (JSON):
     {
       "name": "João",
       "email": "joao@example.com"
     }
   ```

   **PATCH (Atualizar registro)**:
   ```
   Method: PATCH
   URL: https://supabase.terenceconsultoria.com.br/rest/v1/users?id=eq.{id}
   Headers:
     - apikey: n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=
     - Content-Type: application/json
     - Prefer: return=representation
   Body (JSON):
     {
       "name": "João Silva"
     }
   ```

   **DELETE (Deletar registro)**:
   ```
   Method: DELETE
   URL: https://supabase.terenceconsultoria.com.br/rest/v1/users?id=eq.{id}
   Headers:
     - apikey: n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=
     - Prefer: return=representation
   ```

### Solução 2: Gerar JWT Token (Alternativa)

Se você realmente precisa usar o plugin Supabase do N8N, você pode gerar um JWT token válido:

1. **Instale PyJWT**:
   ```bash
   pip install PyJWT
   ```

2. **Gere o token** usando o script fornecido:
   ```bash
   python3 scripts/generate_supabase_jwt.py 'n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=' service_role
   ```

3. **Use o token gerado** no campo "Service Role Secret" do N8N

**Nota**: O token expira após um período (padrão: 365 dias), então você precisará gerar um novo token periodicamente.

## Documentação do PostgREST

Para mais informações sobre como usar a API do PostgREST, consulte:
- [Documentação oficial do PostgREST](https://postgrest.org/en/stable/api.html)
- [Filtros e operadores](https://postgrest.org/en/stable/api.html#operators)

## Testando a Conexão

Você pode testar se o PostgREST está funcionando corretamente usando `curl`:

```bash
# Teste básico
curl -H "apikey: n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=" \
  https://supabase.terenceconsultoria.com.br/rest/v1/

# Listar tabelas disponíveis
curl -H "apikey: n78oYSAI5XiVxH5Ua4CYf4W+q1cS/QuSsbH9moX2onY=" \
  https://supabase.terenceconsultoria.com.br/rest/v1/users?select=*
```

## Troubleshooting

### Erro "Authorization failed"
- Verifique se está usando o header `apikey` corretamente
- Certifique-se de que o `service_key` está correto no `terraform.tfvars`
- Teste a conexão usando `curl` primeiro

### Erro 401 Unauthorized
- Verifique se as permissões no PostgreSQL estão corretas (roles `anon`, `authenticated`, `service_role`)
- Verifique se o PostgREST está rodando: `docker logs postgrest`

### Erro 404 Not Found
- Verifique se a URL está correta: `https://supabase.terenceconsultoria.com.br/rest/v1/{tabela}`
- Verifique se a tabela existe no schema `public`


# Como Configurar a Chave SSH

## 🔍 Verificar se você já tem uma chave SSH

Execute no terminal:

```bash
# Verificar se existe chave SSH
ls -la ~/.ssh/

# Ver a chave pública (se existir)
cat ~/.ssh/id_rsa.pub
# ou
cat ~/.ssh/id_ed25519.pub
```

## 🔑 Gerar uma nova chave SSH (se não tiver)

Se você não tiver uma chave SSH, gere uma nova:

```bash
# Gerar chave SSH RSA (mais comum)
ssh-keygen -t rsa -b 4096 -C "seu_email@exemplo.com"

# Ou gerar chave SSH Ed25519 (mais moderna e segura)
ssh-keygen -t ed25519 -C "seu_email@exemplo.com"
```

**Durante a geração:**
- Pressione Enter para usar o local padrão (`~/.ssh/id_rsa` ou `~/.ssh/id_ed25519`)
- Opcionalmente, defina uma senha para proteger a chave

## 📋 Copiar a chave pública

Depois de gerar ou encontrar sua chave, copie o conteúdo:

```bash
# Para chave RSA
cat ~/.ssh/id_rsa.pub

# Para chave Ed25519
cat ~/.ssh/id_ed25519.pub
```

A saída será algo como:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... seu_email@exemplo.com
```

## ⚙️ Configurar no terraform.tfvars

Abra o arquivo `terraform.tfvars` e configure:

```hcl
# SSH Configuration
vps_ssh_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... seu_email@exemplo.com"
ssh_private_key_path = "~/.ssh/id_rsa"  # ou ~/.ssh/id_ed25519
```

**Importante:**
- `vps_ssh_key` = chave **pública** (arquivo `.pub`)
- `ssh_private_key_path` = caminho para a chave **privada** (sem `.pub`)

## 🔐 Adicionar a chave pública na VPS

Se sua VPS já existe, você precisa adicionar a chave pública nela:

### Opção 1: Via SSH com senha (primeira vez)

```bash
# Conectar à VPS usando senha
ssh root@86.48.17.133

# Depois de conectar, adicionar a chave pública
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "SUA_CHAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Opção 2: Usando ssh-copy-id (mais fácil)

```bash
# Instalar ssh-copy-id se não tiver
sudo apt-get install openssh-client

# Copiar chave automaticamente
ssh-copy-id root@86.48.17.133
```

### Opção 3: Via painel do Contabo

1. Acesse o painel do Contabo
2. Vá em **VPS** > Sua VPS
3. Procure por **SSH Keys** ou **Chaves SSH**
4. Adicione sua chave pública lá

## ✅ Testar a conexão SSH

Depois de configurar, teste:

```bash
# Testar conexão sem senha
ssh root@86.48.17.133

# Se funcionar sem pedir senha, está configurado corretamente!
```

## 🔧 Verificar permissões da chave privada

Certifique-se de que a chave privada tem as permissões corretas:

```bash
chmod 600 ~/.ssh/id_rsa
# ou
chmod 600 ~/.ssh/id_ed25519
```

## 📝 Resumo rápido

1. **Verificar se tem chave:** `cat ~/.ssh/id_rsa.pub`
2. **Se não tiver, gerar:** `ssh-keygen -t rsa -b 4096`
3. **Copiar chave pública:** `cat ~/.ssh/id_rsa.pub`
4. **Colar no terraform.tfvars:** na variável `vps_ssh_key`
5. **Adicionar na VPS:** `ssh-copy-id root@86.48.17.133`
6. **Testar:** `ssh root@86.48.17.133`

## ⚠️ Importante

- A chave **pública** (`.pub`) vai no `terraform.tfvars` e na VPS
- A chave **privada** (sem `.pub`) fica apenas no seu computador
- **NUNCA** compartilhe ou commite a chave privada no Git
- A chave privada já está protegida no `.gitignore`


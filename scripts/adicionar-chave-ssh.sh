#!/bin/bash
# Script para adicionar chave SSH ao servidor

set -e

VPS_IP="86.48.17.133"
VPS_USER="root"
SSH_KEY_PUB="$HOME/.ssh/id_ed25519.pub"

echo "🔑 Adicionando chave SSH ao servidor..."
echo ""

# Verificar se a chave pública existe
if [ ! -f "$SSH_KEY_PUB" ]; then
    echo "❌ Erro: Chave pública não encontrada em $SSH_KEY_PUB"
    exit 1
fi

# Ler a chave pública
PUBLIC_KEY=$(cat "$SSH_KEY_PUB")

echo "📋 Sua chave pública:"
echo "$PUBLIC_KEY"
echo ""
echo "📝 Para adicionar ao servidor, execute:"
echo ""
echo "ssh $VPS_USER@$VPS_IP 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo \"$PUBLIC_KEY\" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'"
echo ""
echo "OU use ssh-copy-id:"
echo "ssh-copy-id -i $SSH_KEY_PUB $VPS_USER@$VPS_IP"
echo ""
read -p "Deseja executar ssh-copy-id agora? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🚀 Executando ssh-copy-id..."
    ssh-copy-id -i "$SSH_KEY_PUB" "$VPS_USER@$VPS_IP"
    
    if [ $? -eq 0 ]; then
        echo "✅ Chave adicionada com sucesso!"
        echo "🧪 Testando conexão..."
        ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo 'Conexão SSH funcionando!'"
        echo ""
        echo "✅ Tudo pronto! Agora você pode executar 'make apply'"
    else
        echo "❌ Erro ao adicionar chave. Verifique a senha root."
    fi
else
    echo "ℹ️  Execute o comando manualmente quando estiver pronto."
fi


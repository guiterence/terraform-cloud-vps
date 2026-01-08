#!/bin/bash
# Script para deploy de Edge Functions do Supabase

set -e

SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [ -z "$SUPABASE_PROJECT_REF" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Erro: SUPABASE_PROJECT_REF e SUPABASE_ACCESS_TOKEN devem estar definidos"
  exit 1
fi

# Instalar Supabase CLI se não estiver instalado
if ! command -v supabase &> /dev/null; then
  echo "Instalando Supabase CLI..."
  npm install -g supabase
fi

# Fazer login
echo "$SUPABASE_ACCESS_TOKEN" | supabase login --token -

# Linkar ao projeto
supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Deploy das funções
cd /opt/docker/campaign-builder/supabase

if [ -d "functions/target-groups" ]; then
  echo "Deployando função target-groups..."
  supabase functions deploy target-groups
fi

echo "Deploy concluído!"


#!/bin/bash
# ─── Bora? App - Script de Deploy na VPS ─────────────────────────────────────
# Uso: ./deploy.sh
# Execute na VPS após clonar o repositório

set -e

echo "🚀 Iniciando deploy do Bora?..."

# Verificar se .env existe
if [ ! -f .env ]; then
  echo "⚠️  Arquivo .env não encontrado. Criando a partir do .env.example..."
  cp .env.example .env
  echo "✏️  Edite o arquivo .env com suas configurações antes de continuar."
  echo "   nano .env"
  exit 1
fi

# Pull das últimas alterações
echo "📥 Atualizando código..."
git pull origin main

# Build e restart
echo "🔨 Fazendo build e reiniciando containers..."
docker compose down
docker compose build --no-cache
docker compose up -d

# Aguardar healthcheck
echo "⏳ Aguardando app inicializar..."
sleep 5

# Verificar status
if docker compose ps | grep -q "healthy\|Up"; then
  echo "✅ Bora? está rodando!"
  echo ""
  echo "📱 Acesse: http://$(hostname -I | awk '{print $1}'):3000"
  docker compose ps
else
  echo "❌ Erro no deploy. Verificando logs..."
  docker compose logs --tail=50
fi

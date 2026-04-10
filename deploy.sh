#!/bin/bash
# ─── Bora? App - Script de Deploy na VPS ─────────────────────────────────────
set -e

echo "🚀 Iniciando deploy do Bora?..."

if [ ! -f .env ]; then
  echo "⚠️  Arquivo .env não encontrado. Criando a partir do .env.example..."
  cp .env.example .env
  echo "✏️  Edite o arquivo .env antes de continuar: nano .env"
  exit 1
fi

echo "📥 Atualizando código..."
git pull origin main

echo "🔨 Fazendo build e reiniciando containers..."
docker compose down --remove-orphans
docker compose build
docker compose up -d

echo "⏳ Aguardando app inicializar..."
sleep 8

echo ""
if docker compose ps | grep -q "Up"; then
  echo "✅ Bora? está rodando!"
  docker compose ps
  echo ""
  echo "📱 Acesse: https://$(grep DOMAIN .env | cut -d= -f2)"
else
  echo "❌ Erro no deploy. Verificando logs..."
  docker compose logs --tail=50
fi

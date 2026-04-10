#!/bin/bash
# ─── Bora? App - Setup Inicial na VPS Hostinger ──────────────────────────────
# Execute este script UMA VEZ na VPS para configurar tudo do zero
# Uso: bash setup-vps.sh

set -e

echo "🔧 Configurando VPS para o Bora?..."

# Atualizar sistema
echo "📦 Atualizando pacotes..."
sudo apt-get update -y && sudo apt-get upgrade -y

# Instalar Docker
if ! command -v docker &> /dev/null; then
  echo "🐳 Instalando Docker..."
  curl -fsSL https://get.docker.com | bash
  sudo usermod -aG docker $USER
  echo "✅ Docker instalado!"
else
  echo "✅ Docker já instalado: $(docker --version)"
fi

# Instalar Docker Compose plugin
if ! docker compose version &> /dev/null; then
  echo "📦 Instalando Docker Compose plugin..."
  sudo apt-get install -y docker-compose-plugin
fi

echo "✅ Docker Compose: $(docker compose version)"

# Clonar repositório se não existir
if [ ! -d "bora" ]; then
  echo "📥 Clonando repositório..."
  git clone https://github.com/zoncada/bora.git
  cd bora
else
  echo "📁 Repositório já existe."
  cd bora
  git pull origin main
fi

# Configurar .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANTE: Configure o arquivo .env antes de continuar!"
  echo "   nano .env"
  echo ""
  echo "   Mínimo necessário:"
  echo "   - JWT_SECRET: troque por uma string aleatória longa"
  echo "   - DOMAIN: seu domínio (ex: bora.seusite.com.br)"
  echo ""
  echo "   Após editar, execute: ./deploy.sh"
else
  # Fazer deploy direto
  chmod +x deploy.sh
  ./deploy.sh
fi

echo ""
echo "🎉 Setup concluído!"

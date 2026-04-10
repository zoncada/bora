# Bora? — Decisões rápidas em família ⚡

App mobile PWA para decisões rápidas em família. Sem enrolação. Sem chat. Só resposta.

## Funcionalidades

- Criar votações em segundos com templates prontos
- Votar com 1 toque
- Ver resultado em tempo real (WebSocket)
- Notificações push para membros do grupo
- Grupos familiares com convite por link/código
- Histórico de decisões
- PWA — instala no iPhone/Android como app nativo

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express + WebSocket |
| Banco | SQLite (better-sqlite3) |
| Push | Web Push API (VAPID) |
| Deploy | Docker + Docker Compose |

## Deploy na VPS (Hostinger)

### 1. Primeiro acesso — Setup inicial

```bash
# Conectar na VPS
ssh root@SEU_IP_VPS

# Baixar e executar o setup
curl -fsSL https://raw.githubusercontent.com/zoncada/bora/main/setup-vps.sh | bash
```

### 2. Configurar variáveis de ambiente

```bash
cd bora
nano .env
```

Edite com seus valores:
```env
PORT=3000
DOMAIN=bora.seudominio.com.br
JWT_SECRET=troque-por-string-aleatoria-longa
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Atualizar após mudanças

```bash
cd bora
./deploy.sh
```

## Comandos úteis

```bash
# Ver logs em tempo real
docker compose logs -f

# Reiniciar o app
docker compose restart

# Parar o app
docker compose down

# Ver status
docker compose ps

# Backup do banco de dados
docker compose exec bora cp /app/data/bora.db /app/data/bora.db.bak
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `3000` |
| `DOMAIN` | Domínio para SSL | `bora.localhost` |
| `JWT_SECRET` | Chave secreta JWT | *(obrigatório trocar)* |
| `VAPID_PUBLIC_KEY` | Chave pública push | *(gerada)* |
| `VAPID_PRIVATE_KEY` | Chave privada push | *(gerada)* |

## Gerar novas chaves VAPID

```bash
npx web-push generate-vapid-keys
```

---

Desenvolvido com ❤️ para a família.

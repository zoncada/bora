const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
require('dotenv').config();

const db = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET = process.env.JWT_SECRET || 'bora-secret-key-2024';
const PORT = process.env.PORT || 3000;

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';

webpush.setVapidDetails(
  'mailto:bora@app.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// WebSocket clients map: userId -> ws
const clients = new Map();

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/?', ''));
  const token = params.get('token');
  let userId = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
      clients.set(userId, ws);
    } catch (e) {}
  }

  ws.on('close', () => {
    if (userId) clients.delete(userId);
  });
});

function broadcast(groupId, event, data) {
  const members = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(groupId);
  members.forEach(({ user_id }) => {
    const ws = clients.get(user_id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  });
}

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ─── AUTH ROUTES ────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const avatar = name.charAt(0).toUpperCase();

  db.prepare('INSERT INTO users (id, name, email, password, avatar) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hash, avatar);

  const token = jwt.sign({ userId: id, name }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, name, email, avatar } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Senha incorreta' });

  const token = jwt.sign({ userId: user.id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, avatar FROM users WHERE id = ?').get(req.user.userId);
  res.json(user);
});

// ─── GROUPS ROUTES ───────────────────────────────────────────────────────────

app.post('/api/groups', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome do grupo obrigatório' });

  const id = uuidv4();
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  db.prepare('INSERT INTO groups (id, name, owner_id, invite_code) VALUES (?, ?, ?, ?)').run(id, name, req.user.userId, inviteCode);
  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(id, req.user.userId);

  res.json({ id, name, inviteCode });
});

app.post('/api/groups/join', auth, (req, res) => {
  const { inviteCode } = req.body;
  const group = db.prepare('SELECT * FROM groups WHERE invite_code = ?').get(inviteCode?.toUpperCase());
  if (!group) return res.status(404).json({ error: 'Código inválido' });

  const existing = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(group.id, req.user.userId);
  if (existing) return res.status(400).json({ error: 'Você já está neste grupo' });

  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(group.id, req.user.userId);
  res.json({ id: group.id, name: group.name, inviteCode: group.invite_code });
});

app.get('/api/groups', auth, (req, res) => {
  const groups = db.prepare(`
    SELECT g.id, g.name, g.invite_code as inviteCode,
           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as memberCount
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `).all(req.user.userId);
  res.json(groups);
});

app.get('/api/groups/:id/members', auth, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar FROM users u
    INNER JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ?
  `).all(req.params.id);
  res.json(members);
});

// ─── POLLS ROUTES ────────────────────────────────────────────────────────────

app.post('/api/polls', auth, (req, res) => {
  const { question, options, deadline, groupId, mode } = req.body;
  if (!question || !options || !groupId) return res.status(400).json({ error: 'Dados incompletos' });

  const id = uuidv4();
  const optionsJson = JSON.stringify(options);

  db.prepare('INSERT INTO polls (id, question, options, deadline, group_id, creator_id, mode) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, question, optionsJson, deadline || null, groupId, req.user.userId, mode || 'majority'
  );

  const poll = getPollWithStats(id, req.user.userId);
  broadcast(groupId, 'poll:new', poll);

  // Schedule push notifications
  sendPushToGroup(groupId, req.user.userId, {
    title: 'Nova votação no Bora!',
    body: question,
    data: { pollId: id }
  });

  res.json(poll);
});

app.get('/api/polls', auth, (req, res) => {
  const { groupId, status } = req.query;

  let query = `
    SELECT p.* FROM polls p
    INNER JOIN group_members gm ON p.group_id = gm.group_id
    WHERE gm.user_id = ?
  `;
  const params = [req.user.userId];

  if (groupId) { query += ' AND p.group_id = ?'; params.push(groupId); }
  if (status === 'open') query += ' AND (p.closed = 0 AND (p.deadline IS NULL OR p.deadline > datetime("now")))';
  if (status === 'closed') query += ' AND (p.closed = 1 OR (p.deadline IS NOT NULL AND p.deadline <= datetime("now")))';

  query += ' ORDER BY p.created_at DESC';

  const polls = db.prepare(query).all(...params);
  const result = polls.map(p => getPollWithStats(p.id, req.user.userId));
  res.json(result);
});

app.get('/api/polls/:id', auth, (req, res) => {
  const poll = getPollWithStats(req.params.id, req.user.userId);
  if (!poll) return res.status(404).json({ error: 'Votação não encontrada' });
  res.json(poll);
});

app.post('/api/polls/:id/vote', auth, (req, res) => {
  const { option } = req.body;
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Votação não encontrada' });
  if (poll.closed) return res.status(400).json({ error: 'Votação encerrada' });

  const existing = db.prepare('SELECT id FROM votes WHERE poll_id = ? AND user_id = ?').get(req.params.id, req.user.userId);
  if (existing) {
    db.prepare('UPDATE votes SET option = ? WHERE poll_id = ? AND user_id = ?').run(option, req.params.id, req.user.userId);
  } else {
    db.prepare('INSERT INTO votes (id, poll_id, user_id, option) VALUES (?, ?, ?, ?)').run(uuidv4(), req.params.id, req.user.userId, option);
  }

  // Check if all members voted (mode: all)
  if (poll.mode === 'all') {
    const memberCount = db.prepare('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?').get(poll.group_id).c;
    const voteCount = db.prepare('SELECT COUNT(*) as c FROM votes WHERE poll_id = ?').get(req.params.id).c;
    if (voteCount >= memberCount) {
      db.prepare('UPDATE polls SET closed = 1 WHERE id = ?').run(req.params.id);
    }
  }

  const updated = getPollWithStats(req.params.id, req.user.userId);
  broadcast(poll.group_id, 'poll:updated', updated);
  res.json(updated);
});

app.post('/api/polls/:id/close', auth, (req, res) => {
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Votação não encontrada' });
  if (poll.creator_id !== req.user.userId) return res.status(403).json({ error: 'Sem permissão' });

  db.prepare('UPDATE polls SET closed = 1 WHERE id = ?').run(req.params.id);
  const updated = getPollWithStats(req.params.id, req.user.userId);
  broadcast(poll.group_id, 'poll:updated', updated);
  res.json(updated);
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────

app.post('/api/push/subscribe', auth, (req, res) => {
  const { subscription } = req.body;
  db.prepare('INSERT OR REPLACE INTO push_subscriptions (user_id, subscription) VALUES (?, ?)').run(
    req.user.userId, JSON.stringify(subscription)
  );
  res.json({ ok: true });
});

app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

function sendPushToGroup(groupId, excludeUserId, payload) {
  const members = db.prepare('SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?').all(groupId, excludeUserId);
  members.forEach(({ user_id }) => {
    const row = db.prepare('SELECT subscription FROM push_subscriptions WHERE user_id = ?').get(user_id);
    if (row) {
      try {
        webpush.sendNotification(JSON.parse(row.subscription), JSON.stringify(payload)).catch(() => {});
      } catch (e) {}
    }
  });
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

app.get('/api/templates', auth, (req, res) => {
  res.json([
    { id: 1, name: 'Almoço', icon: '🍽️', question: 'Quem vai no almoço?', options: ['Vou', 'Não vou', 'Talvez'] },
    { id: 2, name: 'Viagem', icon: '✈️', question: 'Quem topa a viagem?', options: ['Topo', 'Não posso', 'Talvez'] },
    { id: 3, name: 'Presente', icon: '🎁', question: 'Quem entra no presente?', options: ['Entro', 'Não entro', 'Talvez'] },
    { id: 4, name: 'Carona', icon: '🚗', question: 'Quem pode dar carona?', options: ['Posso', 'Não posso', 'Talvez'] },
    { id: 5, name: 'Reunião', icon: '📅', question: 'Quem pode na reunião?', options: ['Posso', 'Não posso', 'Talvez'] },
  ]);
});

// ─── HELPER ──────────────────────────────────────────────────────────────────

function getPollWithStats(pollId, userId) {
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId);
  if (!poll) return null;

  const options = JSON.parse(poll.options);
  const votes = db.prepare('SELECT option, user_id FROM votes WHERE poll_id = ?').all(pollId);
  const memberCount = db.prepare('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?').get(poll.group_id).c;
  const creator = db.prepare('SELECT name FROM users WHERE id = ?').get(poll.creator_id);

  const voteCounts = {};
  options.forEach(o => voteCounts[o] = 0);
  votes.forEach(v => { if (voteCounts[v.option] !== undefined) voteCounts[v.option]++; });

  const userVote = votes.find(v => v.user_id === userId)?.option || null;
  const isExpired = poll.deadline && new Date(poll.deadline) < new Date();
  const isClosed = poll.closed === 1 || isExpired;

  const winner = isClosed ? Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0] : null;

  const respondedUsers = db.prepare(`
    SELECT u.id, u.name, u.avatar FROM users u
    INNER JOIN votes v ON u.id = v.user_id WHERE v.poll_id = ?
  `).all(pollId);

  const pendingUsers = db.prepare(`
    SELECT u.id, u.name, u.avatar FROM users u
    INNER JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ? AND u.id NOT IN (SELECT user_id FROM votes WHERE poll_id = ?)
  `).all(poll.group_id, pollId);

  return {
    id: poll.id,
    question: poll.question,
    options,
    voteCounts,
    deadline: poll.deadline,
    groupId: poll.group_id,
    creatorId: poll.creator_id,
    creatorName: creator?.name,
    mode: poll.mode,
    closed: isClosed,
    winner,
    userVote,
    totalVotes: votes.length,
    memberCount,
    respondedUsers,
    pendingUsers,
    createdAt: poll.created_at
  };
}

// Serve frontend
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`Bora! server running on port ${PORT}`);
});

module.exports = { app, broadcast };

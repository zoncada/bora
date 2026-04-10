// Script de diagnóstico do sistema de convites
// Execute na VPS: node backend/diagnose-invite.js
const db = require('./database');

console.log('\n=== DIAGNÓSTICO DE CONVITES ===\n');

// 1. Listar todos os grupos e seus códigos
const groups = db.prepare('SELECT id, name, invite_code, owner_id FROM groups').all();
console.log(`Grupos no banco: ${groups.length}`);
groups.forEach(g => {
  const memberCount = db.prepare('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?').get(g.id).c;
  console.log(`  [${g.id.slice(0,8)}] "${g.name}" | código: ${g.invite_code} | membros: ${memberCount}`);
});

// 2. Listar todos os usuários
const users = db.prepare('SELECT id, name, email FROM users').all();
console.log(`\nUsuários no banco: ${users.length}`);
users.forEach(u => {
  const groups = db.prepare(`
    SELECT g.name FROM groups g 
    INNER JOIN group_members gm ON g.id = gm.group_id 
    WHERE gm.user_id = ?
  `).all(u.id);
  console.log(`  [${u.id.slice(0,8)}] ${u.name} (${u.email}) | grupos: ${groups.map(g=>g.name).join(', ') || 'nenhum'}`);
});

// 3. Testar busca por código (simular o que o backend faz)
console.log('\n=== TESTE DE BUSCA POR CÓDIGO ===');
groups.forEach(g => {
  const found = db.prepare('SELECT * FROM groups WHERE invite_code = ?').get(g.invite_code);
  console.log(`  Busca por "${g.invite_code}": ${found ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌'}`);
  const foundUpper = db.prepare('SELECT * FROM groups WHERE invite_code = ?').get(g.invite_code.toUpperCase());
  console.log(`  Busca por "${g.invite_code.toUpperCase()}" (upper): ${foundUpper ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌'}`);
});

// 4. Verificar o link que está sendo gerado
const APP_URL = process.env.APP_URL || 'https://bora.valenzi.tech';
console.log('\n=== LINKS DE CONVITE ===');
groups.forEach(g => {
  console.log(`  "${g.name}": ${APP_URL}/join/${g.invite_code}`);
});

process.exit(0);

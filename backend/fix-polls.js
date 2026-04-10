// Script para corrigir votações fechadas indevidamente (sem votos)
// Execute na VPS: node backend/fix-polls.js
const db = require('./database');

console.log('Verificando votações fechadas sem votos...');

// Busca polls fechadas que não têm nenhum voto
const badPolls = db.prepare(`
  SELECT p.id, p.question, p.mode, p.closed,
    (SELECT COUNT(*) FROM votes WHERE poll_id = p.id) as vote_count
  FROM polls p
  WHERE p.closed = 1
`).all();

let fixed = 0;
badPolls.forEach(poll => {
  if (poll.vote_count === 0) {
    console.log(`Reabrindo: "${poll.question}" (id: ${poll.id}, mode: ${poll.mode}, votos: 0)`);
    db.prepare('UPDATE polls SET closed = 0 WHERE id = ?').run(poll.id);
    fixed++;
  } else {
    console.log(`OK: "${poll.question}" (votos: ${poll.vote_count}) — mantida fechada`);
  }
});

console.log(`\nCorrigidas: ${fixed} votações reabertas.`);
process.exit(0);

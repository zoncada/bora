import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../utils/api';

const AVATAR_COLORS = ['#4F7CFF', '#FF6B6B', '#FFB347', '#47D1A8', '#A855F7', '#EC4899'];
function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);

  const loadPoll = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/polls/${id}`);
      setPoll(data);
    } catch {
      navigate('/home');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadPoll(); }, [loadPoll]);

  const handleWsMessage = useCallback(({ event, data }) => {
    if ((event === 'poll:updated' || event === 'poll:new') && data.id === id) {
      setPoll(data);
    }
  }, [id]);

  useWebSocket(handleWsMessage);

  const handleVote = async (option) => {
    if (voting || poll?.closed) return;
    setVoting(true);
    try {
      const { data } = await api.post(`/api/polls/${id}/vote`, { option });
      setPoll(data);
      setVoted(true);
      setTimeout(() => setVoted(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Encerrar esta votação?')) return;
    try {
      const { data } = await api.post(`/api/polls/${id}/close`);
      setPoll(data);
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-4xl animate-bounce">⚡</div>
    </div>
  );

  if (!poll) return null;

  const canClose = poll.canClose; // backend retorna: criador OU admin do grupo
  const deadline = poll.deadline
    ? formatDistanceToNow(parseISO(poll.deadline), { addSuffix: true, locale: ptBR })
    : null;

  const maxVotes = Math.max(...Object.values(poll.voteCounts), 1);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost px-0">← Voltar</button>
          <div className="flex-1" />
          {canClose && !poll.closed && (
            <button onClick={handleClose} className="text-sm text-red-400 font-medium">
              Encerrar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 space-y-4">

        {/* Question Card */}
        <div className={poll.closed ? 'winner-card' : 'card'}>
          <div className="flex items-start justify-between gap-3">
            <h2 className={`text-xl font-bold leading-snug flex-1 ${poll.closed ? 'text-white' : 'text-gray-900'}`}>
              {poll.question}
            </h2>
            <span className={`badge shrink-0 ${poll.closed ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-500'}`}>
              {poll.closed ? 'Encerrada' : 'Aberta'}
            </span>
          </div>

          {poll.closed && poll.winner && (
            <div className="mt-3 bg-white/20 rounded-2xl px-4 py-3">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Decisão final</p>
              <p className="text-white text-xl font-bold mt-0.5">{poll.winner}</p>
            </div>
          )}

          <div className={`flex items-center gap-3 mt-3 text-sm ${poll.closed ? 'text-white/70' : 'text-gray-400'}`}>
            <span>{poll.totalVotes}/{poll.memberCount} responderam</span>
            {deadline && !poll.closed && <span>· ⏰ {deadline}</span>}
          </div>
        </div>

        {/* Vote Buttons (if open and not voted) */}
        {!poll.closed && (
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-3">
              {poll.userVote ? `Você votou: ${poll.userVote}` : 'Sua resposta'}
            </p>
            <div className="flex flex-col gap-3">
              {poll.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleVote(opt)}
                  disabled={voting}
                  className={`vote-btn text-center ${
                    poll.userVote === opt ? 'vote-btn-selected' : 'vote-btn-unselected'
                  }`}
                >
                  {poll.userVote === opt && '✓ '}{opt}
                </button>
              ))}
            </div>
            {voted && (
              <div className="mt-3 text-center text-green-500 font-semibold animate-bounce">
                Voto registrado! ✅
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {(poll.totalVotes > 0 || poll.closed) && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Resultado parcial</h3>
            <div className="space-y-3">
              {poll.options.map((opt) => {
                const count = poll.voteCounts[opt] || 0;
                const pct = poll.memberCount > 0 ? Math.round((count / poll.memberCount) * 100) : 0;
                const isWinner = poll.closed && opt === poll.winner;
                return (
                  <div key={opt}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${isWinner ? 'text-primary-500' : 'text-gray-700'}`}>
                        {isWinner && '🏆 '}{opt}
                      </span>
                      <span className="text-sm text-gray-400">{count} voto{count !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${isWinner ? 'bg-primary-500' : 'bg-gray-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Responded */}
        {poll.respondedUsers?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">
              Responderam ({poll.respondedUsers.length})
            </h3>
            <div className="space-y-2">
              {poll.respondedUsers.map((u) => {
                const vote = Object.entries(poll.voteCounts).find(
                  () => poll.respondedUsers.some((r) => r.id === u.id)
                );
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="avatar" style={{ backgroundColor: getColor(u.name) }}>
                      {u.avatar || u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{u.name}</span>
                    <span className="ml-auto text-green-500 text-sm">✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending */}
        {poll.pendingUsers?.length > 0 && !poll.closed && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">
              Faltam responder ({poll.pendingUsers.length})
            </h3>
            <div className="space-y-2">
              {poll.pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="avatar opacity-40" style={{ backgroundColor: getColor(u.name) }}>
                    {u.avatar || u.name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-400">{u.name}</span>
                  <span className="ml-auto text-gray-300 text-sm">...</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

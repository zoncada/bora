import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AVATAR_COLORS = ['#4F7CFF', '#FF6B6B', '#FFB347', '#47D1A8', '#A855F7', '#EC4899'];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PollCard({ poll }) {
  const navigate = useNavigate();

  const topOption = poll.totalVotes > 0
    ? Object.entries(poll.voteCounts).sort((a, b) => b[1] - a[1])[0]
    : null;

  const deadline = poll.deadline
    ? formatDistanceToNow(parseISO(poll.deadline), { addSuffix: true, locale: ptBR })
    : null;

  const pending = poll.pendingUsers?.length || 0;
  const responded = poll.respondedUsers?.length || 0;
  const total = poll.memberCount || 1;
  const progress = Math.round((responded / total) * 100);

  return (
    <button
      onClick={() => navigate(`/poll/${poll.id}`)}
      className="card w-full text-left active:scale-[0.98] transition-transform duration-150 mb-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
            {poll.question}
          </p>
          {topOption && poll.totalVotes > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {poll.closed ? '✅' : '📊'} <span className="font-medium text-gray-700">{topOption[0]}</span>
              {' '}· {topOption[1]} voto{topOption[1] !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {poll.closed ? (
            <span className="badge bg-gray-100 text-gray-500">Encerrada</span>
          ) : (
            <span className="badge bg-primary-50 text-primary-500">Aberta</span>
          )}
          {poll.userVote && (
            <span className="text-xs text-green-500 font-medium">✓ Votei</span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex -space-x-1.5">
            {(poll.respondedUsers || []).slice(0, 5).map((u) => (
              <div key={u.id} className="avatar w-6 h-6 text-xs border-2 border-white"
                   style={{ backgroundColor: getColor(u.name) }}>
                {u.avatar || u.name.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {responded}/{total} responderam
            {pending > 0 && !poll.closed && ` · faltam ${pending}`}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {deadline && !poll.closed && (
        <p className="text-xs text-gray-400 mt-2">⏰ Encerra {deadline}</p>
      )}
    </button>
  );
}

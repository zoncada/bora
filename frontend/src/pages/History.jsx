import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BottomNav from '../components/BottomNav';
import api from '../utils/api';

export default function History() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/polls?status=closed')
      .then(({ data }) => setPolls(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen pb-20">
      <div className="bg-white px-5 pt-14 pb-4 border-b border-gray-50 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
        <p className="text-gray-400 text-sm">Decisões encerradas</p>
      </div>

      <div className="px-5 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full" />)}
          </div>
        ) : polls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">📋</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhuma decisão ainda</h3>
            <p className="text-gray-400 text-sm">As votações encerradas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll) => (
              <button
                key={poll.id}
                onClick={() => navigate(`/poll/${poll.id}`)}
                className="card w-full text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">{poll.question}</p>
                    {poll.winner && (
                      <p className="text-primary-500 text-sm font-semibold mt-1">
                        🏆 {poll.winner}
                      </p>
                    )}
                  </div>
                  <span className="badge bg-gray-100 text-gray-500 shrink-0">Encerrada</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{poll.totalVotes} votos</span>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(parseISO(poll.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { usePush } from '../hooks/usePush';
import PollCard from '../components/PollCard';
import BottomNav from '../components/BottomNav';
import api from '../utils/api';

const AVATAR_COLORS = ['#4F7CFF', '#FF6B6B', '#FFB347', '#47D1A8', '#A855F7', '#EC4899'];
function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  usePush(user);

  const loadData = useCallback(async () => {
    try {
      const [pollsRes, groupsRes] = await Promise.all([
        api.get('/api/polls?status=open'),
        api.get('/api/groups'),
      ]);
      setPolls(pollsRes.data);
      setGroups(groupsRes.data);
      if (groupsRes.data.length === 0) navigate('/group-setup');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleWsMessage = useCallback(({ event, data }) => {
    if (event === 'poll:new') {
      setPolls((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
    } else if (event === 'poll:updated') {
      setPolls((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    }
  }, []);

  useWebSocket(handleWsMessage);

  const filteredPolls = selectedGroup
    ? polls.filter((p) => p.groupId === selectedGroup)
    : polls;

  const pendingCount = polls.filter((p) => !p.userVote && !p.closed).length;

  return (
    <div className="screen pb-20">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 sticky top-0 z-10 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Olá, {user?.name?.split(' ')[0]} 👋</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {pendingCount > 0 ? `${pendingCount} aguardando você` : 'Tudo em dia ✅'}
            </h1>
          </div>
          <div className="avatar w-10 h-10 text-base" style={{ backgroundColor: getColor(user?.name || 'U') }}>
            {user?.avatar || user?.name?.charAt(0)}
          </div>
        </div>

        {/* Group filter */}
        {groups.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                !selectedGroup ? 'bg-primary-500 text-white' : 'bg-surface text-gray-500'
              }`}
            >
              Todos
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id === selectedGroup ? null : g.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedGroup === g.id ? 'bg-primary-500 text-white' : 'bg-surface text-gray-500'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full" />)}
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🎉</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nada pendente!</h3>
            <p className="text-gray-400 text-sm mb-6">Crie uma votação para o grupo decidir.</p>
            <button className="btn-primary max-w-xs" onClick={() => navigate('/create')}>
              Criar votação
            </button>
          </div>
        ) : (
          <div>
            {filteredPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate('/create')}>
        +
      </button>

      <BottomNav />
    </div>
  );
}

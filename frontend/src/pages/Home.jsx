import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import AppHeader from '../components/AppHeader';
import PollCard from '../components/PollCard';
import BottomNav from '../components/BottomNav';
import api from '../utils/api';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPushBanner, setShowPushBanner] = useState(false);

  // Verificar se deve mostrar banner de notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPushBanner(true);
    }
  }, []);

  const requestPushPermission = async () => {
    setShowPushBanner(false);
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const { data } = await api.get('/api/push/vapid-key');
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
        await api.post('/api/push/subscribe', { subscription: sub });
      } catch (e) {
        console.log('Push subscription failed:', e);
      }
    }
  };

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

  // Recarrega quando o usuário volta para a tela (ex: após criar votação)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadData]);

  const handleWsMessage = useCallback(({ event, data }) => {
    if (event === 'poll:new') {
      // Adiciona no topo, evitando duplicatas
      setPolls((prev) => {
        const exists = prev.some((p) => p.id === data.id);
        if (exists) return prev.map((p) => p.id === data.id ? data : p);
        return [data, ...prev];
      });
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
      {/* Header global com logo e foto */}
      <AppHeader />

      {/* Banner de notificações push */}
      {showPushBanner && (
        <div className="mx-4 mt-3 bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-teal-800">Ativar notificações</p>
            <p className="text-xs text-teal-600">Seja avisado quando houver novas votações</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPushBanner(false)}
              className="text-xs text-gray-400 px-2 py-1"
            >
              Agora não
            </button>
            <button
              onClick={requestPushPermission}
              className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-xl font-semibold"
            >
              Ativar
            </button>
          </div>
        </div>
      )}

      {/* Saudação */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-gray-400 text-sm">Olá, {user?.name?.split(' ')[0]} 👋</p>
        <h2 className="text-xl font-bold text-gray-900">
          {pendingCount > 0 ? `${pendingCount} aguardando você` : 'Tudo em dia ✅'}
        </h2>
      </div>

      {/* Filtro de grupos */}
      {groups.length > 1 && (
        <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !selectedGroup ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Todos
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id === selectedGroup ? null : g.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedGroup === g.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <div className="px-5 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full" />)}
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

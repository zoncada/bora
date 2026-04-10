import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import api from '../utils/api';

const AVATAR_COLORS = ['#4F7CFF', '#FF6B6B', '#FFB347', '#47D1A8', '#A855F7', '#EC4899'];
function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.get('/api/groups').then(({ data }) => setGroups(data));
  }, []);

  const copyInvite = (code) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="screen pb-20">
      <div className="bg-white px-5 pt-14 pb-4 border-b border-gray-50 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* User card */}
        <div className="card flex items-center gap-4">
          <div className="avatar w-16 h-16 text-xl" style={{ backgroundColor: getColor(user?.name || 'U') }}>
            {user?.avatar || user?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Meus grupos</h3>
            <button
              onClick={() => navigate('/group-setup')}
              className="text-primary-500 text-sm font-medium"
            >
              + Novo
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-gray-400 text-sm">Nenhum grupo ainda.</p>
              <button className="btn-primary mt-3 max-w-xs mx-auto" onClick={() => navigate('/group-setup')}>
                Criar família
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">{g.memberCount} membros · Código: {g.inviteCode}</p>
                    </div>
                    <button
                      onClick={() => copyInvite(g.inviteCode)}
                      className={`text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${
                        copied === g.inviteCode
                          ? 'bg-green-100 text-green-600'
                          : 'bg-primary-50 text-primary-500'
                      }`}
                    >
                      {copied === g.inviteCode ? '✓ Copiado!' : 'Convidar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* App info */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-900">Sobre o app</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Versão</span>
            <span className="text-gray-700 font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Bora!</span>
            <span className="text-gray-700 font-medium">Decisões rápidas em família ⚡</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 px-6 bg-red-50 text-red-500 text-base font-semibold rounded-2xl active:scale-95 transition-all"
        >
          Sair da conta
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

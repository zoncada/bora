import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import api from '../utils/api';

const AVATAR_COLORS = ['#0D9488', '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];
function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [shareGroup, setShareGroup] = useState(null);
  const [copied, setCopied] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    api.get('/api/groups').then(({ data }) => setGroups(data));

    // PWA install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const copyLink = (group) => {
    const link = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(group.inviteCode);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const shareWhatsApp = (group) => {
    const link = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;
    const msg = encodeURIComponent(
      `Oi! Entrei no grupo *${group.name}* no app Bora? 🎉\nClica aqui para entrar: ${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    setShareGroup(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="screen pb-24">
      <div className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* User card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: getColor(user?.name || 'U') }}
          >
            {user?.avatar || user?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Instalar app */}
        {!isInstalled && (
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-5 text-white">
            <div className="flex items-start gap-4">
              <img src="/icon-192.png" alt="Bora?" className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-base">Instalar o Bora?</p>
                <p className="text-teal-100 text-sm mt-0.5">Adicione à tela inicial e use como app</p>
              </div>
            </div>
            {installPrompt ? (
              <button
                onClick={handleInstall}
                className="mt-4 w-full bg-white text-teal-600 font-bold py-3 rounded-2xl text-sm active:scale-95 transition-transform"
              >
                Instalar agora
              </button>
            ) : (
              <div className="mt-4 bg-teal-400/30 rounded-2xl p-3 text-sm text-teal-100">
                <p className="font-medium mb-1">Como instalar no iPhone:</p>
                <p>Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong></p>
              </div>
            )}
          </div>
        )}

        {isInstalled && (
          <div className="bg-teal-50 rounded-3xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-teal-700 text-sm font-medium">App instalado na tela inicial ✓</p>
          </div>
        )}

        {/* Grupos */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-gray-900">Meus grupos</h3>
            <button
              onClick={() => navigate('/group-setup')}
              className="text-teal-600 text-sm font-semibold"
            >
              + Novo grupo
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <p className="text-gray-400 text-sm mb-3">Nenhum grupo ainda.</p>
              <button
                className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-2xl text-sm"
                onClick={() => navigate('/group-setup')}
              >
                Criar grupo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                        {g.isAdmin && (
                          <span className="bg-teal-50 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{g.memberCount} {g.memberCount === 1 ? 'membro' : 'membros'}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/group/${g.id}`)}
                      className="p-2 text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Ações de convite */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => shareWhatsApp(g)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 font-semibold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </button>

                    <button
                      onClick={() => copyLink(g)}
                      className="flex-1 flex items-center justify-center gap-2 bg-teal-50 text-teal-600 font-semibold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
                    >
                      {copied === g.inviteCode ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copiado!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sobre o app */}
        <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo.png" alt="Bora?" className="h-8" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Versão</span>
            <span className="text-gray-700 font-medium">1.1.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Decisões rápidas em grupo</span>
            <span className="text-gray-700 font-medium">⚡</span>
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

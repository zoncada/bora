import { useState, useEffect, useRef } from 'react';
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
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [copied, setCopied] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null); // { id, name }
  const [editGroupName, setEditGroupName] = useState('');
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/api/groups').then(({ data }) => setGroups(data));

    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setIsInstalled(true); setInstallPrompt(null); }
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
    const msg = encodeURIComponent(`Oi! Entrei no grupo *${group.name}* no app Bora? 🎉\nClica aqui para entrar: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // Upload avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/api/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
    } catch (err) {
      alert('Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Edit name
  const handleEditName = async () => {
    if (!newName.trim()) return;
    try {
      const { data } = await api.put('/api/auth/profile', { name: newName.trim() });
      setUser(prev => ({ ...prev, name: data.name }));
      setEditingName(false);
    } catch (err) {
      alert('Erro ao atualizar nome');
    }
  };

  // Edit group name
  const handleEditGroup = async () => {
    if (!editGroupName.trim()) return;
    try {
      await api.put(`/api/groups/${editingGroup.id}`, { name: editGroupName.trim() });
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, name: editGroupName.trim() } : g));
      setEditingGroup(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao editar grupo');
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    try {
      await api.delete(`/api/groups/${groupId}`);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setDeletingGroup(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao deletar grupo');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const avatarUrl = user?.avatarUrl;

  return (
    <div className="screen pb-24">
      <div className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* User card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Avatar com upload */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white text-3xl font-bold relative group"
                style={{ backgroundColor: avatarUrl ? 'transparent' : getColor(user?.name || 'U') }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.avatar || user?.name?.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-active:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              {/* Camera badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-teal-300 rounded-xl px-3 py-1.5 text-base font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-200"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEditName()}
                    autoFocus
                  />
                  <button onClick={handleEditName} className="text-teal-600 font-bold text-sm px-2">OK</button>
                  <button onClick={() => setEditingName(false)} className="text-gray-400 text-sm px-1">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-gray-900 truncate">{user?.name}</p>
                  <button onClick={() => { setNewName(user?.name || ''); setEditingName(true); }} className="text-gray-300 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              <p className="text-xs text-teal-500 mt-1">Toque na foto para alterar</p>
            </div>
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
              <button onClick={handleInstall} className="mt-4 w-full bg-white text-teal-600 font-bold py-3 rounded-2xl text-sm active:scale-95 transition-transform">
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
            <button onClick={() => navigate('/group-setup')} className="text-teal-600 text-sm font-semibold">
              + Novo grupo
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <p className="text-gray-400 text-sm mb-3">Nenhum grupo ainda.</p>
              <button className="bg-teal-600 text-white font-semibold py-3 px-6 rounded-2xl text-sm" onClick={() => navigate('/group-setup')}>
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
                          <span className="bg-teal-50 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{g.memberCount} {g.memberCount === 1 ? 'membro' : 'membros'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Editar grupo (admin only) */}
                      {g.isAdmin && (
                        <button
                          onClick={() => { setEditingGroup(g); setEditGroupName(g.name); }}
                          className="p-2 text-gray-300 active:text-teal-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                      {/* Deletar grupo (admin only) */}
                      {g.isAdmin && (
                        <button
                          onClick={() => setDeletingGroup(g)}
                          className="p-2 text-gray-300 active:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => navigate(`/group/${g.id}`)} className="p-2 text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
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
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copiado!</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar link</>
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
            <img src="/logo.png" alt="Bora?" className="h-8" onError={e => { e.target.style.display='none'; }} />
            <span className="font-bold text-gray-700">Bora?</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Versão</span>
            <span className="text-gray-700 font-medium">1.2.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Decisões rápidas em grupo</span>
            <span className="text-gray-700 font-medium">⚡</span>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full py-4 px-6 bg-red-50 text-red-500 text-base font-semibold rounded-2xl active:scale-95 transition-all">
          Sair da conta
        </button>

      </div>

      {/* Modal editar grupo */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Editar grupo</h3>
            <input
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              value={editGroupName}
              onChange={e => setEditGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEditGroup()}
              autoFocus
              maxLength={40}
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingGroup(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-2xl">Cancelar</button>
              <button onClick={handleEditGroup} className="flex-1 py-3 bg-teal-600 text-white font-semibold rounded-2xl">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {deletingGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Deletar grupo</h3>
            <p className="text-gray-500 text-sm">Tem certeza que quer deletar <strong>{deletingGroup.name}</strong>? Todas as votações serão perdidas. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingGroup(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-2xl">Cancelar</button>
              <button onClick={() => handleDeleteGroup(deletingGroup.id)} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-2xl">Deletar</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

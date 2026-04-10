import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import api from '../utils/api';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');

  useEffect(() => {
    loadGroup();
  }, [id]);

  const loadGroup = async () => {
    try {
      const { data } = await api.get(`/api/groups/${id}`);
      setGroup(data);
    } catch {
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const link = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;
    const msg = encodeURIComponent(
      `Oi! Entrei no grupo *${group.name}* no app Bora? 🎉\nClica aqui para entrar: ${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareNative = () => {
    const link = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;
    if (navigator.share) {
      navigator.share({
        title: `Entrar no grupo ${group.name}`,
        text: `Entrei no grupo "${group.name}" no Bora?. Clica para entrar:`,
        url: link,
      });
    } else {
      copyLink();
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remover este membro do grupo?')) return;
    setRemoving(memberId);
    try {
      await api.delete(`/api/groups/${id}/members/${memberId}`);
      setGroup(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId),
        memberCount: prev.memberCount - 1
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao remover membro');
    } finally {
      setRemoving(null);
    }
  };

  const transferAdmin = async () => {
    if (!transferTo) return;
    try {
      await api.post(`/api/groups/${id}/transfer-admin`, { newAdminId: transferTo });
      alert('Admin transferido com sucesso!');
      setShowTransfer(false);
      loadGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao transferir admin');
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm('Sair do grupo?')) return;
    try {
      await api.post(`/api/groups/${id}/leave`);
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao sair do grupo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  const inviteLink = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <AppHeader onBack={() => navigate(-1)} title={group.name} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Convite */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Convidar para o grupo</h2>

          <div className="bg-gray-50 rounded-2xl p-4 text-center mb-4">
            <p className="text-xs text-gray-400 mb-1">Código de convite</p>
            <p className="text-3xl font-bold tracking-widest text-teal-600">{group.inviteCode}</p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-3 bg-green-500 text-white font-semibold py-3.5 rounded-2xl text-sm active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartilhar no WhatsApp
            </button>

            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-50 text-teal-600 font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-transform"
              >
                {copied ? (
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

              {navigator.share && (
                <button
                  onClick={shareNative}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 font-semibold py-3 px-4 rounded-2xl text-sm active:scale-95 transition-transform"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Mais
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Membros */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Membros ({group.memberCount})
          </h2>
          <div className="space-y-3">
            {group.members?.map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                      {member.avatar || member.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {member.name}
                    {member.id === user?.id && <span className="text-gray-400 font-normal"> (você)</span>}
                  </p>
                  {member.isAdmin && (
                    <span className="text-xs text-teal-600 font-medium">Admin</span>
                  )}
                </div>
                {group.isAdmin && member.id !== user?.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    disabled={removing === member.id}
                    className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    {removing === member.id ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ações do Admin */}
        {group.isAdmin && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Administração</h2>

            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className="w-full flex items-center gap-3 py-3 text-left"
            >
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Transferir administração</span>
            </button>

            {showTransfer && (
              <div className="mt-2 p-4 bg-orange-50 rounded-2xl">
                <p className="text-xs text-orange-600 mb-3">Selecione o novo administrador:</p>
                <select
                  className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm mb-3 bg-white"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                >
                  <option value="">Escolha um membro...</option>
                  {group.members?.filter(m => m.id !== user?.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  onClick={transferAdmin}
                  disabled={!transferTo}
                  className="w-full bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  Confirmar transferência
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sair do grupo (apenas não-admin) */}
        {!group.isAdmin && (
          <button
            onClick={leaveGroup}
            className="w-full bg-white rounded-3xl p-4 shadow-sm text-red-500 font-medium text-sm text-center"
          >
            Sair do grupo
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

function ShareModal({ group, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = group.inviteLink || `${window.location.origin}/join/${group.inviteCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Oi! Entrei no grupo *${group.name}* no app Bora? 🎉\nClica aqui para entrar: ${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareNative = () => {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 px-4 pb-8">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Grupo criado!</h3>
          <p className="text-gray-500 text-sm mt-1">Convide as pessoas para o grupo <strong>{group.name}</strong></p>
        </div>

        {/* Código de convite */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Código de convite</p>
          <p className="text-3xl font-bold tracking-widest text-teal-600">{group.inviteCode}</p>
        </div>

        {/* Botões de compartilhamento */}
        <div className="flex flex-col gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-3 bg-green-500 text-white font-semibold py-4 rounded-2xl text-base active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar no WhatsApp
          </button>

          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-3 bg-teal-600 text-white font-semibold py-4 rounded-2xl text-base active:scale-95 transition-transform"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Link copiado!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar link de convite
              </>
            )}
          </button>

          {navigator.share && (
            <button
              onClick={shareNative}
              className="flex items-center justify-center gap-3 bg-gray-100 text-gray-700 font-semibold py-4 rounded-2xl text-base active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartilhar...
            </button>
          )}

          <button
            onClick={onClose}
            className="text-gray-400 text-sm py-2 font-medium"
          >
            Ir para o grupo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupSetup() {
  const [tab, setTab] = useState('create');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setTab('join');
      setInviteCode(code.toUpperCase());
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Digite o nome do grupo'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/groups', { name: groupName.trim() });
      setCreatedGroup(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) { setError('Digite o código de convite'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/groups/join', { inviteCode: inviteCode.trim() });
      navigate('/home');
    } catch (err) {
      const msg = err.response?.data?.error || '';
      // Se já é membro, redireciona para Home em vez de mostrar erro
      if (msg.includes('já está') || msg.includes('already')) {
        navigate('/home');
        return;
      }
      setError(msg || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  if (createdGroup) {
    return <ShareModal group={createdGroup} onClose={() => navigate('/home')} />;
  }

  return (
    <div className="flex flex-col h-full bg-white px-6">
      <div className="pt-16 pb-8 text-center">
        <img src="/logo.png" alt="Bora?" className="h-14 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Seu grupo</h2>
        <p className="text-gray-400 text-sm mt-1">Crie um grupo ou entre com convite</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {[{ id: 'create', label: 'Criar grupo' }, { id: 'join', label: 'Entrar com convite' }].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Nome do grupo</label>
            <input
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              type="text"
              placeholder="Ex: Família Silva, Amigos do Trabalho..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={40}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <p className="text-xs text-gray-400">
            Você será o administrador do grupo. Todos os membros podem criar votações.
          </p>
          {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}
          <button
            className="w-full bg-teal-600 text-white font-semibold py-4 rounded-2xl text-base active:scale-95 transition-transform disabled:opacity-50"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar grupo'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Código ou link de convite</label>
            <input
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-center text-2xl font-bold tracking-widest uppercase outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
              type="text"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>
          <p className="text-xs text-gray-400">
            Peça o código de 6 letras ou o link de convite para quem criou o grupo.
          </p>
          {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}
          <button
            className="w-full bg-teal-600 text-white font-semibold py-4 rounded-2xl text-base active:scale-95 transition-transform disabled:opacity-50"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar no grupo'}
          </button>
        </div>
      )}
    </div>
  );
}

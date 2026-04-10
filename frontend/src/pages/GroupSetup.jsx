import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function GroupSetup() {
  const [tab, setTab] = useState('create'); // create | join
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Digite o nome da família'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/groups', { name: groupName.trim() });
      navigate('/home');
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
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-6">
      <div className="pt-16 pb-8 text-center">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <h2 className="text-2xl font-bold text-gray-900">Sua família</h2>
        <p className="text-gray-400 text-sm mt-1">Crie um grupo ou entre com convite</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 mb-6">
        {[{ id: 'create', label: 'Criar família' }, { id: 'join', label: 'Entrar com convite' }].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t.id ? 'bg-white text-gray-900 shadow-card' : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Nome da família</label>
            <input
              className="input-field"
              type="text"
              placeholder="Ex: Família Silva, Nossa Turma..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={40}
            />
          </div>
          <p className="text-xs text-gray-400">
            Você receberá um código para convidar os membros.
          </p>
          {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando...' : 'Criar família'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Código de convite</label>
            <input
              className="input-field text-center text-2xl font-bold tracking-widest uppercase"
              type="text"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          </div>
          <p className="text-xs text-gray-400">
            Peça o código de 6 letras para quem criou o grupo.
          </p>
          {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}
          <button className="btn-primary" onClick={handleJoin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no grupo'}
          </button>
        </div>
      )}
    </div>
  );
}

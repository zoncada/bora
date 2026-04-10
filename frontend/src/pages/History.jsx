import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editPoll, setEditPoll] = useState(null);
  const [editData, setEditData] = useState({ question: '', options: [], deadline: '', mode: 'majority' });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPolls = useCallback(async () => {
    try {
      const { data } = await api.get('/api/polls');
      setPolls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPolls(); }, [loadPolls]);

  const filteredPolls = polls.filter((p) => {
    if (filter === 'open') return !p.closed;
    if (filter === 'closed') return p.closed;
    return true;
  });

  const canEdit = (poll) => !poll.closed && poll.totalVotes === 0 && poll.creatorId === user?.id;
  const canDelete = (poll) => poll.totalVotes === 0 && poll.creatorId === user?.id;

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/polls/${deleteConfirm.id}`);
      setPolls((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao deletar');
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (poll) => {
    setEditPoll(poll);
    setEditData({
      question: poll.question,
      options: [...poll.options],
      deadline: poll.deadline ? poll.deadline.slice(0, 16) : '',
      mode: poll.mode || 'majority',
    });
    setError('');
  };

  const handleEdit = async () => {
    if (!editPoll) return;
    const validOptions = editData.options.filter((o) => o.trim());
    if (!editData.question.trim()) { setError('Digite a pergunta'); return; }
    if (validOptions.length < 2) { setError('Mínimo 2 opções'); return; }
    setActionLoading(true);
    setError('');
    try {
      const { data } = await api.put(`/api/polls/${editPoll.id}`, {
        question: editData.question.trim(),
        options: validOptions,
        deadline: editData.deadline || null,
        mode: editData.mode,
      });
      setPolls((prev) => prev.map((p) => p.id === data.id ? data : p));
      setEditPoll(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao editar');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="screen pb-20">
      <AppHeader title="Minhas Votações" />

      {/* Filtros */}
      <div className="flex gap-2 px-5 pt-3 pb-1">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'open', label: 'Abertas' },
          { id: 'closed', label: 'Encerradas' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full" />)}
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">📋</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhuma votação</h3>
            <p className="text-gray-400 text-sm">
              {filter === 'all' ? 'Crie uma votação para começar.' :
               filter === 'open' ? 'Nenhuma votação aberta.' : 'Nenhuma votação encerrada.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPolls.map((poll) => (
              <div key={poll.id} className="card">
                <button
                  className="w-full text-left active:opacity-70 transition-opacity"
                  onClick={() => navigate(`/poll/${poll.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{poll.question}</p>
                      {poll.winner && poll.closed && (
                        <p className="text-teal-600 text-sm font-semibold mt-1">🏆 {poll.winner}</p>
                      )}
                    </div>
                    <span className={`badge shrink-0 ${
                      poll.closed ? 'bg-gray-100 text-gray-500' : 'bg-teal-50 text-teal-600'
                    }`}>
                      {poll.closed ? 'Encerrada' : 'Aberta'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>{poll.totalVotes} voto{poll.totalVotes !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(parseISO(poll.createdAt), { addSuffix: true, locale: ptBR })}</span>
                    {poll.groupName && <><span>·</span><span>👥 {poll.groupName}</span></>}
                  </div>
                </button>

                {(canEdit(poll) || canDelete(poll)) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {canEdit(poll) && (
                      <button
                        onClick={() => openEdit(poll)}
                        className="flex-1 py-2 rounded-xl bg-teal-50 text-teal-600 text-sm font-semibold active:bg-teal-100"
                      >
                        ✏️ Editar
                      </button>
                    )}
                    {canDelete(poll) && (
                      <button
                        onClick={() => setDeleteConfirm(poll)}
                        className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-semibold active:bg-red-100"
                      >
                        🗑️ Deletar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmação delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <span className="text-5xl">🗑️</span>
              <h3 className="text-lg font-bold text-gray-900 mt-3">Deletar votação?</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">"{deleteConfirm.question}"</p>
              <p className="text-red-400 text-xs mt-2">Esta ação não pode ser desfeita.</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold"
                onClick={() => { setDeleteConfirm(null); setError(''); }}
                disabled={actionLoading}
              >Cancelar</button>
              <button
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold active:bg-red-600"
                onClick={handleDelete}
                disabled={actionLoading}
              >{actionLoading ? 'Deletando...' : 'Deletar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edição */}
      {editPoll && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between sticky top-0 bg-white border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Editar votação</h3>
              <button onClick={() => setEditPoll(null)} className="text-gray-400 text-2xl w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">✕</button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Pergunta</label>
                <textarea
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none text-base"
                  rows={3}
                  value={editData.question}
                  onChange={(e) => setEditData((d) => ({ ...d, question: e.target.value }))}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Opções</label>
                <div className="space-y-2">
                  {editData.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...editData.options];
                          opts[idx] = e.target.value;
                          setEditData((d) => ({ ...d, options: opts }));
                        }}
                        maxLength={30}
                      />
                      {editData.options.length > 2 && (
                        <button
                          onClick={() => setEditData((d) => ({ ...d, options: d.options.filter((_, i) => i !== idx) }))}
                          className="text-gray-300 text-xl w-8 h-8 flex items-center justify-center"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {editData.options.length < 5 && (
                  <button
                    onClick={() => setEditData((d) => ({ ...d, options: [...d.options, ''] }))}
                    className="text-teal-500 text-sm font-medium mt-2"
                  >+ Adicionar opção</button>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Prazo (opcional)</label>
                <input
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  type="datetime-local"
                  value={editData.deadline}
                  onChange={(e) => setEditData((d) => ({ ...d, deadline: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Modo de decisão</label>
                <div className="flex gap-2">
                  {[
                    { id: 'majority', label: '🏆 Maioria' },
                    { id: 'all', label: '✅ Todos' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setEditData((d) => ({ ...d, mode: m.id }))}
                      className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                        editData.mode === m.id
                          ? 'border-teal-400 bg-teal-50 text-teal-700'
                          : 'border-transparent bg-gray-100 text-gray-500'
                      }`}
                    >{m.label}</button>
                  ))}
                </div>
              </div>
              {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}
              <button
                className="w-full bg-teal-500 text-white font-bold py-4 rounded-2xl text-base active:bg-teal-600 disabled:opacity-50"
                onClick={handleEdit}
                disabled={actionLoading}
              >
                {actionLoading ? 'Salvando...' : '💾 Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

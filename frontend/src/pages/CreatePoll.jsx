import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import api from '../utils/api';

const TEMPLATES = [
  { icon: '🍽️', name: 'Almoço',    question: 'Quem vai no almoço?',          options: ['Vou', 'Não vou', 'Talvez'] },
  { icon: '🍕', name: 'Jantar',    question: 'Quem vai no jantar?',           options: ['Vou', 'Não vou', 'Talvez'] },
  { icon: '✈️', name: 'Viagem',    question: 'Quem topa a viagem?',           options: ['Topo', 'Não posso', 'Talvez'] },
  { icon: '🚴', name: 'Pedal',     question: 'Quem vai no pedal?',            options: ['Vou', 'Não vou', 'Talvez'] },
  { icon: '🚗', name: 'Carona',    question: 'Quem pode dar carona?',         options: ['Posso', 'Não posso', 'Talvez'] },
  { icon: '🎁', name: 'Presente',  question: 'Quem entra no presente?',       options: ['Entro', 'Não entro', 'Talvez'] },
  { icon: '📅', name: 'Reunião',   question: 'Quem pode na reunião?',         options: ['Posso', 'Não posso', 'Talvez'] },
  { icon: '🎉', name: 'Evento',    question: 'Quem vai ao evento?',           options: ['Vou', 'Não vou', 'Talvez'] },
  { icon: '🥩', name: 'Churrasco', question: 'Quem vai no churrasco?',        options: ['Vou', 'Não vou', 'Talvez'] },
  { icon: '⚽', name: 'Futebol',   question: 'Quem joga no futebol?',         options: ['Jogo', 'Não jogo', 'Talvez'] },
];

const STEPS = ['Grupo', 'Template', 'Pergunta', 'Detalhes'];

export default function CreatePoll() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Vou', 'Não vou', 'Talvez']);
  const [deadline, setDeadline] = useState('');
  const [groupId, setGroupId] = useState('');
  const [mode, setMode] = useState('majority');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/groups').then(({ data }) => {
      setGroups(data);
      // Pré-seleciona o primeiro grupo mas SEMPRE mostra o step 1
      if (data.length === 1) setGroupId(data[0].id);
    }).catch(() => {}).finally(() => setLoadingGroups(false));
  }, []);

  const applyTemplate = (t) => {
    setQuestion(t.question);
    setOptions([...t.options]);
    setStep(3);
  };

  const updateOption = (idx, val) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const removeOption = (idx) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!groupId) { setError('Selecione o grupo'); return; }
    if (!question.trim()) { setError('Digite a pergunta'); return; }
    if (validOptions.length < 2) { setError('Adicione pelo menos 2 opções'); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/polls', {
        question: question.trim(),
        options: validOptions,
        deadline: deadline || null,
        groupId,
        mode,
      });
      navigate(`/poll/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar votação');
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) navigate(-1);
    else setStep(step - 1);
  };

  const selectedGroup = groups.find(g => g.id === groupId);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AppHeader onBack={goBack} title="Nova votação" />

      {/* Progress steps */}
      <div className="px-5 pt-3 pb-1">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? 'bg-teal-500' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Passo {step} de {STEPS.length} — {STEPS[step - 1]}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10">

        {/* ── Step 1: Selecionar grupo ── */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Para qual grupo?</h3>
            <p className="text-gray-400 text-sm mb-5">Escolha o grupo desta votação</p>

            {loadingGroups ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-5xl mb-4 block">👥</span>
                <p className="text-gray-500 mb-4">Você não está em nenhum grupo ainda.</p>
                <button className="btn-primary" onClick={() => navigate('/group-setup')}>
                  Criar ou entrar em um grupo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setGroupId(g.id); setStep(2); }}
                    className={`w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all border-2 ${
                      groupId === g.id
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-transparent bg-gray-50 active:bg-teal-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      👥
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">{g.memberCount} {g.memberCount === 1 ? 'membro' : 'membros'}</p>
                    </div>
                    {groupId === g.id ? (
                      <span className="text-teal-500 text-lg">✓</span>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Template ── */}
        {step === 2 && (
          <div>
            {/* Grupo selecionado */}
            {selectedGroup && (
              <div className="bg-teal-50 rounded-2xl p-3 flex items-center gap-2 mb-4">
                <span className="text-lg">👥</span>
                <div className="flex-1">
                  <p className="text-xs text-teal-600 font-medium">Grupo selecionado</p>
                  <p className="font-bold text-teal-800 text-sm">{selectedGroup.name}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-teal-500 font-semibold px-2 py-1 rounded-lg bg-teal-100">
                  Trocar
                </button>
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 mb-1">Usar um template?</h3>
            <p className="text-gray-400 text-sm mb-4">Toque para usar ou crie do zero</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t)}
                  className="bg-gray-50 rounded-2xl p-4 text-left active:scale-95 transition-transform border-2 border-transparent active:border-teal-200"
                >
                  <span className="text-3xl block mb-2">{t.icon}</span>
                  <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.question}</p>
                </button>
              ))}
            </div>

            <button
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-medium text-sm active:bg-gray-50 transition-colors"
              onClick={() => { setQuestion(''); setOptions(['Sim', 'Não']); setStep(3); }}
            >
              ✏️ Criar do zero
            </button>
          </div>
        )}

        {/* ── Step 3: Pergunta + Opções ── */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Grupo selecionado */}
            {selectedGroup && (
              <div className="bg-teal-50 rounded-2xl p-3 flex items-center gap-2">
                <span className="text-lg">👥</span>
                <div className="flex-1">
                  <p className="text-xs text-teal-600 font-medium">Grupo</p>
                  <p className="font-bold text-teal-800 text-sm">{selectedGroup.name}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-teal-500 font-semibold px-2 py-1 rounded-lg bg-teal-100">
                  Trocar
                </button>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Pergunta</label>
              <textarea
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none text-base"
                rows={3}
                placeholder="Ex: Quem vai no almoço de domingo?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={120}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{question.length}/120</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Opções de resposta</label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                      type="text"
                      placeholder={`Opção ${idx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      maxLength={30}
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(idx)} className="text-gray-300 text-xl px-1 w-8 h-8 flex items-center justify-center">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 5 && (
                <button onClick={addOption} className="text-teal-500 text-sm font-medium mt-3">
                  + Adicionar opção
                </button>
              )}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              className="w-full bg-teal-500 text-white font-bold py-4 rounded-2xl text-base active:bg-teal-600 transition-colors"
              onClick={() => {
                if (!question.trim()) { setError('Digite a pergunta'); return; }
                if (options.filter(o => o.trim()).length < 2) { setError('Adicione pelo menos 2 opções'); return; }
                setError('');
                setStep(4);
              }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── Step 4: Detalhes finais ── */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Resumo */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">👥</span>
                <div>
                  <p className="text-xs text-gray-400">Grupo</p>
                  <p className="font-bold text-gray-800">{selectedGroup?.name}</p>
                </div>
                <button onClick={() => setStep(1)} className="ml-auto text-xs text-teal-500 font-semibold">Trocar</button>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">❓</span>
                <div>
                  <p className="text-xs text-gray-400">Pergunta</p>
                  <p className="font-semibold text-gray-800 text-sm">{question}</p>
                </div>
                <button onClick={() => setStep(3)} className="ml-auto text-xs text-teal-500 font-semibold flex-shrink-0">Editar</button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Prazo (opcional)</label>
              <input
                className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400 text-base"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Modo de decisão</label>
              <div className="space-y-2">
                {[
                  { id: 'majority', label: 'Maioria decide', desc: 'A opção mais votada vence', icon: '🏆' },
                  { id: 'all', label: 'Todos precisam responder', desc: 'Encerra quando todos votarem', icon: '✅' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-all border-2 ${
                      mode === m.id ? 'border-teal-400 bg-teal-50' : 'border-transparent bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                    {mode === m.id && <span className="text-teal-500 font-bold text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}

            <button
              className="w-full bg-teal-500 text-white font-bold py-4 rounded-2xl text-base active:bg-teal-600 transition-colors disabled:opacity-50"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Criando...' : '⚡ Criar votação'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

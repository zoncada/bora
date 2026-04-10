import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function CreatePoll() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=template, 2=question, 3=options, 4=details
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['Vou', 'Não vou', 'Talvez']);
  const [deadline, setDeadline] = useState('');
  const [groupId, setGroupId] = useState('');
  const [mode, setMode] = useState('majority');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/groups').then(({ data }) => {
      setGroups(data);
      if (data.length === 1) setGroupId(data[0].id);
    });
  }, []);

  const applyTemplate = (t) => {
    setQuestion(t.question);
    setOptions([...t.options]);
    setStep(2);
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
    if (!question.trim()) { setError('Digite a pergunta'); return; }
    if (validOptions.length < 2) { setError('Adicione pelo menos 2 opções'); return; }
    if (!groupId) { setError('Selecione o grupo'); return; }

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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-gray-50">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="btn-ghost px-0">
          ← Voltar
        </button>
        <div className="flex-1 text-center">
          <h2 className="font-bold text-gray-900">Nova votação</h2>
          <p className="text-xs text-gray-400">Passo {step} de 3</p>
        </div>
        <div className="w-16" />
      </div>

      {/* Progress */}
      <div className="px-5 pt-3">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">

        {/* Step 1: Template */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Começar com template</h3>
            <p className="text-gray-400 text-sm mb-5">Ou crie do zero abaixo</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t)}
                  className="card text-left active:scale-95 transition-transform"
                >
                  <span className="text-3xl block mb-2">{t.icon}</span>
                  <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.question}</p>
                </button>
              ))}
            </div>

            <button
              className="btn-secondary"
              onClick={() => { setQuestion(''); setOptions(['Sim', 'Não']); setStep(2); }}
            >
              Criar do zero
            </button>
          </div>
        )}

        {/* Step 2: Question + Options */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Pergunta</label>
              <textarea
                className="input-field resize-none"
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
                      className="input-field flex-1"
                      type="text"
                      placeholder={`Opção ${idx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      maxLength={30}
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(idx)} className="text-gray-300 text-xl px-1">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 5 && (
                <button onClick={addOption} className="text-primary-500 text-sm font-medium mt-2">
                  + Adicionar opção
                </button>
              )}
            </div>

            <button className="btn-primary" onClick={() => setStep(3)}>
              Continuar
            </button>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-5">
            {groups.length > 1 && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Grupo</label>
                <div className="space-y-2">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGroupId(g.id)}
                      className={`w-full card text-left flex items-center gap-3 py-3 transition-all ${
                        groupId === g.id ? 'ring-2 ring-primary-500' : ''
                      }`}
                    >
                      <span className="text-2xl">👨‍👩‍👧</span>
                      <div>
                        <p className="font-semibold text-gray-800">{g.name}</p>
                        <p className="text-xs text-gray-400">{g.memberCount} membros</p>
                      </div>
                      {groupId === g.id && <span className="ml-auto text-primary-500">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Prazo (opcional)</label>
              <input
                className="input-field"
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
                  { id: 'majority', label: 'Maioria decide', desc: 'A opção mais votada vence' },
                  { id: 'all', label: 'Todos precisam responder', desc: 'Encerra quando todos votarem' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`w-full card text-left flex items-center gap-3 py-3 transition-all ${
                      mode === m.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                    {mode === m.id && <span className="text-primary-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">{error}</div>}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Criando...' : '⚡ Criar votação'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-12">
        {/* Logo oficial */}
        <img
          src="/logo.png"
          alt="Bora?"
          className="w-56 mb-8 drop-shadow-sm"
        />

        <p className="text-xl text-gray-500 text-center leading-relaxed mb-2">
          Decisões rápidas em grupo.
        </p>
        <p className="text-base text-gray-400 text-center leading-relaxed">
          Sem enrolação. Sem chat. Só resposta.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-8">
          {['⚡ Velocidade', '👥 Grupos', '✅ Clareza', '🔔 Lembretes'].map((f) => (
            <span key={f} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Examples */}
      <div className="px-6 pb-6">
        <div className="space-y-2 mb-6">
          {[
            { q: 'Quem vai no almoço de domingo?', a: '5 de 6 responderam' },
            { q: 'Quem topa a viagem no feriado?', a: '3 de 5 responderam' },
          ].map((ex) => (
            <div key={ex.q} className="bg-gray-50 rounded-2xl flex items-center gap-3 py-3 px-4">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{ex.q}</p>
                <p className="text-xs text-gray-400">{ex.a}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl text-base active:scale-95 transition-transform"
          onClick={() => navigate('/auth')}
        >
          Começar agora
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Gratuito · Sem anúncios · Para grupos
        </p>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AVATAR_COLORS = ['#0D9488', '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];
function getColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * AppHeader — aparece em TODAS as telas autenticadas
 * Layout: [logo] [título centralizado] [foto de perfil]
 * Se onBack for passado, um botão voltar aparece à esquerda do logo
 */
export default function AppHeader({ title, onBack }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 pt-safe pb-3 bg-white sticky top-0 z-40 border-b border-gray-100"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
    >
      {/* ── Esquerda: back + logo ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors mr-1"
            aria-label="Voltar"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <img
          src="/logo.png"
          alt="Bora?"
          className="h-7 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
          }}
        />
        <span
          className="hidden items-center text-lg font-black text-teal-600 tracking-tight"
          style={{ display: 'none' }}
        >
          Bora?
        </span>
      </div>

      {/* ── Centro: título da tela ── */}
      {title ? (
        <h1 className="text-sm font-bold text-gray-800 absolute left-1/2 -translate-x-1/2 max-w-[40%] truncate text-center">
          {title}
        </h1>
      ) : null}

      {/* ── Direita: foto de perfil ── */}
      <button
        onClick={() => navigate('/profile')}
        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 active:opacity-70 transition-opacity ring-2 ring-gray-100"
        aria-label="Perfil"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: getColor(user?.name || '') }}
          >
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
        )}
      </button>
    </header>
  );
}

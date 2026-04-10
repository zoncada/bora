import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/home', icon: '⚡', label: 'Início' },
  { path: '/history', icon: '📋', label: 'Histórico' },
  { path: '/profile', icon: '👤', label: 'Perfil' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl border-t border-gray-100 z-20"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex items-center justify-around px-4 pt-2 pb-1">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`tab-item ${active ? 'text-primary-500' : 'text-gray-400'}`}
            >
              <span className="text-2xl leading-none">{tab.icon}</span>
              <span className={`text-xs font-medium ${active ? 'text-primary-500' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function JoinGroup() {
  const { code } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | joining | success | error

  useEffect(() => {
    // Aguarda o AuthContext terminar de carregar o usuário do localStorage
    if (loading) return;

    if (!user) {
      // Não logado → vai para login preservando o código
      navigate(`/auth?join=${code}`, { replace: true });
      return;
    }

    // Logado → tenta entrar no grupo automaticamente
    setStatus('joining');
    const codeClean = (code || '').trim().toUpperCase();
    console.log('[JoinGroup] Tentando entrar com código:', codeClean);
    api.post('/api/groups/join', { inviteCode: codeClean })
      .then((res) => {
        console.log('[JoinGroup] Sucesso:', res.data);
        setStatus('success');
        setTimeout(() => navigate('/home', { replace: true }), 1200);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || '';
        const status = err.response?.status;
        console.error('[JoinGroup] Erro:', status, msg, 'código:', codeClean);
        // Se já é membro → vai para Home silenciosamente
        if (msg.includes('já está') || msg.includes('already')) {
          navigate('/home', { replace: true });
          return;
        }
        setStatus('error');
        setTimeout(() => navigate('/home', { replace: true }), 3000);
      });
  }, [code, user, loading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-6">
      <img src="/logo.png" alt="Bora?" className="w-40 mb-8"
        onError={(e) => { e.target.style.display = 'none'; }} />

      {(status === 'loading' || status === 'joining') && (
        <>
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            {status === 'loading' ? 'Verificando...' : 'Entrando no grupo...'}
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <p className="text-gray-900 text-xl font-bold">Você entrou no grupo!</p>
          <p className="text-gray-400 text-sm mt-1">Redirecionando...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <p className="text-gray-900 text-xl font-bold">Link inválido</p>
          <p className="text-gray-400 text-sm mt-1">Este convite não existe ou expirou</p>
        </>
      )}
    </div>
  );
}

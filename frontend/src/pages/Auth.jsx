import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const joinCode = searchParams.get('join');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Digite seu nome'); setLoading(false); return; }
        await register(name.trim(), email, password);
      }
      // Se veio de link de convite, entra no grupo automaticamente
      if (joinCode) {
        try {
          await api.post('/api/groups/join', { inviteCode: joinCode.toUpperCase() });
        } catch (joinErr) {
          // Ignora se já é membro ou código inválido — vai para Home de qualquer forma
        }
      }
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white px-6">
      <div className="pt-12 pb-6 flex flex-col items-center">
        {/* Logo oficial */}
        <img src="/logo.png" alt="Bora?" className="w-44 mb-6" />

        {/* Banner de convite */}
        {joinCode && (
          <div className="w-full bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 mb-3 text-center">
            <p className="text-teal-700 text-sm font-semibold">🎉 Você foi convidado para um grupo!</p>
            <p className="text-teal-500 text-xs mt-0.5">
              {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'} para entrar automaticamente.
            </p>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          {mode === 'login' ? 'Entre na sua conta' : 'Comece a decidir em grupo'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        {mode === 'register' && (
          <input
            className="input-field"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <input
          className="input-field"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={6}
        />

        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading
            ? (joinCode ? 'Entrando no grupo...' : 'Aguarde...')
            : mode === 'login'
              ? (joinCode ? 'Entrar e aceitar convite →' : 'Entrar')
              : (joinCode ? 'Criar conta e aceitar convite →' : 'Criar conta')
          }
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-gray-400 text-sm">ou</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        >
          {mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 py-6">
        Ao continuar, você concorda com os termos de uso.
      </p>
    </div>
  );
}

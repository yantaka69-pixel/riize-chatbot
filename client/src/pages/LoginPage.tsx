import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(nickname.trim());
      navigate('/mood');
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-6">
      {/* Logo / Title */}
      <div className="text-center mb-8">
        <div className="text-2xl font-bold text-gray-900 mb-2">RIIZE Chat</div>
        <div className="text-sm text-gray-500">虚拟聊天模拟器</div>
        <div className="text-xs text-gray-400 mt-1">
          本程序为粉丝向虚拟体验，不代表 RIIZE 成员本人
        </div>
      </div>

      {/* Input area */}
      <div className="w-full max-w-xs">
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">输入你的昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="昵称（1-20字符）"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            autoFocus
          />
        </div>

        {error && (
          <div className="text-sm text-red-500 mb-3 text-center">{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading || !nickname.trim()}
          className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-medium
            hover:bg-blue-600 active:bg-blue-700 transition-colors
            disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isLoading ? '登录中...' : '开始聊天'}
        </button>

        <div className="mt-4 text-xs text-gray-400 text-center">
          无需密码 · 基于设备识别 · 同设备可恢复聊天记录
        </div>
      </div>
    </div>
  );
}

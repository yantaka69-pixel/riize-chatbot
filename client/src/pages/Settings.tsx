import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nickname, setNickname] = useState(localStorage.getItem('riize_nickname') || '');
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('riize_api_url') || '');
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);

  const ADMIN_PASSWORD = 'riize_admin_2024';

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('密码错误');
    }
  };

  const handleSaveNickname = () => {
    if (nickname.trim()) {
      localStorage.setItem('riize_nickname', nickname.trim());
      alert('昵称已保存');
    }
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem('riize_api_url', apiUrl);
    alert('API地址已保存');
  };

  const handleClearChatHistory = () => {
    localStorage.removeItem('riize_chat_history');
    setShowDangerConfirm(false);
    alert('聊天记录已清除');
  };

  const handleResetAll = () => {
    localStorage.clear();
    setShowDangerConfirm(false);
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">管理设置</h2>
          <p className="text-gray-500 text-sm mb-4 text-center">请输入管理密码</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            placeholder="管理密码"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none mb-4"
          />
          <button
            onClick={handlePasswordSubmit}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors"
          >
            验证
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-800">设置</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Nickname */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">昵称修改</h3>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="输入新昵称"
            maxLength={20}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none mb-3"
          />
          <button
            onClick={handleSaveNickname}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors"
          >
            保存昵称
          </button>
        </div>

        {/* API Config */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">API 配置</h3>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="输入API地址"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none mb-3"
          />
          <button
            onClick={handleSaveApiUrl}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            保存API地址
          </button>
        </div>

        {/* Member Management */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">成员管理</h3>
          <p className="text-gray-500 text-sm mb-3">成员信息由系统预设，暂不支持自定义</p>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">当前成员：6人</p>
            <p className="text-sm text-gray-600 mt-1">Sohee, Sungchan, Wonbin, Eunseok, Shotaro, Ann</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-red-200">
          <h3 className="font-semibold text-red-600 mb-4">危险操作</h3>
          
          {!showDangerConfirm ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowDangerConfirm(true)}
                className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-medium transition-colors"
              >
                清除聊天记录
              </button>
              <button
                onClick={() => setShowDangerConfirm(true)}
                className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-medium transition-colors"
              >
                重置所有数据
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-red-600 text-sm font-medium text-center">
                确定要执行此操作吗？此操作不可撤销！
              </p>
              <button
                onClick={handleClearChatHistory}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                确认清除聊天记录
              </button>
              <button
                onClick={handleResetAll}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                确认重置所有数据
              </button>
              <button
                onClick={() => setShowDangerConfirm(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

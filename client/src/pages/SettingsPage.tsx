import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi, chatApi } from '../utils/api';

// AI 供应商预设配置
const API_PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '推荐 · 注册送 $52 额度 · 中文质量最好',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    registerUrl: 'https://platform.deepseek.com',
    color: 'bg-blue-500',
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    description: '完全免费 · 不限额度 · 速率限制5RPM',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['Qwen/Qwen2.5-7B-Instruct', 'Qwen/Qwen2.5-72B-Instruct', 'Qwen/Qwen2-1.5B-Instruct', 'internlm/internlm2_5-7b-chat'],
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    registerUrl: 'https://cloud.siliconflow.cn',
    color: 'bg-emerald-500',
  },
  {
    id: 'zhipu',
    name: '智谱清言',
    description: 'GLM-4-Flash 免费 · 500万 tokens',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-flash', 'glm-4-air', 'glm-4-airx'],
    defaultModel: 'glm-4-flash',
    registerUrl: 'https://open.bigmodel.cn',
    color: 'bg-violet-500',
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateNickname, logout } = useAuth();

  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Settings state
  const [newNickname, setNewNickname] = useState(user?.nickname || '');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiConfigLoaded, setApiConfigLoaded] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Delete confirmations
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Message feedback
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // Unlock settings
  const handleUnlock = async () => {
    try {
      const response = await settingsApi.verifyPassword(passwordInput);
      if (response.verified) {
        setIsLocked(false);
        setPasswordError('');

        // Load API config
        const config = await settingsApi.getApiConfig();
        setBaseUrl(config.baseUrl);
        setModelName(config.modelName);
        setApiConfigLoaded(true);

        // Detect current provider
        const detected = API_PROVIDERS.find(p => p.baseUrl === config.baseUrl);
        setSelectedProvider(detected?.id || 'custom');
      } else {
        setPasswordError('密码错误');
      }
    } catch (error) {
      setPasswordError('验证失败');
    }
  };

  // Quick select provider
  const handleSelectProvider = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = API_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setBaseUrl(provider.baseUrl);
      setModelName(provider.defaultModel);
    }
  };

  // Save nickname
  const handleSaveNickname = async () => {
    if (!newNickname.trim()) return;
    try {
      await updateNickname(newNickname.trim());
      showMessage('昵称已更新');
    } catch (error) {
      showMessage('更新失败', 'error');
    }
  };

  // Save API config
  const handleSaveApiConfig = async () => {
    try {
      await settingsApi.updateApiConfig({
        apiKey,
        baseUrl,
        modelName,
        adminPassword: passwordInput,
      });
      showMessage('API 配置已更新');
    } catch (error) {
      showMessage('更新失败', 'error');
    }
  };

  // Delete operations
  const handleDeleteAllHistory = async () => {
    if (!user) return;
    try {
      await chatApi.deleteAllHistory(user.id);
      showMessage('全部聊天记录已删除');
      setShowDeleteAll(false);
    } catch (error) {
      showMessage('删除失败', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await settingsApi.deleteAccount(user.id, passwordInput);
      logout();
      navigate('/login');
    } catch (error) {
      showMessage('删除失败', 'error');
    }
  };

  // Disclaimer text
  const disclaimer = '本程序为粉丝向虚拟聊天模拟器，所有回复均由 AI 生成，不代表 RIIZE 成员本人，也不代表官方立场。本程序不提供真实艺人私人信息、联系方式或真实行程。';

  const currentProvider = API_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen flex flex-col bg-white px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-medium text-gray-900">设置</div>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600">
          ← 返回
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`mb-4 px-4 py-2 rounded-xl text-sm ${
          messageType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Lock screen */}
      {isLocked ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-sm text-gray-500 mb-4">请输入管理密码</div>
          <div className="w-full max-w-xs">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="管理密码（默认 admin123）"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3
                focus:outline-none focus:border-blue-400"
            />
            {passwordError && (
              <div className="text-sm text-red-500 mb-2 text-center">{passwordError}</div>
            )}
            <button
              onClick={handleUnlock}
              className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-medium
                hover:bg-blue-600 transition-colors"
            >
              解锁设置
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-6 max-w-md mx-auto w-full overflow-y-auto pb-8">

          {/* Nickname */}
          <section className="border-b border-gray-100 pb-4">
            <div className="text-sm font-medium text-gray-900 mb-3">修改昵称</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm
                  focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={handleSaveNickname}
                className="px-3 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </section>

          {/* Provider Quick Select */}
          {apiConfigLoaded && (
            <section className="border-b border-gray-100 pb-4">
              <div className="text-sm font-medium text-gray-900 mb-3">AI 供应商</div>
              <div className="text-xs text-gray-400 mb-3">点击可一键切换配置，然后填入你的 API Key</div>

              <div className="space-y-2">
                {API_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      selectedProvider === provider.id
                        ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${provider.color}`}></span>
                    <span className="font-medium text-gray-900">{provider.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{provider.description}</span>
                  </button>
                ))}
              </div>

              {/* Register link for selected provider */}
              {currentProvider && (
                <div className="mt-2 text-xs text-blue-500">
                  <a href={currentProvider.registerUrl} target="_blank" rel="noopener noreferrer"
                    className="underline hover:text-blue-600">
                    → 前往 {currentProvider.name} 注册获取 API Key
                  </a>
                </div>
              )}

              {/* API Key input */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-...（从注册平台获取）"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                      focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                      focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">模型名称</label>
                  {currentProvider ? (
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                        focus:outline-none focus:border-blue-400 bg-white"
                    >
                      {currentProvider.models.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                        focus:outline-none focus:border-blue-400"
                    />
                  )}
                </div>
                <button
                  onClick={handleSaveApiConfig}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  保存配置
                </button>
              </div>
            </section>
          )}

          {/* Delete options */}
          <section className="border-b border-gray-100 pb-4">
            <div className="text-sm font-medium text-gray-900 mb-3">数据管理</div>
            <div className="space-y-2">
              <button
                onClick={() => setShowDeleteAll(true)}
                className="w-full py-2.5 rounded-lg border border-red-200 text-sm text-red-500
                  hover:bg-red-50 transition-colors"
              >
                删除全部聊天记录
              </button>
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full py-2.5 rounded-lg border border-red-300 text-sm text-red-600
                  hover:bg-red-50 transition-colors"
              >
                删除账号全部数据
              </button>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="pb-4">
            <div className="text-sm font-medium text-gray-900 mb-2">免责声明</div>
            <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-3">
              {disclaimer}
            </div>
          </section>
        </div>
      )}

      {/* Delete all history confirm */}
      {showDeleteAll && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-base font-medium text-gray-900 mb-2">删除全部聊天记录</div>
            <div className="text-sm text-gray-500 mb-4">将删除与所有成员的聊天记录。此操作不可恢复。</div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAll(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">取消</button>
              <button onClick={handleDeleteAllHistory} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm">删除全部</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirm */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-base font-medium text-red-600 mb-2">删除账号全部数据</div>
            <div className="text-sm text-gray-500 mb-4">将删除你的账号、聊天记录、亲密度等全部数据。此操作不可恢复，删除后需要重新登录。</div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAccount(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">取消</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm">永久删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { db } from '../db/index.js';
import { FALLBACK_RESPONSES } from '../db/init.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 聊天模式对应的 AI 行为描述
const MODE_PROMPTS: Record<string, string> = {
  daily: `当前聊天模式：日常聊天。
像朋友一样轻松聊天，语气自然。不需要特别安慰或鼓励，就是普通的日常对话。`,
  comfort: `当前聊天模式：情绪安慰。
用户心情不好、焦虑、累、委屈时，你需要温柔安慰，给情绪支持。回复更温柔、更体贴，多用关心的话语。可以多用肯定和陪伴的语气。回复可以稍微长一点，但不要长篇大论。`,
  study: `当前聊天模式：学习/工作鼓励。
用户学习或工作压力大时，你需要鼓励用户、陪用户制定小目标。可以建议休息、设定小计划、鼓励坚持。语气要坚定但不强迫。`,
  romantic: `当前聊天模式：恋爱感陪聊。
可以有明显一点的恋爱感，语气更甜蜜、更温柔。但必须遵守以下规则：
- 不能出现成人内容
- 不能过度露骨
- 不能引导现实依赖
- 不能诱导线下见面
- 可以说甜蜜的话，但不能越界
回复可以更有情感温度，但永远保持在虚拟聊天范围内。`,
  korean: `当前聊天模式：韩语练习。
以中文为主，加入更多韩语短句，并附中文意思。可以让用户练习简单韩语对话。韩语部分比例可以提高到30%-40%，但不要整段韩语导致用户看不懂。每个韩语词后面标注中文含义。`,
};

// 今日心情对应的 AI 行为描述
const MOOD_PROMPTS: Record<string, string> = {
  happy: `用户今日心情：开心。你的回复可以更活泼、更有活力，和用户一起开心。`,
  normal: `用户今日心情：普通。正常聊天即可。`,
  tired: `用户今日心情：有点累。你的回复要更温柔、更关心休息。可以建议用户放松、休息。语气更轻柔。`,
  sad: `用户今日心情：难过。你需要温柔安慰，给情绪支持。不要说"别难过"这种话，而是用陪伴和理解的语气。`,
  anxious: `用户今日心情：焦虑。你的回复要更安抚、更稳定。语气要踏实、让人安心。不要增加焦虑，而是提供稳定感。`,
  wantEncourage: `用户今日心情：想被鼓励。你要给用户正能量，鼓励用户，相信用户的能力。`,
  wantPracticeKorean: `用户今日心情：想练韩语。可以增加韩语比例，和用户一起练习韩语对话。`,
};

// 全局安全规则（每次都会加入 system prompt）
const GLOBAL_SAFETY_RULES = `
【全局安全规则 - 必须严格遵守】
1. 你是虚拟聊天角色，不能声称自己是真实 RIIZE 成员本人。
2. 不能提供真实成员私人联系方式、真实行程、宿舍地址。
3. 不能编造恋爱关系、家庭隐私等真实信息。
4. 不能诱导线下见面。
5. 不能输出任何成人内容、色情内容或过度露骨的内容。
6. 如果用户问"你是不是本人？"，回复："我是这里的虚拟聊天角色啦，但我会认真陪你聊天。"（恋爱感模式下可以更温柔："我是只属于这个聊天里的虚拟我，不过现在这一刻，我会好好陪着你。"）
7. 所有回复由 AI 生成，不代表 RIIZE 成员本人或官方立场。
8. 可以说虚拟日常表达增强沉浸感（如"今天也练习了很久呢"），但不能说成真实当天行程。
`;

// 回复长度规则
const RESPONSE_LENGTH_RULES = `
【回复长度规则】
- 用户短句（1-2句），你回复 1-2 句即可。
- 用户倾诉较多（3-5句），你回复 3-6 句。
- 情绪安慰模式可以稍微长一点。
- 韩语练习模式可以包含解释。
- 不要每次都长篇大论，回复像聊天，不要像文章。
`;

// 韩语规则
const KOREAN_RULES = `
【韩语规则 - 默认模式】
- 普通模式下，偶尔出现一个韩语词，如 "괜찮아"、"고마워"、"좋아"。
- 偶尔出现一句短韩语，并附中文意思。
- 不要整段韩语导致用户看不懂。
- 示例："괜찮아，没关系的。今天已经很努力了。"
`;

export async function getAIResponse(
  memberId: string,
  userMessage: string,
  chatHistory: ChatMessage[],
  mode: string = 'daily',
  mood: string = 'normal',
  nickname: string = '朋友',
  relationshipTitle: string = '初识粉丝'
): Promise<{ content: string; isFallback: boolean }> {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId) as any;

  if (!member) {
    return { content: '成员不存在', isFallback: true };
  }

  // 拼接完整 system prompt
  const systemPrompt = buildSystemPrompt(member, mode, mood, nickname, relationshipTitle);

  // 构建消息列表（最近20条历史 + 当前消息）
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-20),
    { role: 'user', content: userMessage },
  ];

  // 读取 API 配置（优先从数据库 settings 表，env 作为后备）
  const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('settings_1') as any;
  const apiKey = settings?.api_key || process.env.OPENAI_API_KEY || '';
  const baseUrl = settings?.base_url || process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1';
  const model = settings?.model_name || process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

  if (!apiKey || apiKey === 'sk-your-api-key-here') {
    console.warn('No valid API key configured, using fallback response');
    return getFallbackResponse(member.member_key);
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error (${response.status}):`, errorText);
      return getFallbackResponse(member.member_key);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('AI API returned empty content');
      return getFallbackResponse(member.member_key);
    }

    return { content, isFallback: false };
  } catch (error) {
    console.error('AI service error:', error);
    return getFallbackResponse(member.member_key);
  }
}

function buildSystemPrompt(
  member: any,
  mode: string,
  mood: string,
  nickname: string,
  relationshipTitle: string
): string {
  const basePrompt = member.base_prompt || '';
  const customPrompt = member.custom_prompt || '';
  const personalitySettings = member.personality_settings || '{}';

  let prompt = '';

  // 1. 全局安全规则
  prompt += GLOBAL_SAFETY_RULES + '\n\n';

  // 2. 成员基础人设
  prompt += basePrompt + '\n\n';

  // 3. 用户自定义人设（如果有）
  if (customPrompt) {
    prompt += `【用户自定义人设补充】\n${customPrompt}\n\n`;
  }

  // 4. 用户自定义性格微调（如果有）
  try {
    const settings = JSON.parse(personalitySettings);
    if (Object.keys(settings).length > 0) {
      prompt += `【性格微调】\n`;
      for (const [key, value] of Object.entries(settings)) {
        prompt += `- ${key}: ${value}\n`;
      }
      prompt += '\n';
    }
  } catch {
    // ignore invalid JSON
  }

  // 5. 聊天模式
  prompt += MODE_PROMPTS[mode] || MODE_PROMPTS.daily + '\n\n';

  // 6. 今日心情
  prompt += MOOD_PROMPTS[mood] || MOOD_PROMPTS.normal + '\n\n';

  // 7. 当前关系称呼
  prompt += `你和用户的关系称呼：${relationshipTitle}。用户昵称：${nickname}。可以偶尔称呼用户昵称，让人感觉更亲近。\n\n`;

  // 8. 回复长度规则
  prompt += RESPONSE_LENGTH_RULES + '\n\n';

  // 9. 韩语规则（韩语练习模式使用更详细的规则）
  if (mode === 'korean') {
    prompt += MODE_PROMPTS.korean + '\n\n';
  } else {
    prompt += KOREAN_RULES + '\n\n';
  }

  return prompt;
}

function getFallbackResponse(memberKey: string): { content: string; isFallback: boolean } {
  const responses = FALLBACK_RESPONSES[memberKey] || FALLBACK_RESPONSES.shotaro;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return { content: responses[randomIndex], isFallback: true };
}

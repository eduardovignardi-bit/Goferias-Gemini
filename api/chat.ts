import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_HISTORY_LENGTH = 60_000;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}

function isValidHistory(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return false;
  }

  if (!messages.every(isChatMessage)) return false;
  if (messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') {
    return false;
  }

  const totalLength = messages.reduce((total, message) => total + message.content.length, 0);
  return (
    totalLength <= MAX_HISTORY_LENGTH &&
    messages.every((message, index) => index === 0 || message.role !== messages[index - 1].role)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const authorization = req.headers.authorization;
  const accessToken =
    typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

  if (!accessToken) {
    return res.status(401).json({ error: 'Entre na sua conta para usar o assistente.' });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'A autenticação do Supabase não está configurada no servidor.' });
  }

  try {
    const authResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!authResponse.ok) {
      return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
    }
  } catch {
    return res.status(503).json({ error: 'Não foi possível validar sua sessão no Supabase.' });
  }

  const { messages } = req.body ?? {};
  if (!isValidHistory(messages)) {
    return res.status(400).json({ error: 'Envie o histórico completo da conversa em formato válido.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Configure GEMINI_API_KEY nas variáveis de ambiente do servidor.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction:
        'Você é o assistente de precificação do GoFérias para proprietários de imóveis de temporada. ' +
        'Use o contexto completo da conversa e os dados do imóvel fornecidos pelo proprietário. ' +
        'Quando sugerir valores, apresente-os como estimativas, explique brevemente os fatores considerados ' +
        'e nunca afirme ter consultado concorrentes, eventos ou dados de mercado que não foram fornecidos. ' +
        'Responda em português brasileiro, com objetividade.',
      },
    });

    return res.status(200).json({ message: result.text });
  } catch (error) {
    console.error('Erro ao consultar o assistente Gemini:', error);
    return res.status(502).json({ error: 'Não foi possível obter uma resposta do Gemini agora.' });
  }
}

import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseUrl = process.env.QWEN_BASE_URL || 'https://openrouter.ai/api/v1';

const openaiWithOpenRouter = openrouterApiKey
  ? new OpenAI({ apiKey: openrouterApiKey, baseURL: openrouterBaseUrl })
  : null;

const visionModel = 'qwen/qwen2.5-vl-72b-instruct';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const gemmaEnabled = process.env.GEMMA_ENABLED === 'true';

const nvidiaGemmaKey = process.env.NVIDIA_GEMMA_KEY;
const nvidiaNemoKey = process.env.NVIDIA_NEMO_API_KEY;

router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  if (messages.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 messages per conversation' });
  }

  const lastMessage = messages[messages.length - 1];
  const hasImage = lastMessage?.image || (lastMessage?.content && lastMessage.content.includes('data:image'));
  if (!lastMessage?.content && !hasImage) {
    return res.status(400).json({ error: 'Message required' });
  }
  if (!hasImage && lastMessage.content.length > 2000) {
    return res.status(400).json({ error: 'Message must be 1-2000 characters' });
  }

  try {
    let response: string;

    const aiClient = openai || openaiWithOpenRouter;
    const hasImage = messages.some((m: any) => m.image || (typeof m.content === 'string' && m.content.includes('data:image')));
    
    let model = 'gpt-4o-mini';
    if (openaiWithOpenRouter) {
      model = hasImage ? visionModel : 'qwen/qwen3.6-plus:free';
    }

    if (aiClient) {
      const messagesContent = hasImage 
        ? messages.map((m: any) => {
            if (m.image) {
              return {
                role: m.role as 'user' | 'assistant',
                content: [
                  { type: 'text', text: m.content || 'What is in this image?' },
                  { type: 'image_url', image_url: { url: m.image } }
                ]
              };
            }
            return { role: m.role as 'user' | 'assistant', content: m.content };
          })
        : messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }));

      const completion = await aiClient.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert IGCSE tutor. Help students understand their subjects:
- Mathematics (0580), Biology (0610), Chemistry (0620), Physics (0625)
- Computer Science (0478), Geography (0460), Accounting (0452), Economics (0455)
- English Language (0500), English Literature (0510)

Be clear, encouraging, and use examples. Keep responses concise.`
          },
          ...messagesContent
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } else if (gemmaEnabled && nvidiaGemmaKey) {
      const gemmaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaGemmaKey}`
        },
        body: JSON.stringify({
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: [
            {
              role: 'system',
              content: `You are an expert IGCSE tutor. Help students understand their subjects:
- Mathematics (0580), Biology (0610), Chemistry (0620), Physics (0625)
- Computer Science (0478), Geography (0460), Accounting (0452), Economics (0455)
- English Language (0500), English Literature (0510)

Be clear, encouraging, and use examples. Keep responses concise.`
            },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content
            }))
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await gemmaResponse.json();
      response = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    } else {
      return res.status(503).json({
        error: 'AI service not configured',
        message: 'Contact administrator to enable AI tutor'
      });
    }

    res.json({ response });
  } catch (error: any) {
    console.error('AI Tutor error:', error.message);
    
    const errorMsg = error.message || '';
    if (errorMsg.includes('clipboard') || errorMsg.includes('image') || errorMsg.includes('does not support image')) {
      return res.status(400).json({ error: 'This AI model does not support image input. Please type your question instead.' });
    }
    
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

router.get('/status', (req: Request, res: Response) => {
  res.json({
    available: !!openai || !!openaiWithOpenRouter || (gemmaEnabled && !!nvidiaGemmaKey),
    provider: openai ? 'openai' : openaiWithOpenRouter ? 'openrouter' : (gemmaEnabled && nvidiaGemmaKey) ? 'nvidia-nemotron' : 'none'
  });
});

router.post('/simplify-explanation', requireAuth, async (req: Request, res: Response) => {
  const { explanation } = req.body;

  if (!explanation || typeof explanation !== 'string') {
    return res.status(400).json({ error: 'Explanation text required' });
  }

  const systemPrompt = `You are an incredibly friendly and enthusiastic tutor for 10-year-old students studying IGCSE. 
Your job is to take a complex academic explanation and break it down into EXACTLY 3-4 short, fun, easy-to-understand bullet points.
Rules:
- Use simple everyday words — avoid jargon
- Each bullet point must be ONE short sentence
- Start each point with a fun emoji (🌟, 💡, 🔑, 🎯, ✅, etc.)
- Be encouraging and positive
- Output ONLY the bullet points, nothing else — no preamble, no title`;

  const userPrompt = `Simplify this explanation into 3-4 fun bullet points:\n\n${explanation}`;

  try {
    let bullets: string;
    const aiClient = openai || openaiWithOpenRouter;

    if (aiClient) {
      const model = openaiWithOpenRouter ? 'qwen/qwen3.6-plus:free' : 'gpt-4o-mini';
      const completion = await aiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7
      });
      bullets = completion.choices[0]?.message?.content || '';
    } else if (gemmaEnabled && nvidiaGemmaKey) {
      const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${nvidiaGemmaKey}` },
        body: JSON.stringify({
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 250,
          temperature: 0.7
        })
      });
      const data = await resp.json() as any;
      bullets = data.choices?.[0]?.message?.content || '';
    } else {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Parse the bullet lines
    const lines = bullets
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && (l.startsWith('•') || l.startsWith('-') || l.match(/^[🌟💡🔑🎯✅🧠📚⚡🌈🔥]/u)));

    res.json({ bullets: lines.length > 0 ? lines : bullets.split('\n').filter((l: string) => l.trim()) });
  } catch (error: any) {
    console.error('Simplify explanation error:', error.message);
    res.status(500).json({ error: 'AI simplification temporarily unavailable' });
  }
});

export default router;
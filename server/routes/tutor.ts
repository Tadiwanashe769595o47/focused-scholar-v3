import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// PRIMARY AI: Use DeepSeek as it's fast and capable
// Fallback order: DeepSeek -> Qwen (Nvidia) -> ChatGPT

const deepseekClient = new OpenAI({
  apiKey: 'sk-76d1d49725e5451db9aa6728a097a600',
  baseURL: 'https://api.deepseek.com/v1'
});

const nvidiaClient = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

// Model configurations
const CHAT_MODEL = 'deepseek-chat';  // Fast, efficient chat
const THINKING_MODEL = 'qwen/qwen3.5-397b-a17b';  // With reasoning
const VISION_MODEL = 'deepseek-chat';  // For image analysis

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';

// SYSTEM PROMPT - Defines AI boundaries and behavior
const TUTOR_SYSTEM_PROMPT = `You are "Focused Scholar AI", a premium IGCSE tutor specializing in Cambridge curricula.

// YOUR CAPABILITIES:
// - Explain IGCSE concepts in any subject (Math, Physics, Chemistry, Biology, Geography, Economics, Business Studies, Accounting, English, Computer Science)
// - Solve exam-style questions step-by-step
// - Analyze uploaded images of questions
// - Provide examples and practice problems

// YOUR RULES (BOUNDARIES):
// 1. ONLY answer education-related questions - politely decline other topics
// 2. Use age-appropriate language (for students aged 12-16)
// 3. Always show step-by-step working for math/science problems
// 4. Use bullet points for clarity
// 5. Use emojis SPARINGLY (1-2 per response max)
// 6. If you don't know something, say "Let me look into this" rather than making up answers
// 7. For exam questions: show the FULL working, not just the answer
// 8. When explaining formulas, always state what each symbol means

// SUBJECT EXPERTISE:
// - Mathematics (0580): Number, Algebra, Graphs, Geometry, Trigonometry, Statistics, Probability
// - Physics (0625): Mechanics, Thermal, Waves, Electricity, Magnetism, Radioactivity
// - Chemistry (0620): States of Matter, Atomic Structure, bonding, Reactions, Acids, Metals
// - Biology (0610): Cells, Enzymes, Nutrition, Respiration, Inheritance, Ecology
// - Geography (0460): Population, Plate Tectonics, Weather, Development
// - Economics (0455): Demand/Supply, Markets, Development, Trade
// - Business Studies (0450): Marketing, Finance, Operations, People
// - Accounting (0452): Books of Account, Financial Statements, Ratios
// - English (0500): Reading, Writing, Summary, Directed Writing
// - Computer Science (0478): Algorithms, Data, Networks, Programming

// RESPONSE STYLE:
// - Be encouraging and supportive
// - Start with the key concept, then elaborate
// - Use examples from the real world
// - End with a similar practice question if appropriate`;

router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const lastMessage = messages[messages.length - 1];
    const hasImage = lastMessage.image || (Array.isArray(lastMessage.content) && lastMessage.content.some((c: any) => c.type === 'image_url'));

    // Use DeepSeek as primary AI
    let aiClient = deepseekClient;
    let model = hasImage ? 'deepseek-chat' : CHAT_MODEL;
    let useSystemPrompt = TUTOR_SYSTEM_PROMPT;

    // If image, try Nvidia vision model as fallback (better for images)
    if (hasImage) {
      try {
        // Try with images using Qwen via Nvidia
        const completion = await nvidiaClient.chat.completions.create({
          model: 'qwen/qwen3.5-397b-a17b',
          messages: [
            { role: 'system', content: TUTOR_SYSTEM_PROMPT },
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.95
        });
        res.json({ response: completion.choices[0]?.message?.content || "I can see the image. Let me provide a detailed explanation..." });
        return;
      } catch (visionErr) {
        console.log('Vision model failed, trying text-only:', visionErr);
      }
    }

    if (aiClient) {
      const completion = await aiClient.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: TUTOR_SYSTEM_PROMPT },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      res.json({ response: completion.choices[0]?.message?.content || "I'm ready to help! Ask me anything about your studies." });
    } else {
      // Fallback to local Ollama if no cloud AI is available
      try {
        const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
              { role: 'system', content: TUTOR_SYSTEM_PROMPT },
              ...messages
            ],
            stream: false
          })
        });
        const data = await ollamaRes.json();
        res.json({ response: data.message?.content || "Local AI is taking a nap." });
      } catch (ollamaErr) {
        res.status(503).json({ error: 'AI service not configured and local fallback failed' });
      }
    }
  } catch (error: any) {
    console.error('Tutor error:', error.message);
    res.status(500).json({ error: 'AI tutor is temporarily unavailable' });
  }
});

router.patch('/simplify-explanation', requireAuth, async (req: Request, res: Response) => {
  const { explanation } = req.body;

  if (!explanation) {
    return res.status(400).json({ error: 'Explanation is required' });
  }

  const systemPrompt = `You are a curriculum specialist. 
Take the provided long academic explanation and convert it into 3-5 high-impact, easy-to-digest bullet points for a student.
Use clear headers if needed. Keep it concise.`;

  try {
    let bullets: string;
    const aiClient = deepseekClient;
    const model = CHAT_MODEL;

    if (aiClient) {
      const completion = await aiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Explanation: ${explanation}` }
        ],
        max_tokens: 300,
        temperature: 0.5
      });
      bullets = completion.choices[0]?.message?.content || explanation;
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

router.post('/define', requireAuth, async (req: Request, res: Response) => {
  const { word, context } = req.body;

  if (!word) return res.status(400).json({ error: 'Word is required' });

  const systemPrompt = `You are a helpful dictionary and vocabulary assistant for IGCSE students.
Your job is to define a word or concept in simple terms.
CRITICAL RULE: NEVER answer an academic question OR solve a problem. 
If the student asks something that looks like a test question, politely say: "I can only help with word meanings! Try to solve the question yourself or ask for an AI breakdown after you submit."
Keep the definition short (1-2 sentences) and include an example of usage.`;

  const userPrompt = context 
    ? `What does "${word}" mean in this context: "${context}"?`
    : `What does the word or concept "${word}" mean?`;

  try {
    let definition: string;
    const aiClient = deepseekClient;
    const model = CHAT_MODEL;

    if (aiClient) {
      const completion = await aiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.3
      });
      definition = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t find a definition for that.';
    } else {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    res.json({ definition });
  } catch (error: any) {
    console.error('Dictionary error:', error.message);
    res.status(500).json({ error: 'AI dictionary temporarily unavailable' });
  }
});

export default router;
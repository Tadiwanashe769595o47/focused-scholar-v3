import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// PRIMARY AI: Use DeepSeek as it's fast and capable
// Fallback order: DeepSeek -> Qwen (Nvidia) -> ChatGPT

let deepseekClient: any = null;
let nvidiaClient: any = null;

try {
  deepseekClient = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-76d1d49725e5451db9aa6728a097a600',
    baseURL: 'https://api.deepseek.com/v1'
  });
  console.log('DeepSeek client initialized successfully');
} catch (err) {
  console.error('Failed to initialize DeepSeek client:', err);
}

try {
  nvidiaClient = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY || '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',
    baseURL: 'https://integrate.api.nvidia.com/v1'
  });
  console.log('Nvidia client initialized successfully');
} catch (err) {
  console.error('Failed to initialize Nvidia client:', err);
}

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

    // Try DeepSeek first
    if (deepseekClient) {
      try {
        const completion = await deepseekClient.chat.completions.create({
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
        return;
      } catch (deepseekErr: any) {
        console.error('DeepSeek failed:', deepseekErr.message);
      }
    }

    // Try Nvidia as fallback
    if (nvidiaClient) {
      try {
        const completion = await nvidiaClient.chat.completions.create({
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
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
        return;
      } catch (nvidiaErr: any) {
        console.error('Nvidia failed:', nvidiaErr.message);
      }
    }

    // Try Ollama local fallback
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
      return;
    } catch (ollamaErr) {
      console.error('Ollama failed:', ollamaErr);
    }

    // If we get here, all AI services failed
    res.status(503).json({ response: "I'm having trouble connecting to my AI brain right now. But I can still help! Try:\n\n1. Asking me about a specific topic\n2. Reviewing your flashcards\n3. Taking a practice test\n\nThe AI service should be back soon!" });
  } catch (error: any) {
    console.error('Tutor error:', error.message);
    
    // Return a friendly error message instead of 500
    res.status(200).json({ 
      response: "I'm having trouble connecting to my AI brain right now. But I can still help! Try:\n\n1. Asking me about a specific topic\n2. Reviewing your flashcards\n3. Taking a practice test\n\nThe AI service should be back soon!" 
    });
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

    // Try DeepSeek first
    if (deepseekClient) {
      try {
        const completion = await deepseekClient.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Explanation: ${explanation}` }
          ],
          max_tokens: 300,
          temperature: 0.5
        });
        bullets = completion.choices[0]?.message?.content || explanation;
        res.json({ bullets: parseBullets(bullets) });
        return;
      } catch (err) {
        console.error('DeepSeek simplify failed:', err);
      }
    }

    // Try Nvidia fallback
    if (nvidiaClient) {
      try {
        const completion = await nvidiaClient.chat.completions.create({
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Explanation: ${explanation}` }
          ],
          max_tokens: 300,
          temperature: 0.5
        });
        bullets = completion.choices[0]?.message?.content || explanation;
        res.json({ bullets: parseBullets(bullets) });
        return;
      } catch (err) {
        console.error('Nvidia simplify failed:', err);
      }
    }

    // All failed
    res.status(503).json({ error: 'AI service temporarily unavailable' });
  } catch (error: any) {
    console.error('Simplify explanation error:', error.message);
    res.status(500).json({ error: 'AI simplification temporarily unavailable' });
  }
});

function parseBullets(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0 && (l.startsWith('•') || l.startsWith('-') || l.match(/^[🌟💡🔑🎯✅🧠📚⚡🌈🔥]/u)));
  return lines.length > 0 ? lines : text.split('\n').filter((l: string) => l.trim());
}

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

    // Try DeepSeek first
    if (deepseekClient) {
      try {
        const completion = await deepseekClient.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 150,
          temperature: 0.3
        });
        definition = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t find a definition for that.';
        res.json({ definition });
        return;
      } catch (err) {
        console.error('DeepSeek define failed:', err);
      }
    }

    // Try Nvidia fallback
    if (nvidiaClient) {
      try {
        const completion = await nvidiaClient.chat.completions.create({
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 150,
          temperature: 0.3
        });
        definition = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t find a definition for that.';
        res.json({ definition });
        return;
      } catch (err) {
        console.error('Nvidia define failed:', err);
      }
    }

    // All failed
    res.status(503).json({ error: 'AI dictionary temporarily unavailable' });
  } catch (error: any) {
    console.error('Dictionary error:', error.message);
    res.status(500).json({ error: 'AI dictionary temporarily unavailable' });
  }
});

export default router;
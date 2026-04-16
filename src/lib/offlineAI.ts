import { useState, useCallback } from 'react';

interface WebLLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Interface for WebLLM - local AI in browser
class OfflineAI {
  private engine: any = null;
  private loaded = false;
  private loading = false;

  // System prompt for the tutor
  private systemPrompt = `You are "Focused Scholar AI", a friendly IGCSE tutor for students aged 12-16.
Help explain concepts simply in 3rd-grade readability.
Use short sentences and simple words.
Always show step-by-step explanations.
Be encouraging and supportive.`;

  async initialize(onProgress?: (progress: number) => void): Promise<boolean> {
    if (this.loaded) return true;
    if (this.loading) return false;

    this.loading = true;

    try {
      // Dynamically import WebLLM
      const { ChatHandler, PreqEngine } = await import('@mlc-ai/web-llm');
      
      const initProgressCallback = (progress: number) => {
        if (onProgress) {
          onProgress(progress * 100);
        }
      };

      // Use a small, capable model that works in browser
      // Phi-2 is a good balance of capability and size (~2.7GB)
      this.engine = new ChatHandler(
        new PreqEngine({
          model: 'Phi-2-instruct-q4f32_1-MLC',
          initProgressCallback
        })
      );

      // Initialize the engine
      await this.engine.init();
      this.loaded = true;
      this.loading = false;
      return true;
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      this.loading = false;
      return false;
    }
  }

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.loaded || !this.engine) {
      throw new Error('AI not initialized');
    }

    try {
      const formattedMessages = [
        { role: 'system', content: this.systemPrompt },
        ...messages
      ];

      const response = await this.engine.chat.completions.create({
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || "I'm having trouble thinking right now. Try again!";
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.loaded;
  }

  async terminate(): Promise<void> {
    if (this.engine) {
      this.engine.terminate();
      this.engine = null;
      this.loaded = false;
    }
  }
}

// Singleton instance
let offlineAI: OfflineAI | null = null;

function getOfflineAI(): OfflineAI {
  if (!offlineAI) {
    offlineAI = new OfflineAI();
  }
  return offlineAI;
}

// React hook for using offline AI
export function useOfflineAI() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async (onProgress?: (p: number) => void) => {
    setStatus('loading');
    setProgress(0);
    setError(null);

    try {
      const ai = getOfflineAI();
      const success = await ai.initialize((p) => {
        setProgress(p);
        onProgress?.(p);
      });

      if (success) {
        setStatus('ready');
      } else {
        setStatus('error');
        setError('Failed to initialize AI');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to initialize');
    }
  }, []);

  const chat = useCallback(async (messages: { role: string; content: string }[]): Promise<string> => {
    const ai = getOfflineAI();
    if (!ai.isReady()) {
      throw new Error('AI not initialized. Please wait for it to load.');
    }
    return ai.chat(messages);
  }, []);

  return {
    status,
    progress,
    error,
    initialize,
    chat,
    isReady: status === 'ready'
  };
}

// Check if WebLLM is supported in this browser
export function isWebLLMSupported(): boolean {
  // Check for WebGPU support (required for WebLLM)
  return navigator.gpu !== undefined;
}

// Fallback response when offline AI isn't available
export function getOfflineFallbackResponse(): string {
  return `I'm having trouble connecting to my AI brain right now. But I can still help!

Here are some things you can do:
1. Review your flashcards
2. Practice more questions in your study notes
3. Try a different subject

Tip: If you're online, the AI should work better. If you're offline, make sure you've loaded the offline questions first!`;
}
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'consciousness';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(persist(
  (set, get) => ({
    messages: [],
    isLoading: false,
    error: null,

    addMessage: (message) => {
      const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    },

    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error }),

    clearMessages: () => set({ messages: [] }),

    sendMessage: async (content: string) => {
      const { addMessage, setLoading, setError } = get();
      
      try {
        setLoading(true);
        setError(null);
        
        // Add user message immediately
        addMessage({ role: 'user', content });
        
        // Get auth token
        const { session } = useAuthStore.getState();
        if (!session?.access_token) {
          throw new Error('Usuário não autenticado');
        }
        
        // Send to API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: content }),
        });
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add AI response
        addMessage({ role: 'consciousness', content: data.reply });
        
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    },
  }),
  {
    name: 'soulnet-chat-storage',
    partialize: (state) => ({ messages: state.messages }),
  }
));
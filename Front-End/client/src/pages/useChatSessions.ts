import { useState, useEffect, useCallback } from "react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources_used?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  paperId?: number;
  paperTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'aiAssistantChatSessions';

// Helper to convert JSON dates back to Date objects
const reviveDates = (sessions: ChatSession[]): ChatSession[] => {
  return sessions.map(session => ({
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    messages: session.messages.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
  }));
};

export const useChatSessions = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Load sessions from localStorage on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem(STORAGE_KEY);
    if (storedSessions) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(storedSessions);
        const revivedSessions = reviveDates(parsedSessions);
        
        // Sort by updatedAt descending (most recent first)
        revivedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        setChatSessions(revivedSessions);
        
        // Load the most recent session
        if (revivedSessions.length > 0) {
          const lastSession = revivedSessions[0];
          setCurrentSessionId(lastSession.id);
          setMessages(lastSession.messages);
        } else {
          // Start a default new session if none exist
          createInitialSession();
        }
      } catch (e) {
        console.error("Could not parse chat sessions from localStorage", e);
        createInitialSession();
      }
    } else {
      createInitialSession();
    }
    setIsInitialized(true);
  }, []);

  // Helper to create initial session
  const createInitialSession = () => {
    const newSessionId = Date.now().toString();
    const now = new Date();
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am the Insight AI Assistant. I can help you summarize papers, find specific research, or explain complex scientific concepts. How can I assist you today?',
      timestamp: now
    };
    
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [initialMessage],
      createdAt: now,
      updatedAt: now,
    };

    setChatSessions([newSession]);
    setCurrentSessionId(newSessionId);
    setMessages([initialMessage]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newSession]));
  };

  // 2. Save sessions to localStorage
  const saveSessions = useCallback((sessions: ChatSession[]) => {
    // Sort by updatedAt descending before saving
    const sortedSessions = [...sessions].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    setChatSessions(sortedSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedSessions));
  }, []);

  // 3. Start a new chat session
  const startNewChat = useCallback((saveCurrentFirst = true) => {
    if (!isInitialized) return;

    // Save current session if it has messages and saveCurrentFirst is true
    if (saveCurrentFirst && currentSessionId && messages.length > 0) {
      const currentSessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
      if (currentSessionIndex !== -1) {
        const updatedSessions = [...chatSessions];
        updatedSessions[currentSessionIndex] = {
          ...updatedSessions[currentSessionIndex],
          messages: messages,
          updatedAt: new Date(),
        };
        saveSessions(updatedSessions);
      }
    }

    // Create new session
    const newSessionId = Date.now().toString();
    const now = new Date();
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am the Insight AI Assistant. I can help you summarize papers, find specific research, or explain complex scientific concepts. How can I assist you today?',
      timestamp: now
    };
    
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [initialMessage],
      createdAt: now,
      updatedAt: now,
    };

    // Add new session to the list (it will be sorted by saveSessions)
    const updatedSessions = [newSession, ...chatSessions];
    saveSessions(updatedSessions);
    setCurrentSessionId(newSessionId);
    setMessages([initialMessage]);
    
    return newSessionId;
  }, [chatSessions, currentSessionId, messages, saveSessions, isInitialized]);

  // 4. Load a specific chat session
  const loadChatSession = useCallback((session: ChatSession) => {
    if (!isInitialized) return;

    // Save current session before switching
    if (currentSessionId && currentSessionId !== session.id) {
      const currentSessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
      if (currentSessionIndex !== -1 && messages.length > 0) {
        const updatedSessions = [...chatSessions];
        updatedSessions[currentSessionIndex] = {
          ...updatedSessions[currentSessionIndex],
          messages: messages,
          updatedAt: new Date(),
        };
        saveSessions(updatedSessions);
      }
    }

    setCurrentSessionId(session.id);
    setMessages(session.messages);
  }, [chatSessions, currentSessionId, messages, saveSessions, isInitialized]);

  // 5. Update the current session with new messages
  const updateCurrentSession = useCallback((newMessages: Message[], newTitle?: string) => {
    if (!currentSessionId || !isInitialized) return;

    setMessages(newMessages);

    const sessionIndex = chatSessions.findIndex(s => s.id === currentSessionId);
    if (sessionIndex !== -1) {
      const updatedSessions = [...chatSessions];
      const currentSession = updatedSessions[sessionIndex];
      
      updatedSessions[sessionIndex] = {
        ...currentSession,
        messages: newMessages,
        updatedAt: new Date(),
        title: newTitle && currentSession.title === 'New Chat' 
          ? newTitle.substring(0, 50) + (newTitle.length > 50 ? '...' : '')
          : currentSession.title
      };

      saveSessions(updatedSessions);
    }
  }, [currentSessionId, chatSessions, saveSessions, isInitialized]);

  // 6. Delete a chat session
  const deleteSession = useCallback((sessionId: string) => {
    if (!isInitialized) return;

    const filteredSessions = chatSessions.filter(s => s.id !== sessionId);
    
    // If deleting the current session, switch to another or create new
    if (sessionId === currentSessionId) {
      if (filteredSessions.length > 0) {
        // Switch to the first available session (most recent)
        const nextSession = filteredSessions[0];
        setCurrentSessionId(nextSession.id);
        setMessages(nextSession.messages);
        saveSessions(filteredSessions);
      } else {
        // No sessions left, create a new one
        saveSessions([]);
        createInitialSession();
      }
    } else {
      saveSessions(filteredSessions);
    }
  }, [chatSessions, currentSessionId, saveSessions, isInitialized]);

  return {
    chatSessions,
    currentSessionId,
    messages,
    setMessages,
    startNewChat,
    loadChatSession,
    updateCurrentSession,
    deleteSession,
  };
};
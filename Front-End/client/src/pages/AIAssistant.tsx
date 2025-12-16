import { useState, useEffect, useRef, useCallback } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Plus, MessageSquare, Lock, Loader2, Upload, FileText, Sparkles, Trash2, X, Check, AlertCircle, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChatSessions } from "./useChatSessions";

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

const ChatMessage = ({ msg, index }: { msg: Message, index: number }) => {
  const isUser = msg.role === 'user';
  
  return (
    <div
      key={msg.id}
      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${isUser ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700' : 'bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700'}`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>
      
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${isUser ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-card border border-border rounded-tl-sm'}`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-2">
          <span className="text-[10px] text-muted-foreground">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.sources_used && msg.sources_used > 0 && (
            <Badge variant="secondary" className="rounded-full text-[9px] px-1.5 py-0 h-4">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              {msg.sources_used} sources
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

const AdvancedFileUpload = ({ 
  onFileSelect, 
  isUploading, 
  uploadedFileName 
}: { 
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadedFileName: string | null;
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.pdf')) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-1">Upload PDF Document</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Drag and drop your PDF here, or click to browse
            </p>
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      {uploadedFileName && !isUploading && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200 ml-2">
            <span className="font-medium">{uploadedFileName}</span> uploaded successfully!
          </AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="ml-2">
            Processing your PDF document...
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Supported format: PDF only • Max size: 10MB
        </p>
      </div>
    </div>
  );
};

export default function AIAssistant() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  
  const { 
    chatSessions, 
    currentSessionId, 
    messages, 
    setMessages, 
    startNewChat, 
    loadChatSession, 
    updateCurrentSession,
    deleteSession
  } = useChatSessions();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const API_BASE = 'http://localhost:8001';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 240 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setUploadError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload-pdf/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedPdfName(file.name);
        
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Great! I've successfully processed "${file.name}". The document has been split into ${data.num_chunks} chunks for analysis. You can now ask me questions about this PDF!`,
          timestamp: new Date()
        };
        
        const newMessages = [...messages, systemMessage];
        setMessages(newMessages);
        updateCurrentSession(newMessages);

        setTimeout(() => {
          setShowUploadDialog(false);
        }, 1500);
      } else {
        throw new Error(data.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    
    let sessionTitle = chatSessions.find(s => s.id === currentSessionId)?.title;
    if (sessionTitle === 'New Chat' || !sessionTitle) {
      sessionTitle = userMessage.content;
    }

    try {
      const response = await fetch(`${API_BASE}/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          sources_used: data.sources_used > 0 ? data.sources_used : undefined
        };
        
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        updateCurrentSession(finalMessages, sessionTitle);
      } else {
        throw new Error(data.detail || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages, sessionTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = chatSessions.find(s => s.id === currentSessionId);

  if (!isLoggedIn) {
    return (
      <MainLayout>
        <div className="container py-24 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                <p className="text-muted-foreground">Please login to access the AI Research Assistant.</p>
              </div>
              <Button className="w-full" onClick={() => setIsLoggedIn(true)}>
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <div 
          style={{ width: `${sidebarWidth}px` }}
          className="border-r border-border bg-gradient-to-b from-background to-muted/20 hidden md:flex flex-col shrink-0 relative"
        >
          <div className="p-4 border-b border-border space-y-3 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">AI Assistant</h2>
              </div>
            </div>

            <Button 
              className="w-full justify-start gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all" 
              onClick={() => startNewChat(true)}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full justify-start gap-2 h-11 shadow-sm" 
                  variant={uploadedPdfName ? "secondary" : "outline"}
                >
                  {uploadedPdfName ? (
                    <>
                      <FileText className="h-4 w-4 shrink-0 text-green-600" />
                      <span className="truncate text-sm" title={uploadedPdfName}>
                        {uploadedPdfName}
                      </span>
                      <Check className="h-3 w-3 ml-auto text-green-600" />
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload PDF</span>
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload PDF Document
                  </DialogTitle>
                  <DialogDescription>
                    Upload a research paper or document to enable AI-powered PDF analysis and Q&A.
                  </DialogDescription>
                </DialogHeader>
                <AdvancedFileUpload 
                  onFileSelect={handleFileSelect}
                  isUploading={isUploading}
                  uploadedFileName={uploadedPdfName}
                />
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between px-2 mb-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Chats ({chatSessions.length})
                </div>
              </div>
              
              {chatSessions.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">No chats yet</p>
                  <p className="text-xs text-muted-foreground/70">Start a new conversation to begin</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatSessions.map((session) => (
                    <div key={session.id} className="group relative">
                      <Button 
                        variant={currentSessionId === session.id ? "secondary" : "ghost"} 
                        className={`w-full justify-start gap-3 h-auto py-3 px-3 font-normal text-left transition-all ${
                          currentSessionId === session.id 
                            ? 'bg-secondary shadow-sm' 
                            : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => loadChatSession(session)}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate mb-0.5">{session.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {session.messages.length} messages • {new Date(session.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-opacity ${
                          currentSessionId === session.id ? 'opacity-100' : 'opacity-0'
                        } group-hover:opacity-0`} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this chat? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSession(session.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border shrink-0 bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>AI Assistant Active</span>
            </div>
          </div>

          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group z-10"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -right-1 w-3" />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="h-16 px-6 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold truncate">
                  {currentSession?.title || "Insight AI Assistant"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {messages.length} messages
                </p>
              </div>
            </div>
            {uploadedPdfName && (
              <Badge variant="secondary" className="gap-1.5 hidden sm:flex">
                <FileText className="h-3 w-3" />
                PDF: {uploadedPdfName.substring(0, 20)}...
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                {messages.map((msg, index) => (
                  <ChatMessage key={msg.id} msg={msg} index={index} />
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 animate-in fade-in">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-card border border-border rounded-tl-sm shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analyzing your question...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="border-t border-border bg-card/30 backdrop-blur-sm shrink-0">
            <div className="max-w-4xl mx-auto p-4">
              <div className="relative flex items-center gap-2 bg-background rounded-2xl border-2 border-border focus-within:border-primary transition-all shadow-sm">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about research papers, topics, or upload a PDF..."
                  className="border-0 h-12 px-4 focus-visible:ring-0 bg-transparent"
                  disabled={isLoading}
                />
                <Button 
                  size="icon" 
                  className="h-10 w-10 rounded-xl mr-1 shrink-0 shadow-md"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                AI-powered research assistant • Press Enter to send
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
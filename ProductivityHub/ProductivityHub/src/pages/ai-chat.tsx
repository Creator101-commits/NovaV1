import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet, apiPost } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FormattedMessage } from "@/components/ui/FormattedMessage";
import { AnimatedMessage } from "@/components/ui/AnimatedMessage";
import {
  Bot,
  Upload,
  FileText,
  Youtube,
  Mic,
  Send,
  Loader2,
  Download,
  Copy,
  Zap,
  List,
  FileCheck,
  BookOpen,
  PenTool,
  Calculator,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  Square,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  History,
} from "lucide-react";
import { groqAPI, ChatMessage as GroqChatMessage } from "@/lib/groq";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { getYouTubeTranscriptSafe } from "@/lib/youtubeTranscript";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  summaryType?: "quick" | "detailed" | "bullet";
  model?: string;
}

interface Summary {
  id: string;
  title: string;
  content: string;
  summary: string;
  summaryType: "quick" | "detailed" | "bullet";
  fileType: "pdf" | "text" | "audio" | "youtube";
  timestamp: Date;
}

const STARTER_PROMPTS = [
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Study Help",
    description: "Help me understand this topic",
    prompt: "Can you help me understand and study this topic? Please explain it in simple terms with examples."
  },
  {
    icon: <PenTool className="h-5 w-5" />,
    title: "Essay Writing",
    description: "Help me write an essay",
    prompt: "I need help writing an essay. Can you guide me through the process and help me organize my thoughts?"
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: "Math Problem",
    description: "Solve step-by-step",
    prompt: "Can you help me solve this math problem? Please show me the step-by-step process."
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Q&A Session",
    description: "Ask me questions to test my knowledge",
    prompt: "Can you ask me questions about a topic to help me study and test my understanding?"
  },
  {
    icon: <HelpCircle className="h-5 w-5" />,
    title: "Homework Help",
    description: "Get help with assignments",
    prompt: "I need help with my homework. Can you guide me through solving problems step by step?"
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
    title: "Explain Concept",
    description: "Break down complex ideas",
    prompt: "Can you explain this concept to me in a way that's easy to understand? Use analogies if helpful."
  }
];

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [inputText, setInputText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [summaryType, setSummaryType] = useState<"quick" | "detailed" | "bullet">("quick");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addActivity } = useActivity();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await apiGet("/api/notes");
      if (response.ok) {
        const data = await response.json();
        setNotes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
      setNotes([]);
    }
  };

  const handleStarterPrompt = (prompt: string) => {
    setChatInput(prompt);
    // Automatically send the message after a brief delay
    setTimeout(() => {
      handleChatMessage();
    }, 100);
  };

  const stopResponse = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      toast({
        title: "Response Stopped",
        description: "AI response has been stopped",
      });
    }
  };

  const addMessage = (type: "user" | "assistant", content: string, summaryType?: "quick" | "detailed" | "bullet", model?: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      summaryType,
      model,
    };
    setMessages(prev => [...prev, message]);
  };

  const saveSummaryToDatabase = async (summary: Summary) => {
    if (!user?.uid) return;

    try {
      const summaryData = {
        title: summary.title,
        summary: summary.summary,
        originalContent: summary.content,
        summaryType: summary.summaryType,
        fileType: summary.fileType,
      };

      const response = await apiPost(`/api/users/${user.uid}/ai-summaries`, summaryData);
      
      if (response.ok) {
        console.log('✅ AI summary saved to database');
      } else {
        console.error('Failed to save AI summary to database:', response.status);
      }
    } catch (error) {
      console.error('Error saving AI summary to database:', error);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    addMessage("user", "🔧 Testing AI connection...");

    try {
      const response = await groqAPI.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Respond with exactly "✅ Connection successful! AI chat is working properly." to confirm the connection.'
          },
          {
            role: 'user',
            content: 'Test connection'
          }
        ],
        maxTokens: 50,
        temperature: 0.1,
      });

      addMessage("assistant", response.content);
      toast({
        title: "Connection Test",
        description: "AI chat connection tested successfully!",
      });
    } catch (error) {
      console.error("Connection test error:", error);
      let errorMessage = "❌ **Connection Test Failed**\n\nThe AI service is not responding properly.";
      
      if (error instanceof Error) {
        errorMessage += `\n\n**Error Details:** ${error.message}`;
      }
      
      addMessage("assistant", errorMessage);
      toast({
        title: "Connection Failed",
        description: "AI chat connection test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatMessage = async () => {
    if (!chatInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    addMessage("user", chatInput);

    try {
      // Convert our chat messages to Groq format
      const chatHistory: GroqChatMessage[] = [
        {
          role: 'system' as const,
          content: `You are a helpful AI assistant designed to help students with their academic work. Provide clear, educational, and constructive responses using rich Markdown formatting.

**Formatting Guidelines:**
- Use **bold** for important terms and key concepts
- Use *italics* for emphasis and definitions
- Use \`inline code\` for technical terms, commands, or formulas
- Use code blocks with language identifiers for multi-line code:
  \`\`\`python
  code here
  \`\`\`
- Use # ## ### for headings to organize long responses
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (- * •) for feature lists
- Use > blockquotes for important definitions or key concepts
- Use tables | header | header | for comparisons or data
- Use --- for section breaks
- Use checklists - [ ] for tasks or troubleshooting steps
- Use emoji appropriately for warnings (⚠️), tips (💡), success (✅), etc.
- Use $$math$$ for mathematical equations
- Create callout boxes with emoji + **title** for important information:
  💡 **Pro Tip**
  Content here
  
Structure your responses with clear headings, proper spacing, and logical flow. Make complex topics easy to understand through good formatting.`
        },
        ...messages
          .filter(msg => msg.type !== "assistant" || !msg.summaryType) // Exclude summary responses from chat history
          .map(msg => ({
            role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          })),
        {
          role: 'user' as const,
          content: chatInput
        }
      ];

      const response = await groqAPI.chat({
        messages: chatHistory,
        maxTokens: 1000,
        temperature: 0.7,
      });

      if (!controller.signal.aborted) {
        addMessage("assistant", response.content, undefined, response.model);
        setChatInput("");
        toast({
          title: "Success",
          description: "Message sent successfully!",
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, don't show error
        return;
      }
      
      console.error("Chat error:", error);
      let errorMessage = "Sorry, I encountered an error while processing your message. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          errorMessage = "⚠️ **API Configuration Issue**\n\nThe Groq API key needs to be configured. Please check your settings and try again.";
        } else if (error.message.includes('404') || error.message.includes('model')) {
          errorMessage = "⚠️ **Model Issue**\n\nThe AI model is currently unavailable. Please try again in a moment.";
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = "⚠️ **Rate Limit**\n\nToo many requests. Please wait a moment and try again.";
        } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
          errorMessage = "⚠️ **Connection Issue**\n\nUnable to connect to the AI service. Please check your internet connection and try again.";
        } else if (error.message.includes('Bad request') || error.message.includes('400')) {
          errorMessage = "⚠️ **Request Error**\n\nThere was an issue with the request format. Please try rephrasing your message.";
        } else if (error.message.includes('500') || error.message.includes('server error')) {
          errorMessage = "⚠️ **Server Error**\n\nThe AI service is temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `⚠️ **Unexpected Error**\n\n${error.message}\n\nPlease try again or contact support if the issue persists.`;
        }
      }
      
      addMessage("assistant", errorMessage);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleTextSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to summarize",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addMessage("user", `Summarize this text (${summaryType}): ${inputText.substring(0, 100)}...`);

    try {
      const response = await groqAPI.summarizeContent({
        content: inputText,
        type: summaryType,
        fileType: "text",
      });

      addMessage("assistant", response.summary, summaryType);

      // Save to summaries
      const summary: Summary = {
        id: Date.now().toString(),
        title: `Text Summary - ${summaryType}`,
        content: inputText,
        summary: response.summary,
        summaryType,
        fileType: "text",
        timestamp: new Date(),
      };
      setSummaries(prev => [summary, ...prev]);

      // Save to database
      await saveSummaryToDatabase(summary);

      // Add activity
      addActivity({
        label: `AI summarized text content`,
        icon: Bot,
        tone: "text-indigo-400",
        type: "ai",
        relatedId: summary.id,
        route: "/ai-chat"
      });

      setInputText("");
      toast({
        title: "Success",
        description: "Text summarized successfully!",
      });
    } catch (error) {
      console.error("Summarization error:", error);
      addMessage("assistant", "Sorry, I encountered an error while summarizing the text. Please try again.");
      toast({
        title: "Error",
        description: "Failed to summarize text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteSummarize = async () => {
    if (!selectedNote) {
      toast({
        title: "Error",
        description: "Please select a note to summarize",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const stripHtmlTags = (html: string) => html.replace(/<[^>]+>/g, "");
    const cleanContent = stripHtmlTags(selectedNote.content);
    
    addMessage("user", `Summarize note "${selectedNote.title}" (${summaryType})`);

    try {
      const response = await groqAPI.summarizeContent({
        content: `Title: ${selectedNote.title}\n\nContent: ${cleanContent}`,
        type: summaryType,
        fileType: "text",
      });

      addMessage("assistant", response.summary, summaryType);

      // Save to summaries
      const summary: Summary = {
        id: Date.now().toString(),
        title: `Note: ${selectedNote.title} - ${summaryType}`,
        content: cleanContent,
        summary: response.summary,
        summaryType,
        fileType: "text",
        timestamp: new Date(),
      };
      setSummaries(prev => [summary, ...prev]);

      // Save to database
      await saveSummaryToDatabase(summary);

      // Add activity
      addActivity({
        label: `AI summarized note: ${selectedNote.title}`,
        icon: Bot,
        tone: "text-indigo-400",
        type: "ai",
        relatedId: summary.id,
        route: "/ai-chat"
      });

      setSelectedNote(null);
      setShowNoteSelector(false);
      toast({
        title: "Success",
        description: "Note summarized successfully!",
      });
    } catch (error) {
      console.error("Note summarization error:", error);
      addMessage("assistant", "Sorry, I encountered an error while summarizing the note. Please try again.");
      toast({
        title: "Error",
        description: "Failed to summarize note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleYoutubeSummarize = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addMessage("user", `Summarize YouTube video (${summaryType}): ${youtubeUrl}`);

    try {
      // First get the transcript
      const transcript = await getYouTubeTranscriptSafe(youtubeUrl);
      
      // Guard against very long transcripts
      const MAX_CHARS = 15000; // adjust to your model limits
      const trimmedTranscript = transcript.length > MAX_CHARS
        ? transcript.slice(0, MAX_CHARS)
        : transcript;
      
      // Then summarize it
      const response = await groqAPI.summarizeContent({
        content: trimmedTranscript,
        type: summaryType,
        fileType: "youtube",
      });

      addMessage("assistant", response.summary, summaryType);

      // Save to summaries
      const summary: Summary = {
        id: Date.now().toString(),
        title: `YouTube Summary - ${summaryType}`,
        content: transcript,
        summary: response.summary,
        summaryType,
        fileType: "youtube",
        timestamp: new Date(),
      };
      setSummaries(prev => [summary, ...prev]);

      // Save to database
      await saveSummaryToDatabase(summary);

      // Add activity
      addActivity({
        label: `AI summarized YouTube video`,
        icon: Bot,
        tone: "text-indigo-400",
        type: "ai",
        relatedId: summary.id,
        route: "/ai-chat"
      });

      setYoutubeUrl("");
      toast({
        title: "Success",
        description: "YouTube video summarized successfully!",
      });
    } catch (error) {
      console.error("YouTube summarization error:", error);
      const msg = error instanceof Error ? error.message : "Please check the URL and try again.";
      
      // Provide a demo mode if transcript fetching fails
      if (msg.includes("Transcript is disabled")) {
        addMessage("assistant", `⚠️ **YouTube Transcript Issue**

${msg}

**Demo Mode Available:** Would you like me to show you how the summarization works? You can:

1. **Copy and paste video content** into the text input above
2. **Upload a text file** with content you want summarized
3. **Try the AI chat** for educational assistance

**When transcripts work again:** This feature will automatically extract and summarize YouTube video content. YouTube has recently restricted access to many video transcripts, but educational channels often still work.

**Alternative:** If you have access to the video's transcript or captions, you can copy and paste that text into the "Direct Text Input" field above for summarization.`);
      } else {
        addMessage("assistant", `Sorry, I couldn't fetch or summarize the YouTube video. ${msg}`);
      }
      
      toast({
        title: "Transcript Unavailable",
        description: "Try educational videos or paste transcript text directly",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ["text/plain", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a PDF or TXT file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addMessage("user", `Summarize file (${summaryType}): ${file.name}`);

    try {
      let content = "";
      
      if (file.type === "text/plain") {
        content = await file.text();
      } else if (file.type === "application/pdf") {
        // For PDF files, we would typically use a PDF parsing library
        // For now, we'll show an error message
        throw new Error("PDF processing not implemented yet. Please use text files for now.");
      }

      const response = await groqAPI.summarizeContent({
        content,
        type: summaryType,
        fileType: file.type === "application/pdf" ? "pdf" : "text",
      });

      addMessage("assistant", response.summary, summaryType);

      // Save to summaries
      const summary: Summary = {
        id: Date.now().toString(),
        title: `${file.name} - ${summaryType}`,
        content,
        summary: response.summary,
        summaryType,
        fileType: file.type === "application/pdf" ? "pdf" : "text",
        timestamp: new Date(),
      };
      setSummaries(prev => [summary, ...prev]);

      toast({
        title: "Success",
        description: "File summarized successfully!",
      });
    } catch (error) {
      console.error("File summarization error:", error);
      addMessage("assistant", "Sorry, I encountered an error while processing the file. Please try again.");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getSummaryTypeIcon = (type: "quick" | "detailed" | "bullet") => {
    switch (type) {
      case "quick":
        return <Zap className="h-4 w-4" />;
      case "detailed":
        return <FileCheck className="h-4 w-4" />;
      case "bullet":
        return <List className="h-4 w-4" />;
    }
  };

  const getSummaryTypeColor = (type: "quick" | "detailed" | "bullet") => {
    switch (type) {
      case "quick":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "detailed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
      case "bullet":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col p-2 bg-background overflow-hidden">
      {/* Top Bar with Dropdown */}
      <div className="flex items-center justify-end mb-2 flex-shrink-0 px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-black text-white border-gray-700 hover:bg-gray-900 rounded-lg shadow-lg"
            >
              {activeTab === "chat" && (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  AI Chat
                </>
              )}
              {activeTab === "summarize" && (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Summarize
                </>
              )}
              {activeTab === "history" && (
                <>
                  <History className="h-4 w-4 mr-2" />
                  History
                </>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-black text-white border-gray-700 rounded-lg shadow-xl"
          >
            <DropdownMenuItem 
              onClick={() => setActiveTab("chat")}
              className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              AI Chat
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setActiveTab("summarize")}
              className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Summarize
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setActiveTab("history")}
              className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-hidden">

        {activeTab === "chat" && (
          <div className="h-full overflow-hidden max-w-full mx-auto px-4">
          {/* Modern Chat Interface */}
          <div className="h-[calc(100%-2rem)] flex flex-col bg-background rounded-lg border border-border overflow-hidden shadow-lg">
            {/* Chat Header */}
            <div className="flex items-center justify-start p-4 border-b border-border bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Refyneo AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? "Typing..." : "Online"}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto max-h-full">
                <div className="space-y-4">
                  {messages.filter(msg => !msg.summaryType).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">Start a conversation</h3>
                      <p className="text-muted-foreground mb-6 text-sm">Choose a topic below or ask me anything!</p>
                      
                      {/* Starter Prompts - Compact Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                        {STARTER_PROMPTS.map((prompt, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm bg-card"
                            onClick={() => handleStarterPrompt(prompt.prompt)}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="text-primary">
                                {prompt.icon}
                              </div>
                              <h4 className="font-medium text-sm text-foreground">{prompt.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground text-left">{prompt.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages
                      .filter(msg => !msg.summaryType)
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} mb-4`}
                        >
                          <div className={`flex ${message.type === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-2 max-w-[85%]`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.type === "user" ? "bg-primary ml-2" : "bg-muted mr-2"
                            }`}>
                              {message.type === "user" ? (
                                <div className="w-5 h-5 rounded-full bg-primary-foreground"></div>
                              ) : (
                                <Bot className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            
                            {/* Message Content */}
                            <div className={`rounded-2xl px-4 py-3 relative ${
                              message.type === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted border border-border"
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {message.type === "user" ? (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  ) : (
                                    <AnimatedMessage content={message.content} />
                                  )}
                                </div>
                                {message.type === "assistant" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(message.content)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                  
                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Bot className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3 border border-border">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-muted-foreground">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Chat Input Area */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Ask me anything..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleChatMessage()}
                      disabled={isLoading}
                      className="pr-12 rounded-full border-border focus:border-primary"
                    />
                  </div>
                  {isLoading ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={stopResponse}
                      className="rounded-full border-border"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleChatMessage}
                      disabled={!chatInput.trim()}
                      size="icon"
                      className="rounded-full"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === "summarize" && (
          <div className="h-full overflow-y-auto max-w-full mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6 min-h-full py-4">
            {/* Input Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose how you want your content summarized
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Summary Type</Label>
                    <Select value={summaryType} onValueChange={(v) => setSummaryType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">
                          <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4" />
                            <span>Quick Summary</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="detailed">
                          <div className="flex items-center space-x-2">
                            <FileCheck className="h-4 w-4" />
                            <span>Detailed Breakdown</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bullet">
                          <div className="flex items-center space-x-2">
                            <List className="h-4 w-4" />
                            <span>Bullet Notes</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Input Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Input */}
                  <div>
                    <Label>Direct Text Input</Label>
                    <Textarea
                      placeholder="Paste your text here to summarize..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={handleTextSummarize}
                      disabled={isLoading || !inputText.trim()}
                      className="w-full mt-2"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                      Summarize Text
                    </Button>
                  </div>

                  <Separator />

                  {/* Notes Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Select from Your Notes</Label>
                      <Button
                        onClick={loadNotes}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={() => setShowNoteSelector(!showNoteSelector)}
                        variant="outline"
                        className="w-full justify-between"
                        disabled={isLoading}
                      >
                        <div className="flex items-center">
                          <StickyNote className="h-4 w-4 mr-2" />
                          {selectedNote ? selectedNote.title : "Choose a note to summarize"}
                        </div>
                        {showNoteSelector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      
                      {showNoteSelector && (
                        <div className="border border-border rounded-lg p-3 bg-muted/30 max-h-60 overflow-y-auto">
                          {notes.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No notes found</p>
                              <p className="text-xs">Create some notes first to summarize them here</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {notes.map((note) => {
                                const stripHtmlTags = (html: string) => html.replace(/<[^>]+>/g, "");
                                const preview = stripHtmlTags(note.content).slice(0, 100);
                                return (
                                  <div
                                    key={note.id}
                                    className={`p-3 rounded-md border cursor-pointer transition-all hover:bg-accent/50 ${
                                      selectedNote?.id === note.id 
                                        ? "border-primary bg-primary/10" 
                                        : "border-border"
                                    }`}
                                    onClick={() => {
                                      setSelectedNote(note);
                                      setShowNoteSelector(false);
                                    }}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">
                                          {note.title || "Untitled Note"}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                          {preview}...
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          {note.category && (
                                            <Badge variant="secondary" className="text-xs px-2 py-0">
                                              {note.category}
                                            </Badge>
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      {selectedNote?.id === note.id && (
                                        <Eye className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedNote && (
                        <Button
                          onClick={handleNoteSummarize}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <StickyNote className="h-4 w-4 mr-2" />}
                          Summarize Selected Note
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* YouTube URL */}
                  <div>
                    <Label>YouTube URL</Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 <strong>Tip:</strong> Educational videos, tutorials, and news content typically have working captions. Music videos and older content often have disabled transcripts.
                    </p>
                    <Button
                      onClick={handleYoutubeSummarize}
                      disabled={isLoading || !youtubeUrl.trim()}
                      className="w-full mt-2"
                      variant="outline"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Youtube className="h-4 w-4 mr-2" />}
                      Summarize Video
                    </Button>
                  </div>

                  <Separator />

                  {/* File Upload */}
                  <div>
                    <Label>File Upload</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF/TXT File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>Summarization Results</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    AI-generated summaries will appear here
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 pr-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.filter(msg => msg.summaryType).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Upload a document, paste text, or share a YouTube link to get started</p>
                        </div>
                      ) : (
                        messages
                          .filter(msg => msg.summaryType) // Only show summary messages
                          .map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[90%] p-4 rounded-lg ${
                                  message.type === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted border border-border"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {message.type === "user" ? (
                                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    ) : (
                                      <AnimatedMessage content={message.content} />
                                    )}
                                    {message.summaryType && message.type === "assistant" && (
                                      <Badge className={`mt-3 ${getSummaryTypeColor(message.summaryType)}`}>
                                        {getSummaryTypeIcon(message.summaryType)}
                                        <span className="ml-1 capitalize">{message.summaryType}</span>
                                      </Badge>
                                    )}
                                  </div>
                                  {message.type === "assistant" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 ml-2 flex-shrink-0"
                                      onClick={() => copyToClipboard(message.content)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">AI is processing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="h-full overflow-y-auto max-w-full mx-auto px-4 py-4">
          <Card className="min-h-full flex flex-col">
            <CardHeader>
              <CardTitle>Summary History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {summaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No summaries yet. Create your first summary to see it here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {summaries.map((summary) => (
                    <Card key={summary.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{summary.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {summary.timestamp.toLocaleDateString()} at {summary.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSummaryTypeColor(summary.summaryType)}>
                              {getSummaryTypeIcon(summary.summaryType)}
                              <span className="ml-1 capitalize">{summary.summaryType}</span>
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(summary.summary)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-muted p-4 rounded-lg border border-border">
                          <AnimatedMessage content={summary.summary} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import NoteEditor from "@/components/NoteEditor";
import { 
  StickyNote,
  Plus, 
  Search, 
  Pin, 
  Edit3, 
  Trash2, 
  BookOpen,
  MoreHorizontal,
  Grid3X3,
  List,
  FileText,
  Clock,
  History,
  Eye,
  Upload,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note, InsertNote, Class } from "../../shared/schema";
import { useAuth } from "@/contexts/AuthContext";

const noteCategories = [
  "general",
  "lecture", 
  "homework",
  "study",
  "meeting",
  "ideas",
  "research",
  "project"
];

export default function NotesPage() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [currentView, setCurrentView] = useState<"notes" | "history">("notes");
  
  // AI Note Creation State
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiInputType, setAiInputType] = useState<"text" | "document">("text");
  const [aiInputText, setAiInputText] = useState("");
  const [uploadedDocument, setUploadedDocument] = useState<{
    jobId: string;
    fileName: string;
    status: "uploading" | "processing" | "ready" | "error";
    content?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Only load data when user is authenticated and not loading
    if (!loading && user) {
      console.log(' User authenticated, loading notes and classes...');
      loadNotes();
      loadClasses();
    } else if (!loading && !user) {
      console.warn(' User not authenticated, cannot load notes');
    }
  }, [loading, user]);

  const loadNotes = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      console.log(' Loading notes...');
      const response = await apiGet("/api/notes");
      console.log(' Load notes response status:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log(' Loaded notes data:', data.length, 'notes');
        setNotes(Array.isArray(data) ? data : []);
        console.log(' Loaded notes:', data.length);
      } else {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }
    } catch (error) {
      console.error(' Load notes error:', error);
      toast({
        title: "Error",
        description: `Failed to load notes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setNotes([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const loadClasses = async () => {
    try {
      const response = await apiGet("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(Array.isArray(data) ? data : []);
      } else {
        // ignore error toast for classes
      }
    } catch {
      setClasses([]);
    }
  };

  const handleSaveNote = async (noteData: Partial<InsertNote>) => {
    try {
      console.log(' Saving note:', noteData);
      const response = editingNote?.id 
        ? await apiPut(`/api/notes/${editingNote.id}`, noteData)
        : await apiPost("/api/notes", noteData);
      
      console.log(' Save response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const savedNote = await response.json();
      console.log(' Saved note:', savedNote);
      
      // Force refresh the notes list to ensure we have the latest data
      console.log(' Refreshing notes list...');
      await loadNotes(false);
      console.log(' Notes list refreshed');
      
      toast({
        title: "Success",
        description: `Note ${editingNote?.id ? "updated" : "created"} successfully`,
      });
      return savedNote;
    } catch (error) {
      console.error(' Save error:', error);
      toast({
        title: "Error",
        description: `Failed to save note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      const response = await apiDelete(`/api/notes/${noteId}`);
      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        toast({
          title: "Note Deleted",
          description: "Your note has been permanently deleted.",
        });
      } else {
        throw new Error("Failed to delete note");
      }
    } catch {
      toast({
        title: "Delete Failed",
        description: "Could not delete the note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const response = await apiPut(`/api/notes/${note.id}`, { 
        ...note, 
        isPinned: !note.isPinned,
        classId: note.classId || undefined 
      });
      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
      }
    } catch {
      // ignore error
    }
  };

  const openEditor = (note?: Note) => {
    setEditingNote(note || null);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]+>/g, "");
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return null;
    return classes.find(c => c.id === classId)?.name;
  };

  // AI Note Creation Functions
  const handleDocumentUpload = async (file: File) => {
    setUploadedDocument({
      jobId: "",
      fileName: file.name,
      status: "uploading",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/document-intel/sessions", {
        method: "POST",
        headers: {
          "x-user-id": user?.uid || "anonymous",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      setUploadedDocument({
        jobId: data.jobId,
        fileName: file.name,
        status: "processing",
      });

      // Poll for document content
      pollDocumentContent(data.jobId);
    } catch (error) {
      console.error("Document upload error:", error);
      setUploadedDocument({
        jobId: "",
        fileName: file.name,
        status: "error",
      });
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pollDocumentContent = async (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setUploadedDocument(prev => prev ? { ...prev, status: "error" } : null);
        toast({
          title: "Processing Timeout",
          description: "Document processing took too long. Please try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await fetch(`/api/document-intel/sessions/${jobId}/content`, {
          headers: {
            "x-user-id": user?.uid || "anonymous",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.content) {
            setUploadedDocument(prev => prev ? {
              ...prev,
              status: "ready",
              content: data.content,
            } : null);
            toast({
              title: "Document Ready",
              description: "Document processed successfully!",
            });
            return;
          }
        }

        attempts++;
        setTimeout(poll, 2000);
      } catch (error) {
        console.error("Polling error:", error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const generateAiNote = async () => {
    if (!aiInputText && !uploadedDocument?.content) {
      toast({
        title: "No Content",
        description: "Please provide text or upload a document first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const content = aiInputType === "text" ? aiInputText : uploadedDocument?.content || "";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that creates well-structured study notes. 
              Given content, create organized notes with:
              1. A clear, descriptive title
              2. Well-formatted content with headings, bullet points, and key information
              3. Important concepts highlighted
              4. Suggested category from: ${noteCategories.join(", ")}
              5. Relevant tags (3-5 keywords)
              
              Format your response as JSON:
              {
                "title": "Note title",
                "content": "HTML formatted content with <h2>, <p>, <ul>, <li>, <strong> tags",
                "category": "one of the categories",
                "tags": ["tag1", "tag2", "tag3"]
              }`,
            },
            {
              role: "user",
              content: `Create study notes from this content:\n\n${content}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate note");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse JSON response
      const noteData = JSON.parse(aiResponse);

      // Save the generated note
      await handleSaveNote({
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        tags: noteData.tags,
        isPinned: false,
      });

      // Close AI dialog and reset state
      setShowAiDialog(false);
      setAiInputText("");
      setUploadedDocument(null);
      setAiInputType("text");

      toast({
        title: "Note Created!",
        description: "AI-generated note has been saved successfully.",
      });
    } catch (error) {
      console.error("AI generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const matchesSearch =
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (note.tags && note.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesCategory = selectedCategory === "all" || note.category === selectedCategory;
        const matchesClass = selectedClass === "all" || note.classId === selectedClass;
        return matchesSearch && matchesCategory && matchesClass;
      }),
    [notes, searchTerm, selectedCategory, selectedClass]
  );
  const pinnedNotes = useMemo(() => filteredNotes.filter(note => note.isPinned), [filteredNotes]);
  const regularNotes = useMemo(() => filteredNotes.filter(note => !note.isPinned), [filteredNotes]);

  if (showEditor) {
    return (
      <NoteEditor
        note={editingNote || undefined}
        onSave={handleSaveNote}
        onClose={closeEditor}
        classes={classes}
      />
    );
  }

  // AI Note Creation Dialog Component
  const AiNoteDialog = () => (
    <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Note with AI
          </DialogTitle>
          <DialogDescription>
            Choose how you want to create your note - type in content or upload a document for AI to extract key information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">How would you like to create your note?</Label>
            <RadioGroup value={aiInputType} onValueChange={(value: "text" | "document") => setAiInputType(value)}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Type or Paste Content</div>
                    <div className="text-xs text-muted-foreground">Enter text for AI to format as notes</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="document" id="document" />
                <Label htmlFor="document" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Upload className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Upload Document</div>
                    <div className="text-xs text-muted-foreground">PDF, PPTX, or XLSX (AI will extract content)</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Text Input */}
          {aiInputType === "text" && (
            <div className="space-y-2">
              <Label htmlFor="ai-text">Enter Content</Label>
              <Textarea
                id="ai-text"
                placeholder="Paste lecture notes, article content, or any text you want to convert into structured notes..."
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          )}

          {/* Document Upload */}
          {aiInputType === "document" && (
            <div className="space-y-3">
              <Label>Upload Document</Label>
              
              {!uploadedDocument ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PDF, PPTX, XLSX (Max 10MB)
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.pptx,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(file);
                    }}
                    className="hidden"
                    id="document-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("document-upload")?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{uploadedDocument.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {uploadedDocument.status === "uploading" && "Uploading..."}
                          {uploadedDocument.status === "processing" && "Processing document..."}
                          {uploadedDocument.status === "ready" && "Ready to generate notes"}
                          {uploadedDocument.status === "error" && "Upload failed"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedDocument(null)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {uploadedDocument.status === "processing" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extracting content from document...
                    </div>
                  )}
                  
                  {uploadedDocument.status === "ready" && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Document processed successfully
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAiDialog(false);
                setAiInputText("");
                setUploadedDocument(null);
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={generateAiNote}
              disabled={
                isGenerating ||
                (aiInputType === "text" && !aiInputText.trim()) ||
                (aiInputType === "document" && uploadedDocument?.status !== "ready")
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Note
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const NoteCard = ({ note }: { note: Note }) => (
    <Card 
      className="group border border-border/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 cursor-pointer relative bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm hover:from-card/80 hover:to-card/60 hover:scale-[1.02] overflow-hidden"
      onClick={() => openEditor(note)}
    >
      {/* Header with better spacing and visual hierarchy */}
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title with pin indicator */}
            <div className="flex items-start gap-2">
              {note.isPinned && (
                <div className="flex-shrink-0 mt-1">
                  <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
              )}
              <h3 className="font-bold text-foreground text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {note.title || "Untitled Note"}
              </h3>
            </div>
            
            {/* Category and class badges with better styling */}
            <div className="flex items-center flex-wrap gap-2">
              {note.category && (
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/20 rounded-full shadow-sm"
                >
                  {note.category}
                </Badge>
              )}
              {getClassName(note.classId) && (
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium px-3 py-1.5 border-border/60 bg-muted/30 text-muted-foreground rounded-full hover:bg-muted/50 transition-colors"
                >
                  <BookOpen className="h-3 w-3 mr-1.5 flex-shrink-0" />
                  {getClassName(note.classId)}
                </Badge>
              )}
            </div>
          </div>         
          
          {/* Action menu with better visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent/60 text-muted-foreground hover:text-foreground h-9 w-9 p-0 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover/95 backdrop-blur-sm border-border/50 shadow-xl" align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditor(note);
                }}
                className="hover:bg-accent/50 focus:bg-accent/50 cursor-pointer"
              >
                <Edit3 className="h-4 w-4 mr-3" />
                Edit Note
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePin(note);
                }}
                className="hover:bg-accent/50 focus:bg-accent/50 cursor-pointer"
              >
                <Pin className="h-4 w-4 mr-3" />
                {note.isPinned ? "Unpin Note" : "Pin Note"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNote(note.id);
                }}
                className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {/* Content with better spacing and typography */}
      <CardContent className="px-6 pb-6 pt-0">
        <div className="space-y-4">
          {/* Content preview with better styling */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
            {stripHtmlTags(note.content) || "No content available..."}
          </p>
          
          {/* Metadata section with improved visual design */}
          <div className="pt-4 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {stripHtmlTags(note.content).split(' ').filter(word => word.length > 0).length} words
                  </span>
                </div>
              </div>
              <div className="font-semibold text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                {new Date(note.updatedAt || note.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if user is not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <StickyNote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access your notes.</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* AI Note Creation Dialog */}
      <AiNoteDialog />
      
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Gentle Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Your Notes
          </h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
          </p>
        </div>

        {/* Simple Actions */}
        <div className="flex gap-3 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="text-sm">
                <Plus className="mr-1 h-3 w-3" />
                New Note
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setShowAiDialog(true)} className="cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Create with AI</div>
                  <div className="text-xs text-muted-foreground">Generate from text or document</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditor()} className="cursor-pointer">
                <Edit3 className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Manual Entry</div>
                  <div className="text-xs text-muted-foreground">Write your own note</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Simple Navigation */}
          <div className="flex gap-2">
            <Button
              variant={currentView === "notes" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("notes")}
              className="text-xs"
            >
              Notes
            </Button>
            <Button
              variant={currentView === "history" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("history")}
              className="text-xs"
            >
              History
            </Button>
          </div>
        </div>
        {/* Content Based on Current View */}
        {currentView === "notes" && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-background/60 border-border/50 text-foreground placeholder:text-muted-foreground h-12 text-base rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-44 bg-background/60 border-border/50 text-foreground h-12 rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                    <SelectItem value="all" className="text-foreground hover:bg-accent/50">All Categories</SelectItem>
                    {noteCategories.filter((category) => category && category.trim() !== "").map((category) => (
                      <SelectItem key={category} value={category} className="text-foreground hover:bg-accent/50">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-44 bg-background/60 border-border/50 text-foreground h-12 rounded-xl">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                    <SelectItem value="all" className="text-foreground hover:bg-accent/50">All Classes</SelectItem>
                    {classes.filter((cls) => cls.id && cls.id.trim() !== "").map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="text-foreground hover:bg-accent/50">
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center bg-muted/50 rounded-xl border border-border/50 p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`h-10 w-10 p-0 rounded-lg transition-all duration-200 ${
                      viewMode === "grid" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`h-10 w-10 p-0 rounded-lg transition-all duration-200 ${
                      viewMode === "list" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Notes Content */}
            {isLoading ? (
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="border border-border/40 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3 px-6 pt-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-muted/50 rounded-lg animate-pulse"></div>
                        <div className="flex gap-2">
                          <div className="h-6 w-20 bg-muted/50 rounded-full animate-pulse"></div>
                          <div className="h-6 w-24 bg-muted/50 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="h-3 bg-muted/50 rounded animate-pulse"></div>
                          <div className="h-3 bg-muted/50 rounded animate-pulse"></div>
                          <div className="h-3 w-3/4 bg-muted/50 rounded animate-pulse"></div>
                        </div>
                        <div className="pt-4 border-t border-border/40">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                              <div className="h-6 w-20 bg-muted/50 rounded-md animate-pulse"></div>
                              <div className="h-6 w-16 bg-muted/50 rounded-md animate-pulse"></div>
                            </div>
                            <div className="h-6 w-12 bg-muted/50 rounded-md animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="p-6 rounded-3xl bg-primary/5 mb-6">
                  <StickyNote className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">
                  {searchTerm || selectedCategory !== "all" || selectedClass !== "all" 
                    ? "No notes found" 
                    : "Ready to capture your first note?"
                  }
                </h3>
                <p className="text-muted-foreground text-lg mb-8 text-center max-w-md">
                  {searchTerm || selectedCategory !== "all" || selectedClass !== "all"
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Start organizing your thoughts, ideas, and knowledge in one beautiful place."
                  }
                </p>
                <Button 
                  onClick={() => openEditor()} 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Note
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pinned Notes */}
                {pinnedNotes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Pin className="h-5 w-5 text-amber-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Pinned Notes
                      </h2>
                      <div className="flex-1 h-px bg-border/50"></div>
                    </div>
                    <div className={`grid gap-8 ${
                      viewMode === "grid" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" 
                        : "grid-cols-1 max-w-4xl"
                    }`}>
                      {pinnedNotes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Regular Notes */}
                {regularNotes.length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">
                          All Notes
                        </h2>
                        <div className="flex-1 h-px bg-border/50"></div>
                      </div>
                    )}
                    <div className={`grid gap-8 ${
                      viewMode === "grid" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" 
                        : "grid-cols-1 max-w-4xl"
                    }`}>
                      {regularNotes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* History View */}
        {currentView === "history" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-muted/50">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Recent Activity
              </h2>
              <div className="flex-1 h-px bg-border/50"></div>
            </div>
            <div className="grid gap-6 grid-cols-1 max-w-4xl">
              {[...notes]
                .sort((a, b) =>
                  new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
                )
                .slice(0, 10)
                .map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

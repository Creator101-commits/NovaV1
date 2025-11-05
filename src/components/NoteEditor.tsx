import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Save,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Pin,
  PinOff,
  Undo,
  Redo,
  Printer,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileText,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Copy,
  Check
} from "lucide-react";
import { createEditor, Descendant, Editor, BaseEditor, Transforms, Element as SlateElement, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import DOMPurify from 'dompurify';
import type { Note, InsertNote, Class } from "../../shared/schema";
import { groqAPI } from "@/lib/groq";

// Custom types for Slate
type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'block-quote';
  children: Descendant[];
  align?: 'left' | 'center' | 'right' | 'justify';
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const noteColors = [
  { name: "Black", value: "#000000", class: "bg-black text-white" },
  { name: "Dark Gray", value: "#1a1a1a", class: "bg-gray-900 text-gray-100" },
  { name: "Dark Blue", value: "#1e293b", class: "bg-slate-800 text-slate-100" },
  { name: "Dark Green", value: "#14532d", class: "bg-green-900 text-green-100" },
  { name: "Dark Purple", value: "#581c87", class: "bg-purple-900 text-purple-100" },
  { name: "Dark Red", value: "#7f1d1d", class: "bg-red-900 text-red-100" },
];

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

// Slate helper functions
const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const isBlockActive = (editor: Editor, format: CustomElement['type']) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === format,
    })
  );

  return !!match;
};

const toggleMark = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['numbered-list', 'bulleted-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && 
      ['numbered-list', 'bulleted-list'].includes((n as CustomElement).type),
    split: true,
  });

  const newProperties: Partial<CustomElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block: CustomElement = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleAlignment = (editor: Editor, alignment: CustomElement['align']) => {
  const { selection } = editor;
  if (!selection) return;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n),
    })
  );

  if (match) {
    const [node] = match;
    const currentAlign = (node as CustomElement).align;
    const newAlign = currentAlign === alignment ? undefined : alignment;
    
    Transforms.setNodes<SlateElement>(editor, { align: newAlign });
  }
};

const isAlignmentActive = (editor: Editor, alignment: CustomElement['align']) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).align === alignment,
    })
  );

  return !!match;
};

const undo = (editor: Editor) => {
  // Use Slate's built-in undo functionality
  (editor as any).undo();
};

const redo = (editor: Editor) => {
  // Use Slate's built-in redo functionality
  (editor as any).redo();
};

const canUndo = (editor: Editor) => {
  return (editor as any).history?.undos?.length > 0;
};

const canRedo = (editor: Editor) => {
  return (editor as any).history?.redos?.length > 0;
};

// Serialize Slate value to HTML
const serializeToHtml = (nodes: Descendant[]): string => {
  return nodes.map(n => {
    if (Text.isText(n)) {
      let text = n.text;
      if ((n as CustomText).bold) text = `<strong>${text}</strong>`;
      if ((n as CustomText).italic) text = `<em>${text}</em>`;
      if ((n as CustomText).underline) text = `<u>${text}</u>`;
      return text;
    }

    const element = n as CustomElement;
    const children = serializeToHtml(element.children);
    const alignStyle = element.align ? ` style="text-align: ${element.align}"` : '';
    
    switch (element.type) {
      case 'heading-one':
        return `<h1${alignStyle}>${children}</h1>`;
      case 'heading-two':
        return `<h2${alignStyle}>${children}</h2>`;
      case 'heading-three':
        return `<h3${alignStyle}>${children}</h3>`;
      case 'block-quote':
        return `<blockquote${alignStyle}>${children}</blockquote>`;
      case 'bulleted-list':
        return `<ul${alignStyle}>${children}</ul>`;
      case 'numbered-list':
        return `<ol${alignStyle}>${children}</ol>`;
      case 'list-item':
        return `<li${alignStyle}>${children}</li>`;
      default:
        return `<p${alignStyle}>${children}</p>`;
    }
  }).join('');
};

// Deserialize HTML to Slate value
const deserializeFromHtml = (html: string): Descendant[] => {
  if (!html) return [{ type: 'paragraph', children: [{ text: '' } as CustomText] } as CustomElement];
  
  const sanitizedHtml = DOMPurify.sanitize(html);
  const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
  
  const deserializeElement = (el: Node): Descendant[] => {
    if (el.nodeType === Node.TEXT_NODE) {
      return [{ text: el.textContent || '' } as CustomText];
    }

    if (el.nodeType !== Node.ELEMENT_NODE) {
      return [];
    }

    const element = el as Element;
    const children = Array.from(element.childNodes).flatMap(deserializeElement);

    switch (element.nodeName.toLowerCase()) {
      case 'h1':
        return [{ type: 'heading-one', children } as CustomElement];
      case 'h2':
        return [{ type: 'heading-two', children } as CustomElement];
      case 'h3':
        return [{ type: 'heading-three', children } as CustomElement];
      case 'blockquote':
        return [{ type: 'block-quote', children } as CustomElement];
      case 'ul':
        return [{ type: 'bulleted-list', children } as CustomElement];
      case 'ol':
        return [{ type: 'numbered-list', children } as CustomElement];
      case 'li':
        return [{ type: 'list-item', children } as CustomElement];
      case 'strong':
        return children.map(child => Text.isText(child) ? { ...child, bold: true } as CustomText : child);
      case 'em':
        return children.map(child => Text.isText(child) ? { ...child, italic: true } as CustomText : child);
      case 'u':
        return children.map(child => Text.isText(child) ? { ...child, underline: true } as CustomText : child);
      default:
        return children.length > 0 ? [{ type: 'paragraph', children } as CustomElement] : [{ type: 'paragraph', children: [{ text: '' } as CustomText] } as CustomElement];
    }
  };

  const result = Array.from(doc.body.childNodes).flatMap(deserializeElement);
  return result.length > 0 ? result : [{ type: 'paragraph', children: [{ text: '' } as CustomText] } as CustomElement];
};

interface NoteEditorProps {
  note?: Note;
  onSave: (noteData: Partial<InsertNote>) => Promise<void>;
  onClose: () => void;
  classes: Class[];
}

export default function NoteEditor({ note, onSave, onClose, classes }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [category, setCategory] = useState(note?.category || "general");
  const [classId, setClassId] = useState(note?.classId ? note.classId : "none");
  const [color, setColor] = useState(note?.color || "#000000");
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [zoom, setZoom] = useState("100%");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(11);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ 
    role: 'user' | 'assistant', 
    content: string,
    changes?: {
      added: number,
      removed: number,
      preview: string,
      newContent: Descendant[]
    }
  }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const tags = note?.tags || [];
  
  const { toast } = useToast();

  // Initialize Slate editor
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(() => 
    deserializeFromHtml(note?.content || '')
  );

  // Auto-save functionality
  useEffect(() => {
    // Don't auto-save if there's no meaningful content or if this is a new note
    const hasContent = title.trim() || value.some(n => {
      if (Text.isText(n)) {
        return n.text.trim();
      }
      return (n as CustomElement).children.some(c => Text.isText(c) && c.text.trim());
    });

    // Don't auto-save for new notes (without an ID) or if there's no content
    if (!hasContent || !note?.id) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save every 3 seconds for continuous saving

    return () => clearTimeout(autoSaveTimer);
  }, [title, value, category, classId, color, isPinned, note?.id]);

  const handleAutoSave = async () => {
    // Only auto-save existing notes, not new ones
    if (!note?.id) return;
    
    const htmlContent = serializeToHtml(value);
    const sanitizedContent = DOMPurify.sanitize(htmlContent);
    
    // Only auto-save if there's meaningful content
    if (!title.trim() && !sanitizedContent.replace(/<[^>]*>/g, '').trim()) return;
    
    try {
      // Don't set isSaving to true for auto-save to avoid UI disruption
      await onSave({
        title: title || "Untitled Note",
        content: sanitizedContent,
        category,
        classId: classId === "none" ? undefined : classId,
        color,
        isPinned,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Silently fail for auto-save to avoid disrupting user experience
    }
  };

  const handleManualSave = async () => {
    const htmlContent = serializeToHtml(value);
    const sanitizedContent = DOMPurify.sanitize(htmlContent);
    
    try {
      setIsSaving(true);
      await onSave({
        title: title || "Untitled Note",
        content: sanitizedContent,
        category,
        classId: classId === "none" ? undefined : classId,
        color,
        isPinned,
      });
      setLastSaved(new Date());
      toast({
        title: "Success",
        description: "Note saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiChat = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      // Get current note content for context
      const currentContent = serializeToHtml(value);
      const plainTextContent = currentContent.replace(/<[^>]*>/g, '').trim();
      const wordCount = plainTextContent.split(/\s+/).filter(w => w.length > 0).length;

      // Advanced command detection with patterns
      const commandPatterns = {
        edit: /\b(edit|change|fix|correct|revise|modify|adjust|alter|update|rewrite)\b/i,
        expand: /\b(expand|elaborate|detail|explain more|add more|develop|extend)\b/i,
        summarize: /\b(summarize|summary|tldr|brief|condense|shorten|key points)\b/i,
        outline: /\b(outline|structure|organize|format|layout)\b/i,
        grammar: /\b(grammar|spelling|punctuation|typo|error|mistake)\b/i,
        style: /\b(style|tone|voice|rephrase|reword|professional|casual|academic)\b/i,
        explain: /\b(explain|clarify|what does|what is|define|meaning of)\b/i,
        example: /\b(example|instance|case|scenario|demonstrate)\b/i,
        questions: /\b(questions|quiz|test|study questions|review questions)\b/i,
        citations: /\b(cite|citation|reference|source|bibliography)\b/i,
        translate: /\b(translate|convert to|in spanish|in french|in german)\b/i,
        critique: /\b(critique|analyze|evaluate|assess|review|feedback)\b/i,
      };

      // Detect command type
      let commandType = 'general';
      for (const [type, pattern] of Object.entries(commandPatterns)) {
        if (pattern.test(userMessage)) {
          commandType = type;
          break;
        }
      }

      // Build enhanced context-aware system message
      let systemContext = `You are an advanced AI academic assistant with expertise in education, writing, and research. You help students create exceptional notes by providing intelligent assistance.

**Your Capabilities:**
- Write, expand, and improve content with academic rigor
- Analyze and summarize information effectively  
- Check grammar, style, and clarity
- Generate study questions and quizzes
- Provide examples and explanations
- Suggest citations and references
- Create structured outlines
- Offer constructive feedback

**Current Context:**`;
      
      if (title) {
        systemContext += `\n- Note Title: "${title}"`;
      }
      
      if (category !== 'general') {
        systemContext += `\n- Category: ${category}`;
      }

      if (tags && tags.length > 0) {
        systemContext += `\n- Tags: ${tags.join(', ')}`;
      }

      if (plainTextContent) {
        systemContext += `\n- Word Count: ${wordCount} words`;
        systemContext += `\n- Current Content:\n${plainTextContent.substring(0, 1500)}${plainTextContent.length > 1500 ? '...' : ''}`;
      }

      // Command-specific instructions
      const commandInstructions = {
        edit: `\n\n**Task: EDIT CONTENT**
Improve the existing note by:
- Fixing any errors (grammar, spelling, facts)
- Enhancing clarity and readability
- Improving structure and flow
- Adding transitional phrases
- Removing redundancies
Provide the COMPLETE revised version.`,
        
        expand: `\n\n**Task: EXPAND CONTENT**
Add substantial depth by:
- Providing more detailed explanations
- Including relevant examples
- Adding supporting evidence
- Elaborating on key concepts
- Including additional context
Maintain the existing structure while enriching it.`,
        
        summarize: `\n\n**Task: SUMMARIZE CONTENT**
Create a concise summary with:
- Main ideas and key points (bullet points)
- Essential concepts only
- Clear and direct language
- Logical flow
- 30-40% of original length`,
        
        outline: `\n\n**Task: CREATE OUTLINE**
Organize the content with:
- Clear hierarchical structure
- Main topics and subtopics
- Logical progression
- Brief descriptions
- Easy-to-scan format`,
        
        grammar: `\n\n**Task: GRAMMAR & SPELLING CHECK**
Review and correct:
- Grammar errors
- Spelling mistakes
- Punctuation issues
- Sentence structure
- Word choice
Provide the corrected version with explanations.`,
        
        style: `\n\n**Task: STYLE IMPROVEMENT**
Enhance writing style by:
- Adjusting tone appropriately
- Improving word choice
- Varying sentence structure
- Enhancing clarity
- Making it more engaging`,
        
        explain: `\n\n**Task: EXPLAIN CONCEPT**
Provide clear explanation with:
- Simple, accessible language
- Step-by-step breakdown
- Relevant analogies
- Practical examples
- Key takeaways`,
        
        example: `\n\n**Task: PROVIDE EXAMPLES**
Give concrete examples that:
- Illustrate the concept clearly
- Are relatable and practical
- Cover different scenarios
- Include explanations
- Aid understanding`,
        
        questions: `\n\n**Task: GENERATE STUDY QUESTIONS**
Create 5-10 study questions:
- Mix of difficulty levels (easy, medium, hard)
- Different question types (multiple choice, short answer, essay)
- Cover main concepts
- Promote critical thinking
- Include answer guidelines`,
        
        citations: `\n\n**Task: CITATION SUGGESTIONS**
Suggest how to cite:
- Key claims that need sources
- Facts and statistics
- Theories and concepts
- Recommend source types
- Provide citation format examples (APA/MLA)`,
        
        translate: `\n\n**Task: TRANSLATE CONTENT**
Translate accurately while:
- Maintaining meaning and context
- Preserving formatting
- Using appropriate terminology
- Keeping academic tone
- Noting any cultural adaptations`,
        
        critique: `\n\n**Task: CRITIQUE & FEEDBACK**
Provide constructive analysis:
- Strengths of the content
- Areas for improvement
- Clarity and organization
- Depth and accuracy
- Specific suggestions
- Overall assessment`,
        
        general: `\n\n**Task: GENERAL ASSISTANCE**
Help with the request by:
- Understanding the intent clearly
- Providing relevant, useful content
- Using appropriate formatting
- Being clear and concise
- Maintaining academic quality`
      };

      systemContext += commandInstructions[commandType as keyof typeof commandInstructions] || commandInstructions.general;

      systemContext += `\n\n**Formatting Guidelines:**
- Use clear paragraphs for readability
- Use headings (# ## ###) to structure information
- Use bullet points (-) for lists
- Keep sentences clear and concise
- Avoid markdown formatting symbols like ** or * in the final output
- Focus on content quality and clarity`;

      // Use Groq API for chat with enhanced settings
      const response = await groqAPI.chat({
        messages: [
          {
            role: 'system',
            content: systemContext
          },
          ...aiMessages.filter(msg => !msg.changes).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ],
        maxTokens: 3000,
        temperature: commandType === 'grammar' ? 0.3 : commandType === 'creative' ? 0.9 : 0.7,
      });

      // Check if this is an edit-type command
      const isEditRequest = ['edit', 'grammar', 'style', 'critique'].includes(commandType);

      // If this is an edit request and we have existing content, calculate the diff
      if (isEditRequest && plainTextContent) {
        const oldLines = plainTextContent.split('\n').filter(l => l.trim());
        const newLines = response.content.split('\n').filter(l => l.trim());
        
        const added = newLines.length - oldLines.length;
        const removed = added < 0 ? Math.abs(added) : 0;
        const actualAdded = added > 0 ? added : 0;

        // Convert new content to Slate format
        const newSlateContent = convertTextToSlate(response.content);

        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.content,
          changes: {
            added: actualAdded,
            removed: removed,
            preview: response.content.substring(0, 200) + (response.content.length > 200 ? '...' : ''),
            newContent: newSlateContent
          }
        }]);
        
        toast({
          title: "Changes proposed",
          description: `+${actualAdded} lines, -${removed} lines`,
        });
      } else {
        // Regular response without diff
        setAiMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
        
        toast({
          title: "Response received",
          description: "Content ready to insert",
        });
      }
    } catch (error) {
      console.error('AI chat error:', error);
      
      let errorMessage = "Failed to get AI response. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = "AI service not configured. Please check settings.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "Too many requests. Please wait a moment.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper function to clean markdown symbols from text
  const cleanMarkdownSymbols = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold **text**
      .replace(/\*(.+?)\*/g, '$1')      // Remove italic *text*
      .replace(/_(.+?)_/g, '$1')        // Remove italic _text_
      .replace(/`(.+?)`/g, '$1')        // Remove inline code `text`
      .replace(/~~(.+?)~~/g, '$1')      // Remove strikethrough ~~text~~
      .trim();
  };

  const convertTextToSlate = (text: string): Descendant[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const nodes: Descendant[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Check if line looks like a heading
      if (trimmed.startsWith('# ')) {
        const cleanText = cleanMarkdownSymbols(trimmed.replace('# ', ''));
        nodes.push({
          type: 'heading-one',
          children: [{ text: cleanText }]
        } as CustomElement);
      } else if (trimmed.startsWith('## ')) {
        const cleanText = cleanMarkdownSymbols(trimmed.replace('## ', ''));
        nodes.push({
          type: 'heading-two',
          children: [{ text: cleanText }]
        } as CustomElement);
      } else if (trimmed.startsWith('### ')) {
        const cleanText = cleanMarkdownSymbols(trimmed.replace('### ', ''));
        nodes.push({
          type: 'heading-three',
          children: [{ text: cleanText }]
        } as CustomElement);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const cleanText = cleanMarkdownSymbols(trimmed.replace(/^[-•]\s*/, ''));
        nodes.push({
          type: 'list-item',
          children: [{ text: cleanText }]
        } as CustomElement);
      } else {
        const cleanText = cleanMarkdownSymbols(trimmed);
        nodes.push({
          type: 'paragraph',
          children: [{ text: cleanText }]
        } as CustomElement);
      }
    });

    return nodes.length > 0 ? nodes : [{ type: 'paragraph', children: [{ text: '' }] } as CustomElement];
  };

  const acceptChanges = (newContent: Descendant[]) => {
    // Clean the content before setting it
    const cleanedContent = newContent.map(node => {
      if ('children' in node && Array.isArray(node.children)) {
        return {
          ...node,
          children: node.children.map((child: any) => {
            if ('text' in child) {
              return {
                ...child,
                text: child.text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '')
              };
            }
            return child;
          })
        };
      }
      return node;
    });
    
    setValue(cleanedContent as Descendant[]);
    toast({
      title: "Changes accepted",
      description: "Your note has been updated",
    });
  };

  const rejectChanges = () => {
    toast({
      title: "Changes rejected",
      description: "Original content preserved",
    });
  };

  const insertAiContentIntoNote = (content: string) => {
    try {
      // Move cursor to the end of the document
      Transforms.select(editor, {
        anchor: Editor.end(editor, []),
        focus: Editor.end(editor, [])
      });

      // Add a blank line before inserting new content
      Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [{ text: '' }]
      } as CustomElement);

      // Split content into lines and insert each as a paragraph with cleaned text
      const lines = content.split('\n').filter(line => line.trim());
      
      lines.forEach((line) => {
        // Check if line looks like a heading
        if (line.startsWith('# ')) {
          const cleanText = cleanMarkdownSymbols(line.replace('# ', ''));
          Transforms.insertNodes(editor, {
            type: 'heading-one',
            children: [{ text: cleanText }]
          } as CustomElement);
        } else if (line.startsWith('## ')) {
          const cleanText = cleanMarkdownSymbols(line.replace('## ', ''));
          Transforms.insertNodes(editor, {
            type: 'heading-two',
            children: [{ text: cleanText }]
          } as CustomElement);
        } else if (line.startsWith('### ')) {
          const cleanText = cleanMarkdownSymbols(line.replace('### ', ''));
          Transforms.insertNodes(editor, {
            type: 'heading-three',
            children: [{ text: cleanText }]
          } as CustomElement);
        } else if (line.startsWith('- ') || line.startsWith('• ')) {
          const cleanText = cleanMarkdownSymbols(line.replace(/^[-•]\s*/, ''));
          Transforms.insertNodes(editor, {
            type: 'list-item',
            children: [{ text: cleanText }]
          } as CustomElement);
        } else {
          const cleanText = cleanMarkdownSymbols(line);
          Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [{ text: cleanText }]
          } as CustomElement);
        }
      });

      // Trigger auto-save
      setValue([...value]);

      toast({
        title: "Content Inserted",
        description: "AI-generated content has been added to your note",
      });
    } catch (error) {
      console.error('Error inserting content:', error);
      toast({
        title: "Error",
        description: "Failed to insert content into note",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive",
      });
    }
  };

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    const alignClass = element.align ? `text-${element.align}` : '';

    switch (element.type) {
      case 'heading-one':
        return (
          <h1 {...attributes} className={`text-4xl font-bold mt-8 mb-4 text-black ${alignClass}`}>
            {children}
          </h1>
        );
      case 'heading-two':
        return (
          <h2 {...attributes} className={`text-3xl font-bold mt-6 mb-3 text-black ${alignClass}`}>
            {children}
          </h2>
        );
      case 'heading-three':
        return (
          <h3 {...attributes} className={`text-2xl font-bold mt-4 mb-2 text-black ${alignClass}`}>
            {children}
          </h3>
        );
      case 'block-quote':
        return (
          <blockquote {...attributes} className={`border-l-4 border-border pl-6 italic my-4 text-gray-600 ${alignClass}`}>
            {children}
          </blockquote>
        );
      case 'bulleted-list':
        return (
          <ul {...attributes} className={`list-disc ml-6 my-4 space-y-1 text-black ${alignClass}`}>
            {children}
          </ul>
        );
      case 'numbered-list':
        return (
          <ol {...attributes} className={`list-decimal ml-6 my-4 space-y-1 text-black ${alignClass}`}>
            {children}
          </ol>
        );
      case 'list-item':
        return (
          <li {...attributes} className={`text-black ${alignClass}`}>
            {children}
          </li>
        );
      default:
        return (
          <p {...attributes} className={`mb-4 text-black leading-relaxed ${alignClass}`}>
            {children}
          </p>
        );
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { attributes, children, leaf } = props;

    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
      children = <em>{children}</em>;
    }

    if (leaf.underline) {
      children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
  }, []);

  const getColorClass = (colorValue: string) => {
    const colorObj = noteColors.find(c => c.value === colorValue);
    return colorObj ? colorObj.class : "bg-black text-white";
  };

  const isEmpty = value.length === 1 && 
    SlateElement.isElement(value[0]) && 
    (value[0] as CustomElement).type === 'paragraph' && 
    (value[0] as CustomElement).children.length === 1 && 
    Text.isText((value[0] as CustomElement).children[0]) && 
    ((value[0] as CustomElement).children[0] as CustomText).text === '';

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Google Docs-style Header */}
      <div className="border-b border-border bg-background shadow-sm flex-shrink-0">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 h-12">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-muted-foreground p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-foreground">
                {title || "Untitled document"}
              </span>
            </div>
            

          </div>

          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setShowAiChat(!showAiChat)}
              variant={showAiChat ? "default" : "outline"}
              className={`px-3 py-1 h-8 text-sm transition-all ${
                showAiChat 
                  ? "bg-foreground text-background hover:bg-foreground/90 shadow-md" 
                  : "border-border hover:bg-muted"
              }`}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Assistant
            </Button>
            <Button 
              onClick={handleManualSave} 
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-1 h-8 text-sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

      </div>

      {/* Google Docs-style Toolbar */}
      <div className="border-b border-border bg-background p-2 flex-shrink-0">
        <div className="flex items-center space-x-1 flex-wrap">
          {/* Left Section - Undo/Redo/Print */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => undo(editor)}
              disabled={!canUndo(editor)}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => redo(editor)}
              disabled={!canRedo(editor)}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom and Text Style */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Select value={zoom} onValueChange={setZoom}>
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50%">50%</SelectItem>
                <SelectItem value="75%">75%</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
                <SelectItem value="125%">125%</SelectItem>
                <SelectItem value="150%">150%</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="Normal text" onValueChange={(value) => {
              switch(value) {
                case "Heading 1":
                  toggleBlock(editor, 'heading-one');
                  break;
                case "Heading 2":
                  toggleBlock(editor, 'heading-two');
                  break;
                case "Heading 3":
                  toggleBlock(editor, 'heading-three');
                  break;
                default:
                  toggleBlock(editor, 'paragraph');
              }
            }}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal text">Normal text</SelectItem>
                <SelectItem value="Heading 1">Heading 1</SelectItem>
                <SelectItem value="Heading 2">Heading 2</SelectItem>
                <SelectItem value="Heading 3">Heading 3</SelectItem>
                <SelectItem value="Subtitle">Subtitle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Selection */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Calibri">Calibri</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-6 p-0 text-xs"
                onClick={() => setFontSize(Math.max(8, fontSize - 1))}
              >
                -
              </Button>
              <span className="text-xs px-2">{fontSize}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-6 p-0 text-xs"
                onClick={() => setFontSize(Math.min(72, fontSize + 1))}
              >
                +
              </Button>
            </div>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Button
              variant={isMarkActive(editor, 'bold') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark(editor, 'bold');
              }}
              className={`h-8 w-8 p-0 ${isMarkActive(editor, 'bold') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={isMarkActive(editor, 'italic') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark(editor, 'italic');
              }}
              className={`h-8 w-8 p-0 ${isMarkActive(editor, 'italic') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={isMarkActive(editor, 'underline') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark(editor, 'underline');
              }}
              className={`h-8 w-8 p-0 ${isMarkActive(editor, 'underline') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Button
              variant={isAlignmentActive(editor, 'left') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleAlignment(editor, 'left');
              }}
              className={`h-8 w-8 p-0 ${isAlignmentActive(editor, 'left') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isAlignmentActive(editor, 'center') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleAlignment(editor, 'center');
              }}
              className={`h-8 w-8 p-0 ${isAlignmentActive(editor, 'center') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={isAlignmentActive(editor, 'right') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleAlignment(editor, 'right');
              }}
              className={`h-8 w-8 p-0 ${isAlignmentActive(editor, 'right') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant={isAlignmentActive(editor, 'justify') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleAlignment(editor, 'justify');
              }}
              className={`h-8 w-8 p-0 ${isAlignmentActive(editor, 'justify') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists and Indentation */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Button
              variant={isBlockActive(editor, 'bulleted-list') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'bulleted-list');
              }}
              className={`h-8 w-8 p-0 ${isBlockActive(editor, 'bulleted-list') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={isBlockActive(editor, 'numbered-list') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'numbered-list');
              }}
              className={`h-8 w-8 p-0 ${isBlockActive(editor, 'numbered-list') ? "bg-blue-100 text-blue-600" : ""}`}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex relative">
          {/* Vertical Ruler */}
          <div className="w-8 bg-muted/20 border-r border-border flex flex-col items-center py-4 text-xs text-muted-foreground">
            <span className="transform -rotate-90 whitespace-nowrap">1</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">2</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">3</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">4</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">5</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">6</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">7</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">8</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">9</span>
            <span className="transform -rotate-90 whitespace-nowrap mt-8">10</span>
          </div>

          {/* Document Area */}
          <div className={`flex-1 bg-white shadow-inner transition-all duration-300 ${showAiChat ? 'mr-96' : ''}`}>
            <div className="max-w-4xl mx-auto p-12 min-h-[800px]">
              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled document"
                className="text-4xl font-normal border-none bg-transparent text-black placeholder:text-gray-400 p-0 mb-8 focus-visible:ring-0 shadow-none transition-all duration-200"
                style={{ fontSize: "2.5rem", lineHeight: "1.2", color: "#000000" }}
              />

              {/* Slate Editor */}
              <Slate
                editor={editor}
                initialValue={value}
                onValueChange={(newValue) => setValue(newValue)}
              >
                <Editable
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Start writing your document..."
                  className="min-h-[600px] text-base leading-relaxed focus:outline-none text-black max-w-none"
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    lineHeight: "1.5",
                    transform: `scale(${parseInt(zoom) / 100})`,
                    transformOrigin: "top left",
                    color: "#000000",
                  }}
                />
              </Slate>
            </div>
          </div>

          {/* AI Chat Sidebar */}
          {showAiChat && (
            <div className="fixed right-0 top-0 bottom-0 w-96 bg-background border-l border-border shadow-2xl flex flex-col z-50">
              {/* AI Chat Header */}
              <div className="p-4 border-b border-border bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center border border-border">
                      <Sparkles className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base">AI Writing Assistant</h3>
                      <p className="text-xs text-muted-foreground">Powered by Groq</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiChat(false)}
                    className="h-8 w-8 p-0 hover:bg-muted rounded-md"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* AI Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                {aiMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-foreground" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground border-2 border-background"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 text-lg">AI Writing Assistant</h4>
                      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        I'll help you write amazing notes! Ask me anything:
                      </p>
                      <div className="mt-4 space-y-2 text-left bg-muted/50 rounded-lg p-4 border border-border">
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-foreground mt-2"></div>
                          <p className="text-xs text-muted-foreground">Generate content on any topic</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-foreground mt-2"></div>
                          <p className="text-xs text-muted-foreground">Expand existing points</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-foreground mt-2"></div>
                          <p className="text-xs text-muted-foreground">Create outlines & structures</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1 h-1 rounded-full bg-foreground mt-2"></div>
                          <p className="text-xs text-muted-foreground">Improve writing clarity</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  aiMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-[90%] rounded-lg ${
                          message.role === 'user'
                            ? 'bg-foreground text-background p-3'
                            : message.changes 
                              ? 'bg-muted/50 border border-border p-4'
                              : 'bg-card border border-border text-foreground p-3'
                        }`}
                      >
                        {message.role === 'assistant' && message.changes ? (
                          // Edit/Diff View
                          <div className="space-y-3">
                            {/* Diff Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-border">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-md bg-foreground/10 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-foreground" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-foreground">Changes Proposed</h4>
                                  <div className="flex items-center space-x-3 text-xs">
                                    {message.changes.added > 0 && (
                                      <span className="text-muted-foreground font-mono">
                                        +{message.changes.added}
                                      </span>
                                    )}
                                    {message.changes.removed > 0 && (
                                      <span className="text-muted-foreground font-mono">
                                        -{message.changes.removed}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-background rounded-md p-3 border border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                              <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                                {message.changes.preview}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => acceptChanges(message.changes!.newContent)}
                                className="flex-1 bg-foreground text-background hover:bg-foreground/90 h-9 font-medium"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Accept Changes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={rejectChanges}
                                className="flex-1 border-border hover:bg-muted h-9"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>

                            {/* Full content expandable */}
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                View full content
                              </summary>
                              <div className="mt-2 bg-background rounded-md p-3 text-xs font-mono text-foreground max-h-40 overflow-y-auto border border-border">
                                {message.content}
                              </div>
                            </details>
                          </div>
                        ) : (
                          // Regular message view
                          <>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            {message.role === 'assistant' && (
                              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertAiContentIntoNote(message.content)}
                                  className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90"
                                >
                                  <FileText className="h-3 w-3 mr-1.5" />
                                  Insert
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(message.content, index)}
                                  className="h-8 text-xs hover:bg-muted border border-border"
                                >
                                  {copiedIndex === index ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1.5" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-muted/50 border border-border rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Chat Input */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAiChat();
                        }
                      }}
                      placeholder="Ask AI to help with your notes..."
                      className="flex-1 h-10"
                      disabled={isAiLoading}
                    />
                  </div>
                  <Button
                    onClick={handleAiChat}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="bg-foreground text-background hover:bg-foreground/90 h-10 px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Quick Actions:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAiInput("Summarize this note with key points and main takeaways")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      📊 Summarize
                    </button>
                    <button
                      onClick={() => setAiInput("Check grammar, spelling, and punctuation errors")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      ✓ Grammar Check
                    </button>
                    <button
                      onClick={() => setAiInput("Improve writing style and clarity")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      ✨ Improve Style
                    </button>
                    <button
                      onClick={() => setAiInput("Expand with more details and examples")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      📝 Expand
                    </button>
                    <button
                      onClick={() => setAiInput("Create a structured outline")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      📋 Outline
                    </button>
                    <button
                      onClick={() => setAiInput("Generate study questions for review")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      ❓ Study Questions
                    </button>
                    <button
                      onClick={() => setAiInput("Provide examples to illustrate concepts")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      � Add Examples
                    </button>
                    <button
                      onClick={() => setAiInput("Critique and provide constructive feedback")}
                      className="text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-md transition-colors border border-border"
                      disabled={isAiLoading}
                    >
                      🎯 Get Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Document saved to Drive</span>
          <span>•</span>
          <span>Last edit was {lastSaved ? lastSaved.toLocaleTimeString() : 'never'}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
              className={`h-6 px-2 text-xs ${
                isPinned 
                  ? "text-amber-500 bg-amber-500/10" 
                  : "text-muted-foreground"
              }`}
            >
              {isPinned ? <PinOff className="h-3 w-3 mr-1" /> : <Pin className="h-3 w-3 mr-1" />}
              {isPinned ? 'Unpin' : 'Pin'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">No class</SelectItem>
                {classes.filter((cls) => cls.id && cls.id.trim() !== "").map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} className="text-xs">
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            {isSaving && (
              <span className="text-blue-600 flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse mr-1"></div>
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

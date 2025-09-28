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
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Pin,
  PinOff,
  Undo,
  Redo,
  Printer,
  CheckCircle,
  Palette,
  Link,
  MessageSquarePlus,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoreHorizontal,
  FileText,
  Star,
  Folder,
  Cloud,
  Clock,
  Video,
  Share,
  MoreVertical
} from "lucide-react";
import { createEditor, Descendant, Editor, BaseEditor, Transforms, Element as SlateElement, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import DOMPurify from 'dompurify';
import type { Note, InsertNote, Class } from "../../shared/schema";

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
  editor.undo();
};

const redo = (editor: Editor) => {
  editor.redo();
};

const canUndo = (editor: Editor) => {
  return editor.history.undos.length > 0;
};

const canRedo = (editor: Editor) => {
  return editor.history.redos.length > 0;
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
              className="hover:bg-accent text-muted-foreground hover:text-foreground p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-foreground">
                {title || "Untitled document"}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Folder className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Cloud className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleManualSave} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 h-8 text-sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>

      {/* Google Docs-style Toolbar */}
      <div className="border-b border-border bg-background p-2 flex-shrink-0">
        <div className="flex items-center space-x-1 flex-wrap">
          {/* Left Section - Undo/Redo/Print/Spell */}
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Spell check", description: "Spell check feature coming soon!" })}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Paint format", description: "Paint format feature coming soon!" })}
            >
              <Palette className="h-4 w-4" />
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Text color", description: "Text color picker coming soon!" })}
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Highlight color", description: "Highlight color picker coming soon!" })}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Section - Link, Comment, Image, Alignment */}
          <div className="flex items-center space-x-1 border-r border-border pr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Insert Link", description: "Link insertion feature coming soon!" })}
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Add Comment", description: "Comment feature coming soon!" })}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Insert Image", description: "Image insertion feature coming soon!" })}
            >
              <Image className="h-4 w-4" />
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Decrease Indent", description: "Decrease indent feature coming soon!" })}
            >
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-current"></div>
                <div className="w-1 h-0.5 bg-current ml-1"></div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "Increase Indent", description: "Increase indent feature coming soon!" })}
            >
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="w-1 h-0.5 bg-current"></div>
                <div className="w-3 h-0.5 bg-current ml-1"></div>
              </div>
            </Button>
          </div>

          {/* More Options */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => toast({ title: "More Options", description: "Additional formatting options coming soon!" })}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex">
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
          <div className="flex-1 bg-white shadow-inner">
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
                  : "text-muted-foreground hover:text-amber-500"
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

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
  PinOff
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
    
    switch (element.type) {
      case 'heading-one':
        return `<h1>${children}</h1>`;
      case 'heading-two':
        return `<h2>${children}</h2>`;
      case 'heading-three':
        return `<h3>${children}</h3>`;
      case 'block-quote':
        return `<blockquote>${children}</blockquote>`;
      case 'bulleted-list':
        return `<ul>${children}</ul>`;
      case 'numbered-list':
        return `<ol>${children}</ol>`;
      case 'list-item':
        return `<li>${children}</li>`;
      default:
        return `<p>${children}</p>`;
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
    }, 5000); // Increased to 5 seconds to reduce frequency

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
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't show error toast for auto-save failures to avoid disrupting user
    } finally {
      setIsSaving(false);
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

    switch (element.type) {
      case 'heading-one':
        return (
          <h1 {...attributes} className="text-4xl font-bold mt-8 mb-4 text-foreground">
            {children}
          </h1>
        );
      case 'heading-two':
        return (
          <h2 {...attributes} className="text-3xl font-bold mt-6 mb-3 text-foreground">
            {children}
          </h2>
        );
      case 'heading-three':
        return (
          <h3 {...attributes} className="text-2xl font-bold mt-4 mb-2 text-foreground">
            {children}
          </h3>
        );
      case 'block-quote':
        return (
          <blockquote {...attributes} className="border-l-4 border-border pl-6 italic my-4 text-muted-foreground">
            {children}
          </blockquote>
        );
      case 'bulleted-list':
        return (
          <ul {...attributes} className="list-disc ml-6 my-4 space-y-1">
            {children}
          </ul>
        );
      case 'numbered-list':
        return (
          <ol {...attributes} className="list-decimal ml-6 my-4 space-y-1">
            {children}
          </ol>
        );
      case 'list-item':
        return (
          <li {...attributes} className="text-foreground">
            {children}
          </li>
        );
      default:
        return (
          <p {...attributes} className="mb-4 text-foreground leading-relaxed">
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
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinned(!isPinned)}
                className={`transition-all duration-200 ${
                  isPinned 
                    ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" 
                    : "text-muted-foreground hover:text-amber-500 hover:bg-accent"
                }`}
              >
                {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              
              <div className="flex space-x-3 bg-muted/50 rounded-xl p-2">
                {noteColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    onClick={() => setColor(colorOption.value)}
                    className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 hover:scale-110 transform ${
                      color === colorOption.value 
                        ? "border-primary shadow-lg shadow-primary/30 scale-110" 
                        : "border-border hover:border-border/80"
                    } ${colorOption.class.split(' ').slice(0, 1).join(' ')}`}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-sm">
              {isSaving && (
                <span className="text-primary flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse mr-2"></div>
                  Saving...
                </span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-muted-foreground">
                  Saved at {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <Button 
              onClick={handleManualSave} 
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center space-x-4 px-8 pb-5">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 bg-background border-border hover:bg-accent text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {noteCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-foreground hover:bg-accent">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-44 bg-background border-border hover:bg-accent text-foreground">
              <SelectValue placeholder="Link to class" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="none" className="text-foreground hover:bg-accent">No class</SelectItem>
              {classes.filter((cls) => cls.id && cls.id.trim() !== "").map((cls) => (
                <SelectItem key={cls.id} value={cls.id} className="text-foreground hover:bg-accent">
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {category && (
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 backdrop-blur-sm p-3 flex-shrink-0">
        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-1 border-r border-border pr-3">
            <Button
              variant={isBlockActive(editor, 'heading-one') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'heading-one');
              }}
              title="Heading 1"
              className={isBlockActive(editor, 'heading-one') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant={isBlockActive(editor, 'heading-two') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'heading-two');
              }}
              title="Heading 2"
              className={isBlockActive(editor, 'heading-two') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={isBlockActive(editor, 'heading-three') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'heading-three');
              }}
              title="Heading 3"
              className={isBlockActive(editor, 'heading-three') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1 border-r border-border pr-3">
            <Button
              variant={isMarkActive(editor, 'bold') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleMark(editor, 'bold');
              }}
              title="Bold"
              className={isMarkActive(editor, 'bold') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
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
              title="Italic"
              className={isMarkActive(editor, 'italic') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
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
              title="Underline"
              className={isMarkActive(editor, 'underline') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1 border-r border-border pr-3">
            <Button
              variant={isBlockActive(editor, 'bulleted-list') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'bulleted-list');
              }}
              title="Bullet List"
              className={isBlockActive(editor, 'bulleted-list') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
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
              title="Numbered List"
              className={isBlockActive(editor, 'numbered-list') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant={isBlockActive(editor, 'block-quote') ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock(editor, 'block-quote');
              }}
              title="Block Quote"
              className={isBlockActive(editor, 'block-quote') 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto p-12">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="text-5xl font-bold border-none bg-transparent text-foreground placeholder:text-muted-foreground p-0 mb-12 focus-visible:ring-0 shadow-none transition-all duration-200"
            style={{ fontSize: "3rem", lineHeight: "1.1" }}
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
              placeholder="Start writing your note..."
              className="min-h-[700px] text-xl leading-relaxed focus:outline-none text-foreground max-w-none"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: "1.8",
              }}
            />
          </Slate>
        </div>
      </div>
    </div>
  );
}

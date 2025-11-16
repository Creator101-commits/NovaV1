import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Tag, CheckSquare, AlignLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBoardContext } from '@/contexts/BoardContext';
import { useUIContext } from '@/contexts/UIContext';
import { format } from 'date-fns';
import type { Card as CardType, Checklist, Label as LabelType } from '@shared/schema';

export const CardDetailModal: React.FC = () => {
  const {
    updateCard,
    deleteCard,
    labels,
    createLabel,
    addLabelToCard,
    removeLabelFromCard
  } = useBoardContext();

  const {
    isCardModalOpen,
    selectedCard,
    closeCardModal
  } = useUIContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isCompleted, setIsCompleted] = useState(false);
  const [cardLabels, setCardLabels] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  // Auto-save debounce
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedCard) {
      setTitle(selectedCard.title);
      setDescription(selectedCard.description || '');
      setDueDate(selectedCard.dueDate ? new Date(selectedCard.dueDate) : undefined);
      setIsCompleted(selectedCard.isCompleted || false);
      // TODO: Load card labels and checklists from API
      setCardLabels([]);
      setChecklists([]);
    }
  }, [selectedCard]);

  const handleSave = async () => {
    if (!selectedCard) return;

    await updateCard(selectedCard.id, {
      title,
      description,
      dueDate: dueDate || null,
      isCompleted
    });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    
    // Debounce auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(handleSave, 1000));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    // Debounce auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(handleSave, 2000));
  };

  const handleDelete = async () => {
    if (!selectedCard) return;
    
    if (window.confirm('Delete this card? This cannot be undone.')) {
      await deleteCard(selectedCard.id);
      closeCardModal();
    }
  };

  const handleAddLabel = async (labelId: string) => {
    if (!selectedCard) return;
    await addLabelToCard(selectedCard.id, labelId);
    setCardLabels(prev => [...prev, labelId]);
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!selectedCard) return;
    await removeLabelFromCard(selectedCard.id, labelId);
    setCardLabels(prev => prev.filter(id => id !== labelId));
  };

  if (!selectedCard) return null;

  return (
    <AnimatePresence>
      {isCardModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCardModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-card z-50 shadow-2xl"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border flex items-start justify-between">
                <div className="flex-1">
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-2xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Card title"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => {
                        setIsCompleted(checked as boolean);
                        handleSave();
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      Mark as complete
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeCardModal}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <AlignLeft className="h-4 w-4" />
                      Description
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="Add a more detailed description..."
                      className="min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-saves while typing
                    </p>
                  </div>

                  {/* Due Date */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4" />
                      Due Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !dueDate && 'text-muted-foreground'
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => {
                            setDueDate(date);
                            handleSave();
                          }}
                          initialFocus
                        />
                        {dueDate && (
                          <div className="p-3 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setDueDate(undefined);
                                handleSave();
                              }}
                            >
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    
                    {dueDate && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {getDueDateText(dueDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Labels */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4" />
                      Labels
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {cardLabels.map((labelId) => {
                        const label = labels.find(l => l.id === labelId);
                        if (!label) return null;
                        return (
                          <Badge
                            key={labelId}
                            style={{ backgroundColor: label.color }}
                            className="cursor-pointer"
                            onClick={() => handleRemoveLabel(labelId)}
                          >
                            {label.name}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Tag className="h-4 w-4 mr-2" />
                          Add label
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <h4 className="font-medium">Select label</h4>
                          <div className="space-y-1">
                            {labels.map((label) => (
                              <button
                                key={label.id}
                                onClick={() => handleAddLabel(label.id)}
                                className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent"
                                disabled={cardLabels.includes(label.id)}
                              >
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span className="flex-1 text-left">{label.name}</span>
                                {cardLabels.includes(label.id) && (
                                  <CheckSquare className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Checklists - Placeholder for Phase 2 */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-4 w-4" />
                      Checklist
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Checklist feature coming soon
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Created {selectedCard.createdAt ? format(new Date(selectedCard.createdAt), 'PPp') : 'Unknown'}
                    </p>
                    {selectedCard.updatedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last updated {format(new Date(selectedCard.updatedAt), 'PPp')}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-6 border-t border-border flex justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete Card
                </Button>
                <Button onClick={closeCardModal}>
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function getDueDateText(date: Date): string {
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due in ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) === 1 ? '' : 's'}`;
}

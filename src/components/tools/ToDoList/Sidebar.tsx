import React, { useMemo } from 'react';
import { Search, Star, Plus, Menu, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useBoardContext } from '@/contexts/BoardContext';
import { useUIContext } from '@/contexts/UIContext';
import type { Board } from '@shared/schema';

export const Sidebar: React.FC = () => {
  const {
    boards,
    activeBoard,
    setActiveBoard,
    updateBoard
  } = useBoardContext();
  
  const {
    openBoardDialog,
    isSidebarCollapsed,
    toggleSidebar
  } = useUIContext();

  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter boards by search
  const filteredBoards = useMemo(() => {
    if (!searchQuery) return boards;
    return boards.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [boards, searchQuery]);

  const handleBoardClick = (board: Board) => {
    setActiveBoard(board);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    await updateBoard(board.id, { isFavorited: !board.isFavorited });
  };

  if (isSidebarCollapsed) {
    return (
      <motion.div
        initial={{ width: 280 }}
        animate={{ width: 60 }}
        className="h-full bg-card border-r border-border flex flex-col items-center py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mb-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 60 }}
      animate={{ width: 280 }}
      className="h-full bg-card border-r border-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📋 To-Do List
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <Input
          placeholder="Search boards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <ScrollArea className="flex-1">
        {/* All Boards */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            All Boards
          </h3>
          <div className="space-y-1">
            <AnimatePresence>
              {filteredBoards.map((board) => (
                <BoardItem
                  key={board.id}
                  board={board}
                  isActive={activeBoard?.id === board.id}
                  onClick={() => handleBoardClick(board)}
                  onToggleFavorite={(e) => handleToggleFavorite(e, board)}
                />
              ))}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-2 justify-start"
            onClick={() => openBoardDialog()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Board
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          To-Do List is only visible to you
        </p>
      </div>
    </motion.div>
  );
};

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const BoardItem: React.FC<BoardItemProps> = ({
  board,
  isActive,
  onClick,
  onToggleFavorite
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        w-full flex items-center justify-between p-2 rounded-md
        transition-colors group
        ${isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: board.background || '#6366f1' }}
        />
        <span className="font-medium truncate">{board.title}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggleFavorite}
        >
          <Star
            className={`h-3 w-3 ${
              board.isFavorited ? 'fill-yellow-400 text-yellow-400' : ''
            }`}
          />
        </Button>
        {isActive && <ChevronRight className="h-4 w-4" />}
      </div>
    </motion.button>
  );
};

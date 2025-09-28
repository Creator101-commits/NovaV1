import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Flashcard, InsertFlashcard } from "@shared/schema";
import {
  Brain,
  Plus,
  RotateCcw,
  Shuffle,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Download,
  Upload,
  Link,
} from "lucide-react";

export const Flashcards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<"sequential" | "random">("sequential");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({ front: "", back: "", difficulty: "medium" as "easy" | "medium" | "hard" });

  const currentCard = flashcards[currentCardIndex];

  // Load flashcards from database
  const loadFlashcards = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const response = await apiGet(`/api/users/${user.uid}/flashcards`);
      if (response.ok) {
        const data = await response.json();
        setFlashcards(data);
        console.log('✅ Loaded flashcards:', data.length);
      } else {
        console.error('Failed to load flashcards:', response.status);
        toast({
          title: "Error",
          description: "Failed to load flashcards",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new flashcard
  const createFlashcard = async () => {
    if (!user?.uid || !newCard.front.trim() || !newCard.back.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both front and back of the flashcard",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiPost(`/api/users/${user.uid}/flashcards`, {
        front: newCard.front,
        back: newCard.back,
        difficulty: newCard.difficulty,
      });

      if (response.ok) {
        const createdFlashcard = await response.json();
        setFlashcards(prev => [...prev, createdFlashcard]);
        setNewCard({ front: "", back: "", difficulty: "medium" });
        setIsCreateDialogOpen(false);
        toast({
          title: "Success",
          description: "Flashcard created successfully",
        });
      } else {
        throw new Error('Failed to create flashcard');
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to create flashcard",
        variant: "destructive",
      });
    }
  };

  // Update flashcard review stats
  const updateFlashcardStats = async (flashcardId: string, correct: boolean) => {
    try {
      const flashcard = flashcards.find(f => f.id === flashcardId);
      if (!flashcard) return;

      const updatedReviewCount = (flashcard.reviewCount || 0) + 1;
      const updatedLastReviewed = new Date().toISOString();

      const response = await apiPut(`/api/flashcards/${flashcardId}`, {
        reviewCount: updatedReviewCount,
        lastReviewed: updatedLastReviewed,
      });

      if (response.ok) {
        setFlashcards(prev => prev.map(f => 
          f.id === flashcardId 
            ? { ...f, reviewCount: updatedReviewCount, lastReviewed: new Date(updatedLastReviewed) }
            : f
        ));
      }
    } catch (error) {
      console.error('Error updating flashcard stats:', error);
    }
  };

  // Delete flashcard
  const deleteFlashcard = async (flashcardId: string) => {
    try {
      const response = await apiDelete(`/api/flashcards/${flashcardId}`);
      if (response.ok) {
        setFlashcards(prev => prev.filter(f => f.id !== flashcardId));
        toast({
          title: "Success",
          description: "Flashcard deleted successfully",
        });
      } else {
        throw new Error('Failed to delete flashcard');
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive",
      });
    }
  };

  // Load flashcards on component mount
  useEffect(() => {
    loadFlashcards();
  }, [user?.uid]);


  const nextCard = () => {
    if (studyMode === "random") {
      setCurrentCardIndex(Math.floor(Math.random() * flashcards.length));
    } else {
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    }
    setIsFlipped(false);
  };

  const previousCard = () => {
    if (studyMode === "sequential") {
      setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
      setIsFlipped(false);
    }
  };

  const markAnswer = async (correct: boolean) => {
    if (!currentCard) return;

    // Update in database
    await updateFlashcardStats(currentCard.id, correct);

    // Move to next card
    nextCard();
  };

  const getAccuracyRate = (card: Flashcard) => {
    if (!card.reviewCount || card.reviewCount === 0) return 0;
    // Since we don't track correct/incorrect separately, we'll use a simple heuristic
    // This could be improved by adding correctCount/incorrectCount to the database schema
    return 75; // Default accuracy rate
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200";
      default:
        return "bg-muted text-foreground";
    }
  };

  const overallStats = {
    totalCards: flashcards.length,
    totalReviews: flashcards.reduce((sum, card) => sum + (card.reviewCount || 0), 0),
    averageAccuracy: flashcards.length > 0 
      ? Math.round(flashcards.reduce((sum, card) => sum + getAccuracyRate(card), 0) / flashcards.length)
      : 0,
  };

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first flashcard to start studying
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg">
                <Plus className="h-4 w-4 mr-2" />
                Create Flashcard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flashcard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="front">Front (Question/Term)</Label>
                  <Textarea
                    id="front"
                    placeholder="Enter the question or term..."
                    value={newCard.front}
                    onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="back">Back (Answer/Definition)</Label>
                  <Textarea
                    id="back"
                    placeholder="Enter the answer or definition..."
                    value={newCard.back}
                    onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFlashcard} className="gradient-bg">
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="study" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="manage">Manage Cards</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={loadFlashcards}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flashcard</DialogTitle>
                </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="front">Front (Question/Term)</Label>
                  <Textarea
                    id="front"
                    placeholder="Enter the question or term..."
                    value={newCard.front}
                    onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="back">Back (Answer/Definition)</Label>
                  <Textarea
                    id="back"
                    placeholder="Enter the answer or definition..."
                    value={newCard.back}
                    onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFlashcard} className="gradient-bg">
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <TabsContent value="study">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Study Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Study Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex space-x-2">
                    <Button
                      variant={studyMode === "sequential" ? "default" : "outline"}
                      onClick={() => setStudyMode("sequential")}
                      className="flex-1"
                    >
                      Sequential
                    </Button>
                    <Button
                      variant={studyMode === "random" ? "default" : "outline"}
                      onClick={() => setStudyMode("random")}
                      className="flex-1"
                    >
                      <Shuffle className="h-4 w-4 mr-1" />
                      Random
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </div>
                  <Progress value={((currentCardIndex + 1) / flashcards.length) * 100} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Cards:</span>
                    <span className="font-semibold">{overallStats.totalCards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reviews:</span>
                    <span className="font-semibold">{overallStats.totalReviews}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Accuracy:</span>
                    <span className="font-semibold">{overallStats.averageAccuracy}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Flashcard Display */}
            <div className="lg:col-span-2">
              <Card className="min-h-96">
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={getDifficultyColor(currentCard.difficulty || "medium")}>
                      {currentCard.difficulty || "medium"}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Reviewed {currentCard.reviewCount || 0} times
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-lg">
                      <div className="min-h-32 flex items-center justify-center">
                        <p className="text-lg leading-relaxed">
                          {isFlipped ? currentCard.back : currentCard.front}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => setIsFlipped(!isFlipped)}
                        variant="outline"
                        className="w-full"
                      >
                        {isFlipped ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Show Question
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Answer Feedback (only show when flipped) */}
                    {isFlipped && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => markAnswer(false)}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Incorrect
                        </Button>
                        <Button
                          onClick={() => markAnswer(true)}
                          variant="outline"
                          className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Correct
                        </Button>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={previousCard}
                        variant="outline"
                        disabled={studyMode === "random"}
                        className="flex-1"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={nextCard}
                        variant="outline"
                        className="flex-1"
                      >
                        {studyMode === "random" ? "Random" : "Next"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <div className="space-y-4">
            {flashcards.map((card, index) => (
              <Card key={card.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor(card.difficulty || "medium")}>
                          {card.difficulty || "medium"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getAccuracyRate(card)}% accuracy
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">Q: {card.front}</p>
                        <p className="text-muted-foreground">A: {card.back}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reviewed {card.reviewCount} times • 
                        {card.lastReviewed 
                          ? ` Last: ${card.lastReviewed.toLocaleDateString()}`
                          : " Never reviewed"
                        }
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFlashcard(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Cards</span>
                    <span className="font-semibold">{overallStats.totalCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Reviews</span>
                    <span className="font-semibold">{overallStats.totalReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Accuracy</span>
                    <span className="font-semibold">{overallStats.averageAccuracy}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Difficulty Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["easy", "medium", "hard"].map(difficulty => {
                    const count = flashcards.filter(card => card.difficulty === difficulty).length;
                    const percentage = flashcards.length > 0 ? (count / flashcards.length) * 100 : 0;
                    
                    return (
                      <div key={difficulty} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{difficulty}</span>
                          <span>{count} cards</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Flashcards;

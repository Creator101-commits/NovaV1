import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PomodoroTimer } from "@/components/tools/PomodoroTimer";
import { Flashcards } from "@/components/tools/Flashcards";
import { MoodTracker } from "@/components/tools/MoodTracker";
import { DailyJournal } from "@/components/tools/DailyJournal";
import { AiSummaryHistory } from "@/components/tools/AiSummaryHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivity } from "@/contexts/ActivityContext";
import {
  Clock,
  Brain,
  Smile,
  BookOpen,
  Wrench,
  Bot,
} from "lucide-react";

export default function Toolbox() {
  const { addActivity } = useActivity();
  
  const tools = [
    {
      id: "pomodoro",
      title: "Pomodoro Timer",
      description: "25/5 minute focus sessions to boost productivity",
      icon: Clock,
      color: "text-green-500",
      component: PomodoroTimer,
    },
    {
      id: "flashcards",
      title: "Flashcards",
      description: "Create and study with interactive flashcards",
      icon: Brain,
      color: "text-purple-500",
      component: Flashcards,
    },
    {
      id: "mood",
      title: "Mood Tracker",
      description: "Track your daily mood and emotional patterns",
      icon: Smile,
      color: "text-yellow-500",
      component: MoodTracker,
    },
    {
      id: "journal",
      title: "Daily Journal",
      description: "Write daily reflections and thoughts (500 chars)",
      icon: BookOpen,
      color: "text-orange-500",
      component: DailyJournal,
    },
    {
      id: "ai-summaries",
      title: "AI Summaries",
      description: "View and manage your AI-generated summaries",
      icon: Bot,
      color: "text-indigo-500",
      component: AiSummaryHistory,
    },
  ];

  const handleTabChange = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      addActivity({
        label: `Used ${tool.title}`,
        icon: tool.icon,
        tone: tool.color,
        type: toolId as any,
        route: "/toolbox"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Gentle Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Study Tools
        </h1>
        <p className="text-sm text-muted-foreground">
          Tools to help you study better and stay focused
        </p>
      </div>

      {/* Simple Tools */}
      <Tabs defaultValue="pomodoro" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <TabsTrigger key={tool.id} value={tool.id} className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{tool.title.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tools.map((tool) => {
          const Component = tool.component;
          return (
            <TabsContent key={tool.id} value={tool.id}>
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

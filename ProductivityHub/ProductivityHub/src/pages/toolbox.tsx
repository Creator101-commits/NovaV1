import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PomodoroTimer } from "@/components/tools/PomodoroTimer";
import { Flashcards } from "@/components/tools/Flashcards";
import { MoodTracker } from "@/components/tools/MoodTracker";
import { BellScheduleComponent } from "@/components/tools/BellSchedule";
import { DailyJournal } from "@/components/tools/DailyJournal";
import { AiSummaryHistory } from "@/components/tools/AiSummaryHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivity } from "@/contexts/ActivityContext";
import {
  Clock,
  Brain,
  Smile,
  Bell,
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
      id: "schedule",
      title: "Bell Schedule",
      description: "View your school period timings",
      icon: Bell,
      color: "text-blue-500",
          component: BellScheduleComponent,
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Wrench className="h-8 w-8 mr-3 text-primary" />
          Productivity Toolbox
        </h1>
        <p className="text-muted-foreground">
          Essential tools to enhance your study sessions and track your progress
        </p>
      </div>


      {/* Tools Tabs */}
      <Tabs defaultValue="pomodoro" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <TabsTrigger key={tool.id} value={tool.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tool.title}</span>
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

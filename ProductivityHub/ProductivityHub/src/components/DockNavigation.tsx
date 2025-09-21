import { useLocation } from "wouter";
import Dock, { type DockItemData } from "@/components/ui/Dock";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  GraduationCap,
  StickyNote,
  Wrench,
  Bot,
  BarChart3,
  Target,
} from "lucide-react";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/assignments", label: "Assignments", icon: BookOpen },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/toolbox", label: "Toolbox", icon: Wrench },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/ai-chat", label: "AI Chatbot", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export const DockNavigation = () => {
  const [location, setLocation] = useLocation();

  const dockItems: DockItemData[] = navigationItems.map((item) => ({
    icon: <item.icon />,
    label: item.label,
    onClick: () => setLocation(item.href),
    className: location === item.href ? "active" : "",
  }));

  return <Dock items={dockItems} />;
};

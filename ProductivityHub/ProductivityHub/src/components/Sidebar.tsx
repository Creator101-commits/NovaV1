import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  GraduationCap,
  Wrench,
  Bot,
  BarChart3,
  User,
  StickyNote,
} from "lucide-react";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/assignments", label: "Assignments", icon: BookOpen },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/toolbox", label: "Toolbox", icon: Wrench },
  { href: "/ai-chat", label: "AI Chatbot", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export const Sidebar = () => {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border p-6 h-full">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

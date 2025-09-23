import { Switch, Route } from "wouter";
import "katex/dist/katex.min.css";
import "prismjs/themes/prism.css"; 
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DockNavigation } from "@/components/DockNavigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { GraduationCap, Moon, Sun, Plus } from "lucide-react";

// Pages
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import CalendarCallback from "@/pages/calendar-callback";
import Assignments from "@/pages/assignments";
import Classes from "@/pages/classes";
import Notes from "@/pages/notes";
import Toolbox from "@/pages/toolbox";
import AiChat from "@/pages/ai-chat";
import Analytics from "@/pages/analytics";
import Profile from "@/pages/profile";
import Habits from "@/pages/habits";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

function AppNavigation() {
  const { user, userData, signOut, hasGoogleAccess } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  return (
    <nav className="bg-background px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">Refyneo</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {user && (
            <div className="flex items-center space-x-3">
              {/* Sync Status Indicator */}
              <div className={`flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium ${
                hasGoogleAccess 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-1 h-1 rounded-full ${hasGoogleAccess ? 'bg-foreground' : 'bg-muted-foreground'}`} />
                {hasGoogleAccess ? 'Connected' : 'Offline'}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                      <AvatarFallback>
                        {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  {!hasGoogleAccess && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="font-bold" onClick={() => setLocation("/auth")}>
                        Upgrade to Google Sync
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <AppNavigation />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto bg-background pb-32">
          {children}
        </main>
      </div>
      
      {/* Dock Navigation */}
      <DockNavigation />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="icon"
          className="w-10 h-10 bg-foreground text-background rounded-lg shadow-sm hover:shadow-md transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      
      {/* OAuth Callback Routes */}
      <Route path="/auth/calendar/google" component={CalendarCallback} />
      <Route path="/auth/calendar/outlook" component={CalendarCallback} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/calendar">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Calendar />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/assignments">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Assignments />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/classes">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Classes />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/notes">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Notes />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/toolbox">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Toolbox />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/ai-chat">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <AiChat />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Analytics />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/habits">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Habits />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute fallback={<Landing />}>
          <AppLayout>
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Legal Pages - Public access */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ActivityProvider>
            <CalendarProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </CalendarProvider>
          </ActivityProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

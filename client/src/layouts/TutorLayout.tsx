import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Home, Users, Calendar, ClipboardList, MessageSquare, Settings, LogOut } from "lucide-react";

interface TutorLayoutProps {
  children: React.ReactNode;
}

export function TutorLayout({ children }: TutorLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-6 bg-card border-r border-border z-50 shadow-sm" data-testid="tutor-nav">
        <div className="mb-6">
          <Link href="/tutor">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white font-serif font-bold text-xl cursor-pointer">
              V
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-3 w-full px-2">
          <Link href="/tutor">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/tutor') && !isActive('/tutor/students') && !isActive('/tutor/sessions') ? 'bg-purple-100 text-purple-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-tutor-home"
              title="Tutor Dashboard"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/tutor/students">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/tutor/students') ? 'bg-purple-100 text-purple-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-students"
              title="My Students"
            >
              <Users className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/tutor/sessions">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/tutor/sessions') ? 'bg-purple-100 text-purple-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-sessions"
              title="Sessions"
            >
              <Calendar className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/tutor/notes">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/tutor/notes') ? 'bg-purple-100 text-purple-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-notes"
              title="Session Notes"
            >
              <ClipboardList className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-2 w-full px-2">
          <Link href="/tutor/settings">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-12 rounded-xl text-muted-foreground hover:bg-muted"
              data-testid="nav-settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/logout">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              data-testid="nav-logout"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="ml-20 min-h-screen">
        {children}
      </main>
    </div>
  );
}

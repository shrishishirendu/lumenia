import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, MessageSquare, Settings, LogOut, User } from "lucide-react";

interface ParentLayoutProps {
  children: React.ReactNode;
}

export function ParentLayout({ children }: ParentLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-6 bg-card border-r border-border z-50 shadow-sm" data-testid="parent-nav">
        <div className="mb-6">
          <Link href="/parent">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white font-serif font-bold text-xl cursor-pointer" title="Lumenia">
              L
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-3 w-full px-2">
          <Link href="/parent">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/parent') && !isActive('/parent/progress') && !isActive('/parent/messages') ? 'bg-green-100 text-green-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-parent-home"
              title="Parent Portal"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/parent/progress">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/parent/progress') ? 'bg-green-100 text-green-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-progress"
              title="Progress Reports"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/parent/messages">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/parent/messages') ? 'bg-green-100 text-green-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-messages"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-2 w-full px-2">
          <Link href="/parent/settings">
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

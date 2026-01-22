import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Home, GraduationCap, BookOpen, Settings, LogOut, User } from "lucide-react";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-6 bg-card border-r border-border z-50 shadow-sm" data-testid="student-nav">
        <div className="mb-6">
          <Link href="/student">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-serif font-bold text-xl cursor-pointer" title="Lumenia">
              L
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-3 w-full px-2">
          <Link href="/student">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/student') && !isActive('/student/classroom') ? 'bg-blue-100 text-blue-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-my-learning"
              title="My Learning"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/student/classroom">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/student/classroom') ? 'bg-blue-100 text-blue-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-classroom"
              title="Classroom"
            >
              <GraduationCap className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/student/practice">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/student/practice') ? 'bg-blue-100 text-blue-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-practice"
              title="Practice"
            >
              <BookOpen className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-2 w-full px-2">
          <Link href="/student/profile">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-12 rounded-xl text-muted-foreground hover:bg-muted"
              data-testid="nav-profile"
              title="My Profile"
            >
              <User className="w-5 h-5" />
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

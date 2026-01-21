import { Link, useLocation } from "wouter";
import { LayoutDashboard, GraduationCap, LogOut, UserCircle, TrendingUp, Home, Settings, Brain, Megaphone, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const userRole = user?.role || "student";

  const isActive = (path: string) => location === path;

  // Role-based navigation: students only see classroom, parents see parent portal
  // Owners and teachers see all admin options
  const isAdmin = userRole === "owner" || userRole === "teacher";
  const isParent = userRole === "parent";
  const isStudent = userRole === "student";

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 bg-card border-r border-border z-50 shadow-sm hidden md:flex">
      <div className="mb-8">
        <Link href="/">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl cursor-pointer">
            V
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        {/* Mission Control - Admin/Teacher only */}
        {isAdmin && (
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-dashboard"
              title="Mission Control"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Growth Engine - Admin/Teacher only */}
        {isAdmin && (
          <Link href="/growth">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/growth') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-growth"
              title="Growth Engine"
            >
              <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Learning Orchestration - Admin/Teacher only */}
        {isAdmin && (
          <Link href="/orchestration">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/orchestration') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-orchestration"
              title="Learning Orchestration"
            >
              <Brain className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Marketing Agent - Admin/Teacher only */}
        {isAdmin && (
          <Link href="/marketing-agent">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/marketing-agent') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-marketing-agent"
              title="Marketing Agent"
            >
              <Megaphone className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Operations Agent - Admin/Teacher only */}
        {isAdmin && (
          <Link href="/ops-agent">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/ops-agent') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-ops-agent"
              title="Operations Agent"
            >
              <Server className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Student Home - Students only (not for teachers/owners) */}
        {isStudent && !isAdmin && (
          <Link href="/student">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/student') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-student-home"
              title="My Learning"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Classroom - Students and Teachers */}
        {(isStudent || isAdmin) && (
          <Link href="/classroom">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/classroom') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-classroom"
              title="Classroom"
            >
              <GraduationCap className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        {/* Parent Portal - Parents only */}
        {isParent && (
          <Link href="/parent">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/parent') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-parent"
              title="Parent Portal"
            >
              <UserCircle className="w-5 h-5" />
            </Button>
          </Link>
        )}
      </div>

      <div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-12 h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
          data-testid="nav-logout"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
}

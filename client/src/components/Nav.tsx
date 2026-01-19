import { Link, useLocation } from "wouter";
import { LayoutDashboard, GraduationCap, LogOut, UserCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Nav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

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
        <Link href="/dashboard">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-full h-12 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            data-testid="nav-dashboard"
            title="Owner Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </Button>
        </Link>
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
        <Link href="/classroom">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-full h-12 rounded-xl transition-all ${isActive('/classroom') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            data-testid="nav-classroom"
            title="Student Classroom"
          >
            <GraduationCap className="w-5 h-5" />
          </Button>
        </Link>
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
      </div>

      <div>
        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </nav>
  );
}

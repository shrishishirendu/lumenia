import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Users, TrendingUp, Brain, Megaphone, Server, 
  Settings, LogOut, Search, Shield, BarChart3, UserCheck 
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-6 bg-card border-r border-border z-50 shadow-sm" data-testid="admin-nav">
        <div className="mb-6">
          <Link href="/admin">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white font-serif font-bold text-xl cursor-pointer" title="Lumenia Admin">
              L
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-3 w-full px-2 overflow-y-auto">
          <Link href="/admin">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin') && !isActive('/admin/students') && !isActive('/admin/growth') && !isActive('/admin/orchestration') && !isActive('/admin/marketing') && !isActive('/admin/ops') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-dashboard"
              title="360° Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/students">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/students') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-students"
              title="All Students"
            >
              <Users className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/growth">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/growth') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-growth"
              title="Growth Engine"
            >
              <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/admissions">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/admissions') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-admissions"
              title="Admissions Agent"
            >
              <UserCheck className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/bi">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/bi') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-bi"
              title="BI Dashboard"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/orchestration">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/orchestration') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-orchestration"
              title="Orchestration"
            >
              <Brain className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/marketing">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/marketing') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-marketing"
              title="Marketing Agent"
            >
              <Megaphone className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/admin/ops">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`w-full h-12 rounded-xl transition-all ${isActive('/admin/ops') ? 'bg-red-100 text-red-600' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid="nav-admin-ops"
              title="Operations Agent"
            >
              <Server className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-2 w-full px-2">
          <Link href="/admin/settings">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-12 rounded-xl text-muted-foreground hover:bg-muted"
              data-testid="nav-admin-settings"
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

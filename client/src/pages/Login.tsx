import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Shield, Loader2, ArrowRight, Info } from "lucide-react";
import { getRoleHomeRoute } from "@/components/ProtectedRoute";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RoleOption = "student" | "parent" | "tutor" | "admin";

const mainRoleConfig = {
  student: {
    title: "Student",
    description: "Access your classroom, practice with Mentora, and track your learning journey",
    icon: Users,
    color: "bg-blue-500",
    hoverColor: "hover:border-blue-500",
    textColor: "text-blue-600"
  },
  parent: {
    title: "Parent",
    description: "Monitor your child's progress, view reports, and stay connected",
    icon: BookOpen,
    color: "bg-green-500",
    hoverColor: "hover:border-green-500",
    textColor: "text-green-600"
  },
  tutor: {
    title: "Tutor",
    description: "Manage students, view sessions, and track teaching outcomes",
    icon: GraduationCap,
    color: "bg-purple-500",
    hoverColor: "hover:border-purple-500",
    textColor: "text-purple-600"
  }
};

type MainRoleOption = "student" | "parent" | "tutor";

export default function Login() {
  const { user, loading, login } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<MainRoleOption | null>(null);

  const handleRoleSelect = (role: MainRoleOption) => {
    setSelectedRole(role);
  };

  const handleLogin = () => {
    if (selectedRole) {
      sessionStorage.setItem("intended_role", selectedRole);
      login();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    const homeRoute = getRoleHomeRoute(user.role || "student");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" data-testid="login-page">
        <Card className="w-full max-w-md text-center p-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">You're already signed in</h2>
          <p className="text-muted-foreground mb-6">Continue to your dashboard to get started.</p>
          <Button onClick={() => setLocation(homeRoute)} className="w-full" data-testid="go-to-dashboard">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" data-testid="login-page">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Lumenia</h1>
          <p className="text-muted-foreground mt-1">Guided learning, done right.</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1 cursor-help">
                  <Info className="h-3 w-3" />
                  About Lumenia
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Lumenia is a guided learning platform. Mentora is your child's learning guide.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {(Object.entries(mainRoleConfig) as [MainRoleOption, typeof mainRoleConfig.student][]).map(([role, config]) => {
            const Icon = config.icon;
            const isSelected = selectedRole === role;
            
            return (
              <Card 
                key={role}
                className={`cursor-pointer transition-all duration-200 ${config.hoverColor} ${
                  isSelected ? `border-2 ${config.textColor} shadow-lg` : "border hover:shadow-md"
                }`}
                onClick={() => handleRoleSelect(role)}
                data-testid={`role-${role}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {config.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button 
          onClick={handleLogin}
          disabled={!selectedRole}
          className="w-full h-12 text-base"
          data-testid="continue-login"
        >
          {selectedRole ? (
            <>
              Continue as {mainRoleConfig[selectedRole].title}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Select a role to continue"
          )}
        </Button>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setLocation("/admin/login")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="admin-login-link"
          >
            <Shield className="inline-block h-3 w-3 mr-1" />
            Admin Login
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          © Lumenia · Terms of Service · Privacy Policy
        </p>
      </div>
    </div>
  );
}

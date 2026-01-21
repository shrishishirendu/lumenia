import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Classroom from "@/pages/Classroom";
import Dashboard from "@/pages/Dashboard";
import ParentPortal from "@/pages/ParentPortal";
import Growth from "@/pages/Growth";
import Onboarding from "@/pages/Onboarding";
import AdminPanel from "@/pages/AdminPanel";
import TutorDashboard from "@/pages/TutorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import Orchestration from "@/pages/Orchestration";
import MarketingAgent from "@/pages/MarketingAgent";
import OpsAgent from "@/pages/OpsAgent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/classroom" component={Classroom} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/orchestration" component={Orchestration} />
      <Route path="/marketing-agent" component={MarketingAgent} />
      <Route path="/ops-agent" component={OpsAgent} />
      <Route path="/tutor" component={TutorDashboard} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/parent" component={ParentPortal} />
      <Route path="/growth" component={Growth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

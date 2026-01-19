import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Classroom from "@/pages/Classroom";
import Dashboard from "@/pages/Dashboard";
import ParentPortal from "@/pages/ParentPortal";
import Growth from "@/pages/Growth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/classroom" component={Classroom} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/parent" component={ParentPortal} />
      <Route path="/growth" component={Growth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

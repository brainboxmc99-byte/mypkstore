import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { LandingPage } from "@/pages/landing";
import { AdminLogin } from "@/pages/admin-login";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { ShopLogin } from "@/pages/shop-login";
import { ShopDashboard } from "@/pages/shop-dashboard";
import { PublicStore } from "@/pages/public-store";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/login" component={ShopLogin} />
      <Route path="/dashboard" component={ShopDashboard} />
      <Route path="/store/:slug" component={PublicStore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

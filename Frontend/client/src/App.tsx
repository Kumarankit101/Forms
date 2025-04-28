import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FormList from "@/pages/FormList";
import CreateForm from "@/pages/CreateForm";
import FormPreview from "@/pages/FormPreview";
import FormResponses from "@/pages/FormResponses";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/form/:id" component={FormPreview} />
      <ProtectedRoute path="/" component={FormList} />
      <ProtectedRoute path="/create" component={CreateForm} />
      <ProtectedRoute path="/edit/:id" component={CreateForm} />
      <ProtectedRoute path="/form/:id/responses" component={FormResponses} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;

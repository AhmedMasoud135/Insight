import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Home from "./pages/Home";
import Papers from "./pages/Papers";
import PaperDetails from "./pages/PaperDetails";
import Fields from "./pages/Fields";
import FieldDetails from "./pages/FieldDetails";
import Authors from "./pages/Authors";
import AuthorProfile from "./pages/AuthorProfile";
import AIAssistant from "./pages/AIAssistant";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Company from "./pages/Company";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Home} />
      <Route path="/papers" component={Papers} />
      <Route path="/fields" component={Fields} />
      <Route path="/authors" component={Authors} />
      <Route path="/company" component={Company} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/about" component={About} />
      <Route path="/careers" component={Careers} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />

      {/* Protected pages */}
      <Route
        path="/papers/:id"
        component={() => (
          <ProtectedRoute>
            <PaperDetails />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/fields/:id"
        component={() => (
          <ProtectedRoute>
            <FieldDetails />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/authors/:id"
        component={() => (
          <ProtectedRoute>
            <AuthorProfile />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/ai-assistant"
        component={() => (
          <ProtectedRoute>
            <AIAssistant />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/profile"
        component={() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/settings"
        component={() => (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        )}
      />

      {/* 404 fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

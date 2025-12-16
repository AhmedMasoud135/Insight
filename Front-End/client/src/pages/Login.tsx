import MainLayout from "@/layouts/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API_BASE = 'http://localhost:5000/api';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLocation("/");
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please provide email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store all user data in localStorage
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("userId", data.data.user.userId.toString());
        localStorage.setItem("userName", data.data.user.name);
        localStorage.setItem("userEmail", data.data.user.email);
        localStorage.setItem("userRole", data.data.user.role);

        // Dispatch custom event to notify navbar of auth change
        window.dispatchEvent(new Event("insight:auth-changed"));
        
        toast.success("Logged in successfully");
        setLocation("/");
      } else {
        toast.error(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md py-16">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">WELCOME BACK</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in to your account to continue
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="rounded-none mt-2 h-11"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="rounded-none mt-2 h-11"
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>
          
          <Button 
            className="rounded-none w-full h-11 mt-6 font-semibold" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a className="text-primary underline font-medium hover:text-primary/80" href="/signup">
            Create one
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
import MainLayout from "@/layouts/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API_BASE = 'http://localhost:5000/api';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLocation("/");
    }

    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !affiliation || !specialization) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          role: 'Researcher',
          affiliation,
          specialization
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Account created successfully! Please login.");
        setTimeout(() => {
          setLocation("/login");
        }, 1000);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-3xl py-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">CREATE ACCOUNT</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign up to start exploring research papers
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name and Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="rounded-none mt-2 h-11"
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
            
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
          </div>

          {/* Row 2: Affiliation and Specialization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="affiliation" className="text-sm font-medium">
                Affiliation
              </Label>
              <Input 
                id="affiliation" 
                value={affiliation} 
                onChange={(e) => setAffiliation(e.target.value)} 
                className="rounded-none mt-2 h-11"
                placeholder="e.g., University, Research Institute"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="specialization" className="text-sm font-medium">
                Specialization
              </Label>
              <Input 
                id="specialization" 
                value={specialization} 
                onChange={(e) => setSpecialization(e.target.value)} 
                className="rounded-none mt-2 h-11"
                placeholder="e.g., Machine Learning, Quantum Physics"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          {/* Row 3: Password and Confirm Password */}
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="Create a password"
                disabled={loading}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="rounded-none mt-2 h-11"
                placeholder="Re-enter your password"
                disabled={loading}
                required
                minLength={6}
              />
            </div>
          </div>
          
          <Button 
            className="rounded-none w-full h-11 mt-6 font-semibold" 
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a className="text-primary underline font-medium hover:text-primary/80" href="/login">
            Sign in
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
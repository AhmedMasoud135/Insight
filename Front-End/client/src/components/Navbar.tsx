import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  BookOpen, 
  Users, 
  Layers, 
  Bot,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_BASE = 'http://localhost:5000/api';

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem("token"));
    } catch {
      return false;
    }
  });
  const [userName, setUserName] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  const navLinks = [
    { name: "Home", path: "/", icon: null },
    { name: "Papers", path: "/papers", icon: BookOpen },
    { name: "Fields", path: "/fields", icon: Layers },
    { name: "Authors", path: "/authors", icon: Users },
    { name: "AI Assistant", path: "/ai-assistant", icon: Bot },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const fetchUserPhoto = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success && data.data.photo) {
        setUserPhoto(`data:image/jpeg;base64,${data.data.photo}`);
      } else {
        setUserPhoto(null);
      }
    } catch (error) {
      console.error('Failed to fetch user photo:', error);
      setUserPhoto(null);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
    } catch {}
    setIsLoggedIn(false);
    setUserName("");
    setUserPhoto(null);
    window.dispatchEvent(new Event("insight:auth-changed"));
    setLocation("/login");
  };

  useEffect(() => {
    const updateAuthState = () => {
      const token = localStorage.getItem("token");
      const name = localStorage.getItem("userName") || "";
      setIsLoggedIn(Boolean(token));
      setUserName(name);
      
      if (token) {
        fetchUserPhoto();
      } else {
        setUserPhoto(null);
      }
    };

    updateAuthState();

    const handler = () => {
      updateAuthState();
    };

    window.addEventListener("insight:auth-changed", handler);
    
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "userName") {
        updateAuthState();
      }
    };
    
    window.addEventListener("storage", storageHandler);
    
    return () => {
      window.removeEventListener("insight:auth-changed", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <div className="h-8 w-8 bg-primary flex items-center justify-center text-primary-foreground">
                <span className="text-lg">In</span>
              </div>
              <span>Insight</span>
            </a>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path}>
              <a
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                  location === link.path
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.name}
              </a>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userPhoto || undefined} alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {localStorage.getItem("userEmail")}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setLocation("/login")}
            >
              Login
            </Button>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 absolute w-full h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted",
                    location === link.path
                      ? "bg-muted text-primary border-l-2 border-primary"
                      : "text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon && <link.icon className="h-5 w-5" />}
                  {link.name}
                </a>
              </Link>
            ))}

            <div className="border-t border-border my-2 pt-4">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <div className="px-4 py-2 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userPhoto || undefined} alt={userName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {localStorage.getItem("userEmail")}
                      </p>
                    </div>
                  </div>
                  <Link href="/profile">
                    <a 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </a>
                  </Link>
                  <Link href="/settings">
                    <a 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </a>
                  </Link>
                  <button 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-muted w-full text-left"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              ) : (
                <Button 
                  className="w-full rounded-none"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setLocation("/login");
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
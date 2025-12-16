import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowRight, FileText, Users, Layers, TrendingUp, MessageCircle } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

interface Statistics {
  totalPapers: number;
  totalFields: number;
  totalAuthors: number;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statistics, setStatistics] = useState<Statistics>({
    totalPapers: 0,
    totalFields: 0,
    totalAuthors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/statistics/overview');
        const data = await response.json();
        if (data.success) {
          setStatistics({
            totalPapers: data.data.totalPapers || 0,
            totalFields: data.data.totalFields || 0,
            totalAuthors: data.data.totalAuthors || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    const searchUrl = `/papers?search=${encodeURIComponent(trimmedQuery)}`;
    setLocation(searchUrl);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        fetch('http://localhost:5000/api/interactions/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ query: trimmedQuery }),
        }).catch(error => console.error('Error saving search:', error));
      } catch (error) {
        console.error('Error initiating search save:', error);
      }
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K+';
    return num.toString();
  };

  return (
    <MainLayout>
      <section className="relative border-b border-border bg-background overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/images/grid-texture.png')] bg-repeat opacity-50"></div>
        </div>

        <div className="container relative z-10 min-h-[calc(100vh-4rem)] flex items-center py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
                HARD <span className="text-primary">SCIENCE.</span><br />
                CLEAR <span className="text-primary">INSIGHTS.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Explore research, connect with experts, and gain insights with AI.
              </p>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for papers, topics, or authors..."
                    className="pl-10 h-12 rounded-none border-primary/20 focus-visible:ring-primary bg-background/80 backdrop-blur w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 rounded-none px-8 text-base font-semibold mt-2 sm:mt-0">
                  Search
                </Button>
              </form>
              <div className="pt-4 flex items-center gap-8 text-sm text-muted-foreground font-mono">
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-foreground"></div><span>OPEN ACCESS</span></div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-foreground"></div><span>PEER REVIEWED</span></div>
                <div className="flex items-center gap-2"><div className="w-1 h-1 bg-foreground"></div><span>AI ENHANCED</span></div>
              </div>
            </div>

            <div className="relative hidden lg:flex w-full h-[70vh] p-0 justify-center overflow-hidden">
              <div className="absolute inset-0 w-full h-full">
                <img
                  src="/images/hero-bg.png"
                  alt="Hero"
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/30 dark:bg-black/40 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border bg-background shadow-sm hover:shadow-lg transition-all duration-300 rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Total Papers
                  <FileText className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">{loading ? '...' : formatNumber(statistics.totalPapers)}</div>
                <p className="text-xs text-muted-foreground mt-2">Across {loading ? '...' : statistics.totalFields} disciplines</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background shadow-sm hover:shadow-lg transition-all duration-300 rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Authors
                  <Users className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">{loading ? '...' : formatNumber(statistics.totalAuthors)}</div>
                <p className="text-xs text-muted-foreground mt-2">Active contributors</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background shadow-sm hover:shadow-lg transition-all duration-300 rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Fields
                  <Layers className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">{loading ? '...' : statistics.totalFields}</div>
                <p className="text-xs text-muted-foreground mt-2">Specialized categories</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <Card className="border-border rounded-none overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="p-12 md:p-16">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">AI Assistant</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-2xl">
                Supercharge Your Research with AI
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl">
                Get instant insights, find relevant papers, and accelerate your discovery process with our intelligent assistant.
              </p>
              <Link href="/ai-assistant">
                <Button size="lg" className="rounded-none font-bold h-12 px-8 group">
                  Launch AI Assistant
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-24 bg-background border-b border-border">
        <div className="container">
          <Card className="border-border rounded-none overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="p-12 md:p-16">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">Explore Knowledge</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-2xl">
                Ready to explore the frontier of knowledge?
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl">
                Join thousands of researchers who use Insight to accelerate their discovery process.
              </p>
              <Link href="/papers">
                <Button size="lg" className="rounded-none font-bold h-12 px-8 group">
                  Explore Papers
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}

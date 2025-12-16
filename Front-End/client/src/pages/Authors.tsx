import { Link } from "wouter";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, BookOpen, ArrowRight, Loader2, Users, Search, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Author {
  Author_ID: number;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Country: string;
  Paper_Count: number;
  Has_Picture: number;
}

export default function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, [page, appliedSearch]);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const searchParam = appliedSearch ? `&search=${encodeURIComponent(appliedSearch)}` : '';

      const response = await fetch(
        `http://localhost:5000/api/authors?page=${page}&limit=12${searchParam}`,
        { headers }
      );

      if (!response.ok) throw new Error('Failed to fetch authors');
      const result = await response.json();

      if (result.success) {
        setAuthors(result.data.authors);
        setTotalPages(result.data.pagination.pages);
        setIsSearching(!!appliedSearch);
      } else {
        throw new Error(result.message || 'Failed to load authors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const trimmed = searchQuery.trim();
    setAuthors([]);
    setAppliedSearch(trimmed);
    setPage(1);

    const token = localStorage.getItem('token');
    if (token && trimmed) {
      try {
        await fetch('http://localhost:5000/api/interactions/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ query: trimmed }),
        });
      } catch (err) {
        console.warn('Search logging failed:', err);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setIsSearching(false);
    setPage(1);
  };

  const getInitials = (first: string, last: string) => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();

  const getAuthorImageUrl = (authorId: number, hasPicture: number) => {
    if (hasPicture) {
      return `http://localhost:5000/api/authors/${authorId}/image`;
    }
    return "/images/avatar-placeholder.png";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-12 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-12">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">AUTHORS</h1>
          <p className="text-muted-foreground">Explore our distinguished community of research authors.</p>

          <div className="flex gap-2 mt-6 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 rounded-none"
              />
            </div>
            <Button onClick={handleSearch} className="rounded-none">Search</Button>
            {isSearching && (
              <Button onClick={clearSearch} variant="outline" className="rounded-none">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isSearching && (
            <p className="text-sm text-muted-foreground mt-3">
              Found {authors.length} author{authors.length !== 1 ? 's' : ''} matching "{appliedSearch}"
            </p>
          )}
        </div>

        {authors.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isSearching ? 'No authors found matching your search.' : 'No authors available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author) => (
              <Link key={author.Author_ID} href={`/authors/${author.Author_ID}`}>
                <div className="group h-full">
                  <Card className="h-full border-border rounded-none transition-all hover:border-primary hover:shadow-md flex flex-col cursor-pointer">
                    <CardHeader className="pb-4 flex flex-row items-center gap-4">
                      <Avatar className="h-16 w-16 rounded-none border">
                        <AvatarImage 
                          src={getAuthorImageUrl(author.Author_ID, author.Has_Picture)} 
                          alt={`${author.First_Name} ${author.Last_Name}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold group-hover:bg-primary group-hover:text-white">
                          {getInitials(author.First_Name, author.Last_Name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-bold group-hover:text-primary">
                          {author.First_Name} {author.Last_Name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{author.Email}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {author.Country || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {author.Paper_Count} {author.Paper_Count === 1 ? 'Publication' : 'Publications'}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 border-t mt-auto p-4 bg-muted/5 group-hover:bg-primary/5 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">View Profile</span>
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </CardFooter>
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-none disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>
            <span className="px-4 py-2 border">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-none disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
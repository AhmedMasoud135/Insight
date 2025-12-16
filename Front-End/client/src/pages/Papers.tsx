import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Paper {
  Paper_ID: number;
  Title: string;
  Abstract: string;
  Publication_Date: string;
  Field_Name: string;
  Field_ID?: number;
  Download_Count: number;
  Average_Rating: number;
  Review_Count?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const API_BASE = 'http://localhost:5000/api';
const CACHE_DURATION = 5 * 60 * 1000;

const cache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export default function Papers() {
  const [location, setLocation] = useLocation();
  

  
  const getSearchFromUrl = () => {
    const urlParts = location.split('?');
    const urlParams = urlParts[1];
    
    if (!urlParams) {
      return '';
    }
    
    const params = new URLSearchParams(urlParams);
    const search = params.get('search') || '';
    
    return search;
  };
 
  const [searchTerm, setSearchTerm] = useState(getSearchFromUrl());
  const [activeSearch, setActiveSearch] = useState(getSearchFromUrl());
  const [papers, setPapers] = useState<Paper[]>([]);
  const [topRatedPapers, setTopRatedPapers] = useState<Paper[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTopRatedPapers = useCallback(async () => {
    try {
      const cacheKey = 'top-rated-papers';
      const cached = getCachedData(cacheKey);
     
      if (cached) {
        return cached;
      }
      const response = await fetch(`${API_BASE}/papers/top-rated/by-field?limit=3`);
      const data = await response.json();
      if (data.success) {
        setCachedData(cacheKey, data.data.papers);
        return data.data.papers;
      }
      return [];
    } catch (error) {
      console.error('Error fetching top-rated papers:', error);
      return [];
    }
  }, []);

  const fetchPapers = useCallback(async (page: number, search: string = '') => {
    setLoading(true);
    try {
      const cacheKey = `papers-${page}-${search}`;
      const cached = getCachedData(cacheKey);
     
      if (cached) {
        setPapers(cached.papers);
        setPagination(cached.pagination);
        setTopRatedPapers(cached.topRated || []);
        setLoading(false);
        return;
      }

      let url: string;
      
      if (search.trim()) {
        url = `${API_BASE}/papers/search/query?q=${encodeURIComponent(search)}&page=${page}&limit=12`;
      } else {
        url = `${API_BASE}/papers?page=${page}&limit=12`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        let displayPapers = data.data.papers;
        let topRated: Paper[] = [];

        if (page === 1 && !search.trim()) {
          topRated = await fetchTopRatedPapers();
         
          const topRatedSlice = topRated.slice(0, 9);
         
          const topRatedIds = new Set(topRatedSlice.map(p => p.Paper_ID));
         
          const filteredPapers = displayPapers.filter((p: Paper) => !topRatedIds.has(p.Paper_ID));
         
          displayPapers = [...topRatedSlice, ...filteredPapers];
         
          displayPapers = displayPapers.slice(0, 12);
        }

        setPapers(displayPapers);
        setTopRatedPapers(topRated);
        setPagination(data.data.pagination);
        setCachedData(cacheKey, {
          papers: displayPapers,
          pagination: data.data.pagination,
          topRated
        });
      } else {
        console.error('API returned success: false', data);
        setPapers([]);
        setPagination({ page: 1, limit: 12, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      setPapers([]);
      setPagination({ page: 1, limit: 12, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [fetchTopRatedPapers]);

  useEffect(() => {
    const searchFromUrl = getSearchFromUrl();
    
    setSearchTerm(searchFromUrl);
    setActiveSearch(searchFromUrl);
    
    if (searchFromUrl || currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [location]);
  
  // Backup useEffect to check browser URL directly
  useEffect(() => {
    const browserSearchParams = new URLSearchParams(window.location.search);
    const browserSearch = browserSearchParams.get('search') || '';
    
    if (browserSearch && browserSearch !== activeSearch) {
      setActiveSearch(browserSearch);
      setSearchTerm(browserSearch);
      setCurrentPage(1);
    }
  }, [location, activeSearch]);

  useEffect(() => {
    if (currentPage === 1 && !activeSearch && papers.length > 0) {
      return;
    }
    
    fetchPapers(currentPage, activeSearch);
  }, [currentPage, activeSearch, fetchPapers]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedSearch = searchTerm.trim();
    
    setActiveSearch(trimmedSearch);
    setCurrentPage(1);

    if (trimmedSearch) {
      setLocation(`/papers?search=${encodeURIComponent(trimmedSearch)}`);
    } else {
      setLocation('/papers');
    }
   
    const token = localStorage.getItem('token');
    if (token && trimmedSearch) {
      try {
        await fetch(`${API_BASE}/interactions/search`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: trimmedSearch,
          }),
        });
      } catch (err) {
        console.error('Error saving search:', err);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant="ghost"
          size="sm"
          className="rounded-none w-9"
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="flex items-center justify-center w-9 text-muted-foreground">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "ghost"}
          size="sm"
          className="rounded-none w-9"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1) {
        pages.push(
          <span key="dots2" className="flex items-center justify-center w-9 text-muted-foreground">
            ...
          </span>
        );
      }
      pages.push(
        <Button
          key={pagination.pages}
          variant="ghost"
          size="sm"
          className="rounded-none w-9"
          onClick={() => handlePageChange(pagination.pages)}
        >
          {pagination.pages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-2">RESEARCH PAPERS</h1>
            <p className="text-muted-foreground">
              {activeSearch ? `Search results for "${activeSearch}"` : 'Browse the latest peer-reviewed publications.'}
            </p>
          </div>
         
          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, keywords, or field..."
                className="pl-10 rounded-none bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="rounded-none gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading papers...</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No papers found{activeSearch ? ` for "${activeSearch}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {papers.map((paper) => (
                <Link key={paper.Paper_ID} href={`/papers/${paper.Paper_ID}`}>
                  <a className="block h-full group">
                    <Card className="h-full border-border rounded-none transition-all duration-300 hover:border-primary hover:shadow-md flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <Badge
                            variant="secondary"
                            className="rounded-none font-mono text-[9px] leading-tight uppercase tracking-wide py-1 px-2 break-words whitespace-normal max-w-[75%]"
                          >
                            {paper.Field_Name || 'Unknown'}
                          </Badge>
                          {paper.Average_Rating > 0 && (
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold flex-shrink-0">
                              <Star className="h-3 w-3 fill-current" />
                              {paper.Average_Rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {paper.Title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {paper.Abstract}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span className="truncate">{formatDate(paper.Publication_Date)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Download className="h-3 w-3" />
                            {paper.Download_Count.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 border-t border-border/50 mt-auto p-4 bg-muted/10 group-hover:bg-primary/5 transition-colors">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">View Paper</span>
                      </CardFooter>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 border-t border-border pt-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-none"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">{renderPagination()}</div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-none"
                  disabled={currentPage === pagination.pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
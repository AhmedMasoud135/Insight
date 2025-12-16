import { useRoute, Link } from "wouter";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, FileText, Download, Loader2, Microscope } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotFound from "./NotFound";

interface Paper {
  Paper_ID: number;
  Title: string;
  Abstract: string;
  Publication_Date: string;
  Author_Count: number;
  Download_Count: number;
  Avg_Rating: number | null;
}

interface FieldData {
  Field_ID: number;
  Field_Name: string;
  Description: string;
  Paper_Count: number;
  papers: Paper[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function FieldDetails() {
  const [, params] = useRoute("/fields/:id");
  const [field, setField] = useState<FieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (params?.id) {
      fetchFieldDetails(params.id, page);
    }
  }, [params?.id, page]);

  const fetchFieldDetails = async (fieldId: string, pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/fields/${fieldId}?page=${pageNum}&limit=10`);
      
      if (response.status === 404) {
        setNotFound(true);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch field details');
      }

      const result = await response.json();
      
      if (result.success) {
        setField(result.data);
        setNotFound(false);
      } else {
        throw new Error(result.message || 'Failed to load field details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (notFound) return <NotFound />;

  if (loading && !field) {
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

  if (!field) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary flex items-center justify-center text-primary-foreground">
              <Microscope className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter">{field.Field_Name}</h1>
              <p className="text-muted-foreground font-mono">{field.Paper_Count.toLocaleString()} Papers Indexed</p>
            </div>
          </div>
          <p className="text-xl max-w-3xl leading-relaxed text-muted-foreground">
            {field.Description || "Explore cutting-edge research in this field."}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-primary block"></span>
            RECENT PAPERS
          </h2>
          <Link href="/papers">
            <Button variant="outline" className="rounded-none gap-2">
              View All Papers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {field.papers.length > 0 ? (
            field.papers.map((paper) => (
              <Link key={paper.Paper_ID} href={`/papers/${paper.Paper_ID}`}>
                <Card className="rounded-none border-border transition-all duration-300 hover:border-primary hover:shadow-md cursor-pointer">
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                        {paper.Title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {paper.Abstract || "No abstract available."}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span>{formatDate(paper.Publication_Date)}</span>
                        <span>•</span>
                        <span>{paper.Author_Count} {paper.Author_Count === 1 ? 'Author' : 'Authors'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border pt-4 md:pt-0">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="font-bold flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {paper.Download_Count >= 1000 
                            ? `${(paper.Download_Count / 1000).toFixed(1)}k`
                            : paper.Download_Count}
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground">Downloads</span>
                      </div>
                      <Button size="sm" className="rounded-none">Read</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-border bg-muted/10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No papers found in this field yet.</p>
            </div>
          )}
        </div>

        {field.pagination && field.pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-none disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 border border-border">
              Page {field.pagination.page} of {field.pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(field.pagination.pages, p + 1))}
              disabled={page === field.pagination.pages}
              className="px-4 py-2 border border-border rounded-none disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
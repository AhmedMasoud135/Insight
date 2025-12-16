import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Star, Calendar, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import NotFound from "./NotFound";

const API_BASE = 'http://localhost:5000/api';

interface Author {
  Author_ID: number;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Country: string;
}

interface Review {
  Review_ID: number;
  Rating: number;
  Review_Date: string;
  Researcher_ID: number;
  User_Name: string;
}

interface Paper {
  Paper_ID: number;
  Title: string;
  Abstract: string;
  Publication_Date: string;
  Path: string;
  Field_ID: number;
  Field_Name: string;
  Download_Count: number;
  Average_Rating: number;
  Review_Count: number;
  authors: Author[];
  keywords: string;
  reviews: Review[];
}

export default function PaperDetails() {
  const [, params] = useRoute("/papers/:id");
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloadingPaper, setDownloadingPaper] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const isLoggedIn = !!localStorage.getItem('token');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (params?.id) {
      fetchPaperDetails(params.id);
    }
  }, [params?.id]);

  const fetchPaperDetails = async (paperId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/papers/${paperId}`);
      const data = await response.json();

      if (data.success) {
        setPaper(data.data);
      } else {
        toast.error('Failed to load paper details');
      }
    } catch (error) {
      console.error('Error fetching paper:', error);
      toast.error('Failed to load paper details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to download papers');
      return;
    }

    if (!paper) return;

    setDownloadingPaper(true);
    try {
      const response = await fetch(`${API_BASE}/papers/${paper.Paper_ID}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Open the paper path in a new tab
        if (data.data.path) {
          window.open(data.data.path, '_blank');
        }
        
        // Refresh paper data to update download count (silently)
        fetchPaperDetails(paper.Paper_ID.toString());
      } else {
        toast.error(data.message || 'Failed to download paper');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download paper');
    } finally {
      setDownloadingPaper(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to submit reviews');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!paper) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_BASE}/papers/${paper.Paper_ID}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setDialogOpen(false);
        setRating(0);
        
        // Refresh paper data to show new review
        fetchPaperDetails(paper.Paper_ID.toString());
      } else {
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };


  if (loading) {
    return (
      <MainLayout>
        <div className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading paper details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!paper) return <NotFound />;

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <Badge className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-3 py-1">
                {paper.Field_Name}
              </Badge>
              <span className="text-muted-foreground font-mono text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(paper.Publication_Date)}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight mb-6">
              {paper.Title}
            </h1>
            
            <div className="flex flex-wrap gap-6 items-center text-sm mb-8">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {paper.authors.map(a => `${a.First_Name} ${a.Last_Name}`).join(", ")}
                </span>
              </div>
              {paper.Average_Rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  {paper.Average_Rating.toFixed(1)} 
                  <span className="text-muted-foreground font-normal">
                    ({paper.Review_Count} {paper.Review_Count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-4 w-4" />
                {paper.Download_Count.toLocaleString()} downloads
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="rounded-none gap-2 h-12 px-8"
                onClick={handleDownload}
                disabled={downloadingPaper || !isLoggedIn}
              >
                {downloadingPaper ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download PDF
                  </>
                )}
              </Button>
              
              {isLoggedIn ? (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="rounded-none gap-2 h-12">
                      <Star className="h-5 w-5" />
                      Rate Paper
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-none sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Submit Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2 justify-center mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-1 transition-colors ${rating >= star ? 'text-amber-500' : 'text-muted-foreground'}`}
                            disabled={submittingReview}
                          >
                            <Star className={`h-8 w-8 ${rating >= star ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                      <Button
                        className="w-full rounded-none"
                        onClick={handleSubmitReview}
                        disabled={submittingReview || rating === 0}
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Rating'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-none gap-2 h-12"
                  onClick={() => toast.info('Please login to rate papers')}
                >
                  <Star className="h-5 w-5" />
                  Rate Paper
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary block"></span>
                ABSTRACT
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {paper.Abstract}
              </p>
            </section>

            {paper.keywords && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary block"></span>
                  KEYWORDS
                </h2>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords.split(',').map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="rounded-none">
                      {keyword.trim()}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary block"></span>
                  RATINGS & REVIEWS
                </h2>
              </div>

              <div className="space-y-4">
                {paper.reviews.length > 0 ? (
                  paper.reviews.map((review) => (
                    <div key={review.Review_ID} className="flex items-center gap-3 p-4 border border-border rounded-none bg-muted/5">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{review.User_Name}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(review.Review_Date)}</div>
                      </div>
                      <div className="flex text-amber-500 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.Rating ? 'fill-current' : 'text-muted'}`} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-border bg-muted/5 rounded-none">
                    <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No ratings yet. Be the first to rate this paper!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-none border-border bg-muted/10">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest">Authors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paper.authors.map((author) => (
                  <div key={author.Author_ID} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <Link href={`/authors/${author.Author_ID}`}>
                      <a className="font-medium hover:text-primary transition-colors">
                        {author.First_Name} {author.Last_Name}
                      </a>
                    </Link>
                    {author.Country && (
                      <p className="text-xs text-muted-foreground mt-1">{author.Country}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-muted/10">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest">Paper Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">Downloads</span>
                  <span className="font-mono font-bold">{paper.Download_Count}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">Reviews</span>
                  <span className="font-mono font-bold">{paper.Review_Count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                  <span className="font-mono font-bold">
                    {paper.Average_Rating > 0 ? paper.Average_Rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
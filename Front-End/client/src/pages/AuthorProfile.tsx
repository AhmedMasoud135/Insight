import { useRoute } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, BookOpen, Star, Download, Mail } from "lucide-react";
import NotFound from "./NotFound";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

interface Author {
  Author_ID: number;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Country: string;
  Paper_Count: number;
  Has_Picture: number;
}

interface Paper {
  Paper_ID: number;
  Title: string;
  Abstract: string;
  Publication_Date: string;
  Field_Name: string;
  Download_Count: number;
  Avg_Rating: number;
}

interface AuthorData {
  Author_ID: number;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Country: string;
  Paper_Count: number;
  Has_Picture: number;
  papers: Paper[];
}

export default function AuthorProfile() {
  const [, params] = useRoute("/authors/:id");
  const [authorData, setAuthorData] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5000/api/authors/${params?.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Author not found');
          }
          throw new Error('Failed to fetch author');
        }

        const result = await response.json();
        if (result.success) {
          setAuthorData(result.data);
        } else {
          throw new Error(result.message || 'Failed to load author');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchAuthor();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-12 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !authorData) {
    return <NotFound />;
  }

  const { Author_ID, First_Name, Last_Name, Email, Country, Paper_Count, Has_Picture, papers } = authorData;
  const name = `${First_Name} ${Last_Name}`;

  const getAuthorImageUrl = (authorId: number, hasPicture: number) => {
    if (hasPicture) {
      return `http://localhost:5000/api/authors/${authorId}/image`;
    }
    return "/images/avatar-placeholder.png";
  };

  return (
    <MainLayout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-none border-2 border-background shadow-lg">
              <AvatarImage 
                src={getAuthorImageUrl(Author_ID, Has_Picture)} 
                alt={name}
                className="object-cover"
              />
              <AvatarFallback className="rounded-none bg-primary/10 text-primary text-4xl font-bold">
                {name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
           
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl font-bold tracking-tighter mb-2">{name}</h1>
              </div>
             
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {Country || 'Unknown'}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {Paper_Count} Publications
                </div>
              </div>
             
              <div className="flex gap-4 pt-2">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary block"></span>
                PUBLICATIONS
              </h2>
              <div className="space-y-4">
                {papers.length > 0 ? (
                  papers.map((paper) => (
                    <Link key={paper.Paper_ID} href={`/papers/${paper.Paper_ID}`}>
                      <a className="block group">
                        <Card className="rounded-none border-border transition-all duration-300 hover:border-primary hover:shadow-md">
                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                              {paper.Title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {paper.Abstract}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                                <span>{new Date(paper.Publication_Date).getFullYear()}</span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current text-amber-500" />
                                  {paper.Avg_Rating ? paper.Avg_Rating.toFixed(1) : 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {paper.Download_Count}
                                </span>
                              </div>
                              <Button size="sm" variant="ghost" className="rounded-none h-8">Read Paper</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-border bg-muted/10">
                    <p className="text-muted-foreground">No papers found for this author.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-none border-border bg-muted/10">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {Email}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
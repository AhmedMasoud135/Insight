import { Link } from "wouter";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, Loader2, Microscope, Cpu, Activity, Atom, TrendingUp, Building2, Scale, Brain, FlaskConical, Dna } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Field {
  Field_ID: number;
  Field_Name: string;
  Description: string;
  Paper_Count: number;
}

export default function Fields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFields();
  }, [page]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/fields?page=${page}&limit=12`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      const result = await response.json();
      if (result.success) {
        setFields(result.data.fields);
        setTotalPages(result.data.pagination.pages);
      } else {
        throw new Error(result.message || 'Failed to load fields');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (fieldName: string) => {
    const name = fieldName.toLowerCase();
    if (name.includes('computer') || name.includes('software')) return Cpu;
    if (name.includes('biology') || name.includes('life')) return Dna;
    if (name.includes('physics')) return Atom;
    if (name.includes('chemistry')) return FlaskConical;
    if (name.includes('medicine') || name.includes('health')) return Activity;
    if (name.includes('psychology') || name.includes('cognitive')) return Brain;
    if (name.includes('economics') || name.includes('finance')) return TrendingUp;
    if (name.includes('engineering')) return Building2;
    if (name.includes('law') || name.includes('legal')) return Scale;
    return Microscope;
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
          <h1 className="text-4xl font-bold tracking-tighter mb-2">RESEARCH FIELDS</h1>
          <p className="text-muted-foreground">Explore papers by scientific discipline.</p>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border bg-muted/10">
            <Microscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No research fields found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => {
              const FieldIcon = getFieldIcon(field.Field_Name);
              return (
                <Link key={field.Field_ID} href={`/fields/${field.Field_ID}`}>
                  <a className="group h-full block">
                    <Card className="h-full border-border rounded-none transition-all duration-300 hover:border-primary hover:shadow-md flex flex-col cursor-pointer">
                      <CardHeader className="pb-4">
                        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <FieldIcon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {field.Field_Name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-muted-foreground mb-4">
                          {field.Description || "No description available."}
                        </p>
                        <div className="text-sm font-mono text-muted-foreground">
                          {field.Paper_Count.toLocaleString()} Papers
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 border-t border-border/50 mt-auto p-4 bg-muted/10 group-hover:bg-primary/5 transition-colors flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Explore Field</span>
                        <ArrowRight className="h-4 w-4 text-primary transform group-hover:translate-x-1 transition-transform" />
                      </CardFooter>
                    </Card>
                  </a>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-none disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 border border-border">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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

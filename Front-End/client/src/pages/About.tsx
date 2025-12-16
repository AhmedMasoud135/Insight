import MainLayout from "@/layouts/MainLayout";

export default function About() {
  return (
    <MainLayout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>
        <p className="text-muted-foreground mb-6">We are a team dedicated to advancing scientific discovery through tooling, data and community.</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">What we do</h2>
          <p className="text-sm text-muted-foreground">We collect, index and enrich scientific literature, and provide tools that help researchers find, understand and act on results faster.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-border bg-background">
            <h3 className="font-semibold">Open Data</h3>
            <p className="text-sm text-muted-foreground">We prioritize open datasets and reproducible methods.</p>
          </div>
          <div className="p-4 border border-border bg-background">
            <h3 className="font-semibold">AI Research</h3>
            <p className="text-sm text-muted-foreground">We build models and tools to help synthesize literature responsibly.</p>
          </div>
          <div className="p-4 border border-border bg-background">
            <h3 className="font-semibold">Community</h3>
            <p className="text-sm text-muted-foreground">We support researchers with integrations, APIs and outreach programs.</p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

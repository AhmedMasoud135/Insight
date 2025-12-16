import MainLayout from "@/layouts/MainLayout";
import { Link } from "wouter";

export default function Company() {
  return (
    <MainLayout>
      <div className="container py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Company</h1>
          <p className="text-muted-foreground mt-2">Insight builds tools to accelerate scientific discovery — combining open data, rigorous engineering, and AI.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div>
            <h3 className="font-semibold mb-2">Mission</h3>
            <p className="text-sm text-muted-foreground">Make high-quality research discoverable and actionable by researchers and organizations worldwide.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Vision</h3>
            <p className="text-sm text-muted-foreground">A world where complex scientific knowledge is accessible and usable for real-world impact.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Values</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Open science</li>
              <li>Reproducibility</li>
              <li>Integrity</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Leadership</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Aisha Khan', role: 'CEO' },
              { name: 'Marco Silva', role: 'CTO' },
              { name: 'Lina Park', role: 'Head of Research' },
            ].map((m) => (
              <div key={m.name} className="p-4 border border-border rounded-none bg-background">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3 text-sm font-bold">{m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.role}</div>
              </div>
            ))}
          </div>
        </section>

        <Link href="/careers">
          <a className="inline-block text-primary hover:underline">See open positions →</a>
        </Link>
      </div>
    </MainLayout>
  );
}

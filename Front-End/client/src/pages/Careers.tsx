import MainLayout from "@/layouts/MainLayout";

const jobs = [
  { id: 'eng-1', title: 'Fullstack Engineer', location: 'Remote', team: 'Engineering' },
  { id: 'rd-1', title: 'Research Scientist (NLP)', location: 'Remote', team: 'Research' },
  { id: 'pm-1', title: 'Product Manager', location: 'Remote', team: 'Product' },
];

export default function Careers() {
  return (
    <MainLayout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4">Careers</h1>
        <p className="text-muted-foreground mb-8">We’re building tools that help researchers. Join us — we value curiosity, rigor and ownership.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="p-6 border border-border bg-background">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{job.title}</div>
                  <div className="text-sm text-muted-foreground">{job.team} — {job.location}</div>
                </div>
                <a href={`mailto:officialshoraky@gmail.com?subject=Apply%20${encodeURIComponent(job.title)}`} className="text-primary">Apply</a>
              </div>
              <p className="text-sm text-muted-foreground">This role works closely with research and product teams to ship features and experiments.</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

import MainLayout from "@/layouts/MainLayout";

export default function Privacy() {
  return (
    <MainLayout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Data we collect</h2>
          <p className="text-sm text-muted-foreground">We collect information you provide (e.g., contact messages) and limited analytics to improve the product.</p>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">How we use data</h2>
          <p className="text-sm text-muted-foreground">Data is used to operate and improve the service, investigate issues, and communicate with users.</p>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Security</h2>
          <p className="text-sm text-muted-foreground">We follow common best practices to protect your data, but please do not share sensitive personal or private health information.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Contact</h2>
          <p className="text-sm text-muted-foreground">Questions about privacy? Email <a href="mailto:officialshoraky@gmail.com" className="text-primary">officialshoraky@gmail.com</a>.</p>
        </section>
      </div>
    </MainLayout>
  );
}

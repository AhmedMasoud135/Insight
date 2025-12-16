import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name || !email || !message) {
      setStatus("Please fill in all fields");
      return;
    }

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus("Email service is not configured. Please contact the administrator.");
      console.error("Missing EmailJS environment variables");
      return;
    }

    setIsLoading(true);
    setStatus("");

    const templateParams = {
      from_name: name,
      from_email: email,
      message: message,
      to_email: "officialshoraky@gmail.com"
    };

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );
      
      setStatus("Message sent successfully! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("EmailJS Error:", error);
      setStatus("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="container py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground mb-6">
          Have questions or want to partner with us? Send a message and we'll get back to you.
        </p>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <div className="grid gap-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-input px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full border border-input px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                className="w-full border border-input px-3 py-2 h-32 resize-none rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
                required
              />
            </div>

            {status && (
              <div
                className={`p-3 text-sm rounded-md ${
                  status.includes("success")
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : status.includes("Failed")
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                }`}
              >
                {status}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
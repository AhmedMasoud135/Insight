import { Link } from "wouter";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tighter mb-4">
              <div className="h-8 w-8 bg-primary flex items-center justify-center text-primary-foreground">
                <span className="text-lg">In</span>
              </div>
              <span>Insight</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Advancing scientific discovery through open access, rigorous data analysis, and AI-powered insights.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/papers"><a className="hover:text-primary transition-colors">Papers</a></Link></li>
              <li><Link href="/fields"><a className="hover:text-primary transition-colors">Fields</a></Link></li>
              <li><Link href="/authors"><a className="hover:text-primary transition-colors">Authors</a></Link></li>
              <li><Link href="/ai-assistant"><a className="hover:text-primary transition-colors">AI Assistant</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about"><a className="hover:text-primary transition-colors">About Us</a></Link></li>
              <li><Link href="/careers"><a className="hover:text-primary transition-colors">Careers</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-primary transition-colors">Contact</a></Link></li>
              <li><Link href="/privacy"><a className="hover:text-primary transition-colors">Privacy Policy</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Connect</h3>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/shorakyy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/M7mdAhmd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/mohamed-elshoraky/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:officialshoraky@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {new Date().getFullYear()} INSIGHT PLATFORM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}

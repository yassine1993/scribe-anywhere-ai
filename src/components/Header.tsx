import { Button } from "@/components/ui/button";
import { Mic, Settings, User, CreditCard } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                TranscribeAI
              </h1>
              <p className="text-xs text-muted-foreground">Professional Transcription</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#languages" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Languages
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button variant="hero" size="sm">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
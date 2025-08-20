import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Upload, Globe, Shield, Zap, Users } from "lucide-react";
import heroImage from "@/assets/hero-transcription.jpg";

const HeroSection = () => {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-br from-background via-background to-ai-primary/5 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={heroImage} 
          alt="AI transcription technology visualization" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      
      <div className="container mx-auto text-center relative z-10">
        <Badge variant="secondary" className="mb-6 px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          99.8% Accuracy • GPU-Powered • Real-time Processing
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
          AI-Powered Transcription
          <br />
          That Actually Works
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Transform audio and video into accurate transcripts in minutes, not hours. 
          Support for 98+ languages, unlimited processing, and professional-grade features 
          trusted by podcasters, journalists, and teams worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="hero" size="lg" className="text-lg px-8 py-6">
            <Upload className="w-5 h-5 mr-2" />
            Start Transcribing Free
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6">
            <Play className="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-card rounded-xl flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-ai-primary" />
            </div>
            <h3 className="font-semibold mb-1">98+ Languages</h3>
            <p className="text-sm text-muted-foreground">Global support</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-card rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-ai-primary" />
            </div>
            <h3 className="font-semibold mb-1">Enterprise Security</h3>
            <p className="text-sm text-muted-foreground">End-to-end encryption</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-card rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-ai-primary" />
            </div>
            <h3 className="font-semibold mb-1">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">GPU acceleration</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-card rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-ai-primary" />
            </div>
            <h3 className="font-semibold mb-1">Team Ready</h3>
            <p className="text-sm text-muted-foreground">Collaboration tools</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
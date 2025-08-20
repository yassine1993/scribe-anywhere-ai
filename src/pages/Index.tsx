import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import UploadInterface from "@/components/UploadInterface";
import PricingSection from "@/components/PricingSection";
import LanguageSection from "@/components/LanguageSection";
import StructuredData from "@/components/StructuredData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData />
      <Header />
      <HeroSection />
      <UploadInterface />
      <FeaturesSection />
      <LanguageSection />
      <PricingSection />
      
      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/20">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              TranscribeAI
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional AI transcription for podcasters, journalists, educators, and teams. 
              Fast, accurate, and unlimited.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#languages" className="text-muted-foreground hover:text-foreground">Languages</a>
            <a href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="/terms" className="text-muted-foreground hover:text-foreground">Terms</a>
            <a href="/support" className="text-muted-foreground hover:text-foreground">Support</a>
          </div>
          
          <div className="border-t pt-8">
            <p className="text-sm text-muted-foreground">
              © 2024 TranscribeAI. All rights reserved. Built with ❤️ for content creators worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

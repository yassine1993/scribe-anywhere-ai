import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  FileText, 
  Users, 
  Shield, 
  Wand2, 
  Download, 
  Edit3, 
  Clock,
  Headphones,
  Languages
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Globe,
      title: "98+ Languages Supported",
      description: "From English and Spanish to Mandarin and Arabic. Automatic language detection included.",
      color: "text-ai-primary",
      badge: "Universal"
    },
    {
      icon: Languages,
      title: "Translation to 130+ Languages",
      description: "Get your transcripts translated to any target language with professional quality.",
      color: "text-ai-secondary",
      badge: "Pro Feature"
    },
    {
      icon: Users,
      title: "Speaker Recognition",
      description: "Automatically identify and label different speakers, or manually customize speaker names.",
      color: "text-ai-accent",
      badge: "AI-Powered"
    },
    {
      icon: Wand2,
      title: "Audio Restoration",
      description: "Clean up background noise, enhance speech clarity, and improve overall audio quality.",
      color: "text-success",
      badge: "Advanced"
    },
    {
      icon: Edit3,
      title: "In-Browser Editing",
      description: "Edit transcripts directly in your browser with timestamp sync, speaker labels, and formatting.",
      color: "text-warning",
      badge: "Editor"
    },
    {
      icon: Download,
      title: "Multiple Export Formats",
      description: "Export as DOCX, PDF, TXT, CSV, SRT, VTT. Bulk export multiple files at once.",
      color: "text-ai-primary",
      badge: "Flexible"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "End-to-end encryption, secure file storage, and complete data privacy protection.",
      color: "text-destructive",
      badge: "Secure"
    },
    {
      icon: Clock,
      title: "Batch Processing",
      description: "Upload multiple files and process them simultaneously. Set priorities and manage queues.",
      color: "text-ai-secondary",
      badge: "Efficiency"
    }
  ];

  const exportFormats = [
    { name: "DOCX", description: "Microsoft Word documents" },
    { name: "PDF", description: "Portable Document Format" },
    { name: "TXT", description: "Plain text files" },
    { name: "CSV", description: "Comma-separated values" },
    { name: "SRT", description: "SubRip subtitle format" },
    { name: "VTT", description: "WebVTT subtitle format" }
  ];

  return (
    <section id="features" className="py-20 px-4 bg-gradient-to-br from-background to-ai-primary/5">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Headphones className="w-4 h-4 mr-2" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Everything You Need for
            <br />
            Professional Transcription
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From AI-powered accuracy to advanced editing tools, we've built every feature 
            you need to transform audio into professional transcripts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-card flex items-center justify-center`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Formats Highlight */}
        <Card className="bg-gradient-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Export in Any Format You Need</CardTitle>
            <CardDescription>
              Professional export options for every use case, from documents to subtitles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {exportFormats.map((format, index) => (
                <div key={index} className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="w-12 h-12 bg-ai-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6 text-ai-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{format.name}</h3>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FeaturesSection;
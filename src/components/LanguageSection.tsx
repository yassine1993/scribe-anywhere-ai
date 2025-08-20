import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowRight, Languages } from "lucide-react";

const LanguageSection = () => {
  const popularLanguages = [
    { name: "English", code: "en", region: "Global" },
    { name: "Spanish", code: "es", region: "España, América Latina" },
    { name: "French", code: "fr", region: "France, Canada" },
    { name: "German", code: "de", region: "Deutschland" },
    { name: "Mandarin", code: "zh", region: "中国" },
    { name: "Japanese", code: "ja", region: "日本" },
    { name: "Korean", code: "ko", region: "한국" },
    { name: "Portuguese", code: "pt", region: "Brasil, Portugal" },
    { name: "Italian", code: "it", region: "Italia" },
    { name: "Russian", code: "ru", region: "Россия" },
    { name: "Arabic", code: "ar", region: "العربية" },
    { name: "Hindi", code: "hi", region: "भारत" }
  ];

  const translationLanguages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Japanese", "Korean", "Chinese",
    "Arabic", "Hindi", "Dutch", "Polish", "Turkish", "Swedish", "Danish", "Norwegian", "Finnish", "Greek",
    "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay", "Filipino", "Czech", "Hungarian", "Romanian", "Bulgarian",
    "Croatian", "Serbian", "Slovak", "Slovenian", "Estonian", "Latvian", "Lithuanian", "Ukrainian", "Bengali",
    "Urdu", "Persian", "Swahili", "Yoruba", "Hausa", "Amharic", "Somali", "Zulu", "Afrikaans", "Xhosa"
  ];

  return (
    <section id="languages" className="py-20 px-4 bg-gradient-to-br from-ai-secondary/5 to-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Globe className="w-4 h-4 mr-2" />
            Global Support
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            98+ Languages Supported
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From major world languages to regional dialects, we support transcription and translation 
            for global content creators and international teams.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Transcription Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-card rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-ai-primary" />
                </div>
                Audio/Video Transcription
              </CardTitle>
              <CardDescription>
                High-accuracy transcription from speech to text in 98+ languages with automatic language detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {popularLanguages.map((lang, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{lang.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {lang.code}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{lang.region}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-ai-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  + 86 more languages including regional dialects and variants
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Translation Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-card rounded-lg flex items-center justify-center">
                  <Languages className="w-4 h-4 text-ai-secondary" />
                </div>
                Translation Output
              </CardTitle>
              <CardDescription>
                Translate your transcripts into 130+ target languages for global reach and accessibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {translationLanguages.slice(0, 20).map((lang, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
              <div className="p-3 bg-ai-secondary/5 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  + 110 more languages including minority languages and constructed languages
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-gradient-card rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-ai-primary" />
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <Languages className="w-5 h-5 text-ai-secondary" />
                </div>
                <p className="text-sm font-medium mt-2">Transcribe + Translate Workflow</p>
                <p className="text-xs text-muted-foreground">
                  Automatically detect source language, transcribe, then translate to your target language
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Language Features */}
        <div className="bg-gradient-card rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Advanced Language Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Auto-Detection</h4>
              <p className="text-sm text-muted-foreground">
                Automatically identify the source language without manual selection
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Multi-Language Support</h4>
              <p className="text-sm text-muted-foreground">
                Handle conversations with multiple languages in a single file
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dialect Recognition</h4>
              <p className="text-sm text-muted-foreground">
                Accurate recognition of regional accents and dialects
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LanguageSection;
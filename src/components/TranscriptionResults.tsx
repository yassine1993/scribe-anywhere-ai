import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Edit3, 
  Play, 
  Pause, 
  Users, 
  Clock, 
  Copy, 
  Share,
  FileText,
  Check
} from "lucide-react";

const TranscriptionResults = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportFormat, setExportFormat] = useState("docx");
  const [copied, setCopied] = useState(false);

  const transcriptSegments = [
    {
      id: 1,
      speaker: "Speaker 1",
      startTime: "00:00:00",
      endTime: "00:00:08",
      text: "Welcome to today's podcast episode. I'm really excited to discuss the future of artificial intelligence with our guest."
    },
    {
      id: 2,
      speaker: "Speaker 2", 
      startTime: "00:00:09",
      endTime: "00:00:15",
      text: "Thank you for having me. It's great to be here and I'm looking forward to our conversation."
    },
    {
      id: 3,
      speaker: "Speaker 1",
      startTime: "00:00:16",
      endTime: "00:00:28",
      text: "Let's start with the basics. How do you see AI transforming the way we work and live in the next five years?"
    },
    {
      id: 4,
      speaker: "Speaker 2",
      startTime: "00:00:29",
      endTime: "00:00:45",
      text: "I believe AI will become increasingly integrated into our daily workflows, making routine tasks more efficient while opening up new possibilities for creative and strategic work."
    }
  ];

  const handleCopyTranscript = () => {
    const fullText = transcriptSegments.map(segment => 
      `${segment.speaker}: ${segment.text}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportFormats = [
    { value: "docx", label: "Microsoft Word (.docx)" },
    { value: "pdf", label: "PDF Document (.pdf)" },
    { value: "txt", label: "Plain Text (.txt)" },
    { value: "csv", label: "CSV Spreadsheet (.csv)" },
    { value: "srt", label: "SRT Subtitles (.srt)" },
    { value: "vtt", label: "WebVTT Subtitles (.vtt)" }
  ];

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="default" className="bg-success text-white">
                <Check className="w-3 h-3 mr-1" />
                Completed
              </Badge>
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Processed in 2m 34s
              </Badge>
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                2 speakers detected
              </Badge>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              podcast-episode-001.mp3
            </h1>
            <p className="text-muted-foreground">
              Duration: 15:42 • Accuracy: 99.2% • Language: English
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleCopyTranscript}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Text"}
            </Button>
            <Button variant="hero">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Audio Player */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Audio Player</CardTitle>
              <CardDescription>Control playback and navigate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full h-32 bg-gradient-card rounded-lg flex items-center justify-center">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full w-16 h-16"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-hero h-2 rounded-full transition-all" 
                    style={{ width: '25%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>00:03:45</span>
                  <span>15:42</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download {exportFormat.toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transcript Editor */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Transcript Editor</CardTitle>
                  <CardDescription>Edit text, speakers, and timestamps</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Mode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="segments" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="segments">Segment View</TabsTrigger>
                  <TabsTrigger value="full">Full Transcript</TabsTrigger>
                </TabsList>
                
                <TabsContent value="segments" className="space-y-4">
                  {transcriptSegments.map((segment) => (
                    <div 
                      key={segment.id}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {segment.speaker}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {segment.startTime} - {segment.endTime}
                        </span>
                        <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="leading-relaxed">{segment.text}</p>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="full">
                  <Textarea
                    className="min-h-[500px] font-mono text-sm leading-relaxed"
                    defaultValue={transcriptSegments.map(segment => 
                      `${segment.speaker}: ${segment.text}`
                    ).join('\n\n')}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TranscriptionResults;
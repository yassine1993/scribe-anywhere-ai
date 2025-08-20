import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileAudio, FileVideo, Settings, Clock, Zap, Target } from "lucide-react";

const UploadInterface = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState("balanced");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingModes = [
    {
      id: "fast",
      name: "Cheetah (Fast)",
      icon: Zap,
      description: "Quick transcription for time-sensitive content",
      time: "~2x faster",
      accuracy: "95%+",
      color: "text-warning"
    },
    {
      id: "balanced",
      name: "Dolphin (Balanced)",  
      icon: Target,
      description: "Optimal balance of speed and accuracy",
      time: "Standard speed",
      accuracy: "98%+",
      color: "text-ai-primary"
    },
    {
      id: "accurate",
      name: "Whale (Accurate)",
      icon: Settings,
      description: "Maximum accuracy for professional content",
      time: "Takes longer",
      accuracy: "99.8%+",
      color: "text-success"
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Upload Your Audio or Video
          </h2>
          <p className="text-muted-foreground text-lg">
            Drag and drop your files or click to browse. We support all major formats.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Upload Area */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <div
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  dragActive 
                    ? 'border-ai-primary bg-ai-primary/5 scale-105' 
                    : 'border-muted-foreground/25 hover:border-ai-primary/50 hover:bg-ai-primary/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*,video/*,.mp3,.wav,.mp4,.mov,.avi,.mkv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-card rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-ai-primary" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {dragActive ? "Drop your files here" : "Drag & drop your files"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      or <button className="text-ai-primary hover:underline font-medium">browse your computer</button>
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary">MP3</Badge>
                    <Badge variant="secondary">WAV</Badge>
                    <Badge variant="secondary">MP4</Badge>
                    <Badge variant="secondary">MOV</Badge>
                    <Badge variant="secondary">AVI</Badge>
                    <Badge variant="secondary">+more</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files ({selectedFiles.length})</CardTitle>
                <CardDescription>Review your files before processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-card rounded-lg flex items-center justify-center">
                        {file.type.startsWith('audio/') ? (
                          <FileAudio className="w-5 h-5 text-ai-primary" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-ai-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Processing Mode</CardTitle>
              <CardDescription>
                Select the mode that best fits your needs for speed vs accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {processingModes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      processingMode === mode.id 
                        ? 'border-ai-primary bg-ai-primary/5' 
                        : 'border-muted hover:border-ai-primary/50'
                    }`}
                    onClick={() => setProcessingMode(mode.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-card rounded-lg flex items-center justify-center">
                        <mode.icon className={`w-5 h-5 ${mode.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{mode.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {mode.accuracy} accuracy
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{mode.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mode.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setSelectedFiles([])}>
                Clear Files
              </Button>
              <Button variant="hero" size="lg" className="px-8">
                <Zap className="w-5 h-5 mr-2" />
                Start Transcription ({selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''})
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadInterface;
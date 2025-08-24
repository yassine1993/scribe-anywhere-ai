import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, FileAudio, FileVideo, Settings, Clock, Zap, Target, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const API_BASE_URL = 'http://localhost:8000';

const UploadInterface = () => {
  const { user, token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingMode, setProcessingMode] = useState("dolphin");
  const [language, setLanguage] = useState("");
  const [targetLanguage, setLanguage] = useState("");
  const [restoreAudio, setRestoreAudio] = useState(false);
  const [speakerRecognition, setSpeakerRecognition] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingModes = [
    {
      id: "cheetah",
      name: "Cheetah (Fast)",
      icon: Zap,
      description: "Quick transcription for time-sensitive content",
      time: "~2x faster",
      accuracy: "95%+",
      color: "text-warning"
    },
    {
      id: "dolphin",
      name: "Dolphin (Balanced)",  
      icon: Target,
      description: "Optimal balance of speed and accuracy",
      time: "Standard speed",
      accuracy: "98%+",
      color: "text-ai-primary"
    },
    {
      id: "whale",
      name: "Whale (Accurate)",
      icon: Settings,
      description: "Maximum accuracy for professional content",
      time: "Takes longer",
      accuracy: "99.8%+",
      color: "text-success"
    }
  ];

  const supportedLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "auto", name: "Auto-detect" }
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
    handleFileSelection(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: File[]) => {
    // Filter for supported file types
    const supportedFormats = ['.mp3', '.wav', '.m4a', '.mp4', '.flac', '.aac', '.ogg', '.avi', '.mov', '.mkv'];
    const validFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return supportedFormats.includes(ext);
    });

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped - only audio/video formats are supported");
    }

    setSelectedFiles(validFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTranscription = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!user) {
      toast.error("Please log in to upload files");
      return;
    }

    if (!user.is_paid && user.usage_count >= 3) {
      toast.error("Free tier limit reached. Upgrade to unlimited for $10/month.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));
      formData.append('mode', processingMode);
      if (language && language !== 'auto') formData.append('language', language);
      if (targetLanguage) formData.append('target_language', targetLanguage);
      formData.append('restore_audio', restoreAudio.toString());
      formData.append('speaker_recognition', speakerRecognition.toString());

      const response = await fetch(`${API_BASE_URL}/jobs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully queued ${selectedFiles.length} file(s) for transcription`);
        
        // Update progress for each file
        selectedFiles.forEach(file => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 'queued'
          }));
        });
        
        // Clear selected files
        setSelectedFiles([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Transcription failed', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
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
                      {uploadProgress[file.name] && (
                        <div className="flex items-center gap-2">
                          {getProgressIcon(uploadProgress[file.name])}
                          <span className="text-sm text-muted-foreground capitalize">
                            {uploadProgress[file.name]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
              <CardDescription>
                Customize your transcription settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Processing Mode Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Processing Mode</Label>
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
              </div>

              {/* Language Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source-language">Source Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source language" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="target-language">Target Language (Translation)</Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional: translate to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No translation</SelectItem>
                      {supportedLanguages.filter(lang => lang.code !== 'auto').map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="restore-audio">Audio Restoration</Label>
                    <p className="text-sm text-muted-foreground">
                      Improve audio quality for better transcription
                    </p>
                  </div>
                  <Switch
                    id="restore-audio"
                    checked={restoreAudio}
                    onCheckedChange={setRestoreAudio}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="speaker-recognition">Speaker Recognition</Label>
                    <p className="text-sm text-muted-foreground">
                      Identify different speakers in the audio
                    </p>
                  </div>
                  <Switch
                    id="speaker-recognition"
                    checked={speakerRecognition}
                    onCheckedChange={setSpeakerRecognition}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setSelectedFiles([])}>
                Clear Files
              </Button>
              <Button 
                variant="hero" 
                size="lg" 
                className="px-8" 
                onClick={handleTranscription}
                disabled={isUploading || !user}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Start Transcription ({selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Usage Info */}
          {user && (
            <Card className="bg-muted/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {user.is_paid ? (
                      "Unlimited Plan: No daily limits"
                    ) : (
                      `Free Plan: ${user.usage_count}/3 files used today`
                    )}
                  </p>
                  {!user.is_paid && user.usage_count >= 3 && (
                    <p className="text-sm text-amber-600 mt-2">
                      Upgrade to unlimited for $10/month to remove daily limits
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadInterface;
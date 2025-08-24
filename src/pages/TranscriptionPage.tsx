import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Trash2, 
  Crown,
  FileAudio,
  FileVideo,
  Settings,
  Zap,
  Target,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import UploadInterface from '@/components/UploadInterface';

const API_BASE_URL = 'http://localhost:8000';

interface TranscriptionJob {
  id: number;
  filename: string;
  status: string;
  mode: string;
  language?: string;
  target_language?: string;
  restore_audio: boolean;
  speaker_recognition: boolean;
  created_at: string;
}

const TranscriptionPage = () => {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    if (user && token) {
      fetchJobs();
    }
  }, [user, token]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        toast.error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJob = async (jobId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Job deleted successfully');
        setJobs(jobs.filter(job => job.id !== jobId));
      } else {
        toast.error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Network error');
    }
  };

  const downloadTranscript = async (jobId: number, format: string = 'txt') => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/transcript?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Transcript downloaded as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to download transcript');
      }
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error('Network error');
    }
  };

  const getStatusIcon = (status: string) => {
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
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'cheetah':
        return <Zap className="w-4 h-4 text-warning" />;
      case 'dolphin':
        return <Target className="w-4 h-4 text-ai-primary" />;
      case 'whale':
        return <Settings className="w-4 h-4 text-success" />;
      default:
        return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getModeName = (mode: string) => {
    switch (mode) {
      case 'cheetah':
        return 'Cheetah (Fast)';
      case 'dolphin':
        return 'Dolphin (Balanced)';
      case 'whale':
        return 'Whale (Accurate)';
      default:
        return mode;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].includes(ext || '')) {
      return <FileAudio className="w-5 h-5 text-blue-500" />;
    } else {
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Please log in to access your transcription dashboard
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Transcription Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your audio and video transcriptions
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant={user.is_paid ? "default" : "secondary"}>
                {user.is_paid ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    Unlimited Plan
                  </>
                ) : (
                  `Free Plan (${user.usage_count}/3)`
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <UploadInterface />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Transcription Jobs</h2>
                <p className="text-muted-foreground">
                  Track the progress of your transcription requests
                </p>
              </div>
              <Button onClick={fetchJobs} variant="outline" size="sm">
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first audio or video file to get started
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    Upload Files
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            {getFileIcon(job.filename)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold truncate">{job.filename}</h3>
                              {getStatusBadge(job.status)}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                {getModeIcon(job.mode)}
                                <span>{getModeName(job.mode)}</span>
                              </div>
                              
                              {job.language && (
                                <span>• Language: {job.language}</span>
                              )}
                              
                              {job.target_language && (
                                <span>• Translate to: {job.target_language}</span>
                              )}
                              
                              <span>• {formatDate(job.created_at)}</span>
                            </div>
                            
                            {(job.restore_audio || job.speaker_recognition) && (
                              <div className="flex items-center space-x-2 mt-2">
                                {job.restore_audio && (
                                  <Badge variant="outline" className="text-xs">
                                    Audio Restoration
                                  </Badge>
                                )}
                                {job.speaker_recognition && (
                                  <Badge variant="outline" className="text-xs">
                                    Speaker Recognition
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {job.status === 'completed' && (
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadTranscript(job.id, 'txt')}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                TXT
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadTranscript(job.id, 'srt')}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                SRT
                              </Button>
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteJob(job.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TranscriptionPage;
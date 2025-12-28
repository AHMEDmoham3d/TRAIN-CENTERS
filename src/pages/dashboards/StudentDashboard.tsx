import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Calendar,
  Award,
  TrendingUp,
  ExternalLink,
  Clock,
  Download,
  Play,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  History,
  Eye,
  EyeOff,
  BarChart3,
  AlertCircle,
  Video,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// Import video.js
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/youtube/dist/Youtube';

interface UpcomingLesson {
  id: string;
  title: string;
  time: string;
  teacher: string;
}

interface PendingAssignment {
  id: string;
  title: string;
  dueDate: string;
  course: string;
  status: string;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  totalModules: number;
  completedModules: number;
}

interface AISuggestion {
  id: string;
  title: string;
  reason: string;
  icon: string;
}

interface RecentAchievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface VideoWithExams {
  id: string;
  teacher_id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  uploaded_at?: string | null;
  exams: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    total_marks?: number | null;
    created_at?: string | null;
    duration_minutes?: number | null;
    questions_count?: number | null;
    exam_questions?: Array<{
      id: string;
      question_text: string;
      exam_options: Array<{
        id: string;
        option_text: string;
        is_correct: boolean;
      }>;
    }>;
  }>;
}

/** Subscription + teacher content types */
interface SubscriptionItem {
  id: string;
  student_id: string;
  teacher_id: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  center_wide?: boolean;
  teacher?: {
    id: string;
    full_name: string;
    email?: string | null;
    subject?: string | null;
    image_url?: string | null;
    center_id?: string | null;
  } | null;
  videosWithExams: VideoWithExams[];
  materials: Array<{
    id: string;
    teacher_id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    uploaded_at?: string | null;
  }>;
}

// Interface for active exam
interface ActiveExamState {
  examId: string;
  examTitle: string;
  teacherId: string;
  teacherName: string;
  subject?: string;
  questions: Array<{
    id: string;
    question_text: string;
    exam_options: Array<{
      id: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }>;
  currentQuestionIndex: number;
  userAnswers: { [questionId: string]: string };
  timeRemaining: number;
  totalTime: number;
  isSubmitted: boolean;
  score?: number;
}

// Interface for exam result
interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  submitted_at: string;
  exam?: {
    title: string;
    teacher_id: string;
    teacher?: {
      full_name: string;
      subject?: string;
    };
  };
}

// Function to extract YouTube Video ID
const extractYouTubeVideoId = (url: string | null): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Function to get public URL from Supabase Storage
const getPublicVideoUrl = (videoUrl: string | null): string | null => {
  if (!videoUrl) return null;
  
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  
  const supabaseUrl = "https://biqzcfbcsflriybyvtur.supabase.co";
  
  if (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov')) {
    let filename = videoUrl;
    if (filename.includes('/')) {
      const parts = filename.split('/');
      filename = parts[parts.length - 1];
    }
    
    return `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
  }
  
  if (videoUrl.startsWith('videos/')) {
    const filename = videoUrl.replace('videos/', '');
    return `${supabaseUrl}/storage/v1/object/public/videos/${filename}`;
  }
  
  if (videoUrl.includes('storage/v1/object')) {
    if (videoUrl.includes('/storage/v1/object/')) {
      const parts = videoUrl.split('/storage/v1/object/');
      if (parts.length > 1) {
        const [domain, path] = parts;
        return `${domain}/storage/v1/object/public/${path}`;
      }
    }
  }
  
  return `${supabaseUrl}/storage/v1/object/public/videos/${videoUrl}`;
};

// Function to get proper video URL based on source
const getVideoUrl = (videoUrl: string | null): { url: string | null; type: 'youtube' | 'supabase' | 'direct' | 'unknown' } => {
  if (!videoUrl) return { url: null, type: 'unknown' };
  
  const youtubeId = extractYouTubeVideoId(videoUrl);
  if (youtubeId) {
    return { 
      url: youtubeId, 
      type: 'youtube' 
    };
  }
  
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return { url: videoUrl, type: 'direct' };
  }
  
  const supabaseUrl = getPublicVideoUrl(videoUrl);
  return { url: supabaseUrl, type: 'supabase' };
};

// Advanced Video Player Component using video.js
const AdvancedVideoPlayer: React.FC<{
  videoInfo: { url: string | null; type: 'youtube' | 'supabase' | 'direct' | 'unknown' };
  title: string;
}> = ({ videoInfo, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize video player
  useEffect(() => {
    if (!videoRef.current || !videoInfo.url) return;

    const setupPlayer = () => {
      if (videoInfo.type === 'youtube') {
        // Setup YouTube player with custom controls
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // Create a custom YouTube player
        const player = videojs(videoElement, {
          controls: true,
          autoplay: false,
          preload: 'auto',
          sources: [{
            src: videoInfo.url!,
            type: 'video/youtube'
          }],
          youtube: {
            ytControls: 0, // Hide YouTube controls
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            origin: window.location.origin,
            enablejsapi: 0
          },
          controlBar: {
            children: [
              'playToggle',
              'volumePanel',
              'currentTimeDisplay',
              'timeDivider',
              'durationDisplay',
              'progressControl',
              'remainingTimeDisplay',
              'customControlSpacer',
              'playbackRateMenuButton',
              'fullscreenToggle'
            ]
          }
        });

        playerRef.current = player;

        // Remove YouTube branding classes
        player.on('ready', () => {
          const playerEl = player.el();
          if (playerEl) {
            // Remove any YouTube branding elements
            const interval = setInterval(() => {
              const ytElements = playerEl.querySelectorAll('[class*="ytp-"], [class*="youtube"], a[href*="youtube"]');
              ytElements.forEach(el => {
                if (el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              });

              // Remove title and channel
              const titleElements = playerEl.querySelectorAll('[class*="title"], [class*="channel"]');
              titleElements.forEach(el => {
                if (el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              });
            }, 100);

            // Store interval for cleanup
            playerRef.current._cleanupInterval = interval;

            // Add custom styling to hide YouTube elements
            const style = document.createElement('style');
            style.id = 'youtube-branding-remover';
            style.textContent = `
              .video-js .vjs-control-bar {
                background: rgba(0, 0, 0, 0.7) !important;
              }
              .vjs-youtube .ytp-chrome-top,
              .vjs-youtube .ytp-title,
              .vjs-youtube .ytp-title-text,
              .vjs-youtube .ytp-title-channel,
              .vjs-youtube .ytp-watermark,
              .vjs-youtube .ytp-logo,
              .vjs-youtube .ytp-branding,
              .vjs-youtube .ytp-pause-overlay,
              .vjs-youtube .ytp-ce-element {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
              }
              .video-js {
                background-color: #000 !important;
              }
            `;
            document.head.appendChild(style);
          }
        });

        // Cleanup
        return () => {
          if (playerRef.current) {
            if (playerRef.current._cleanupInterval) {
              clearInterval(playerRef.current._cleanupInterval);
            }
            playerRef.current.dispose();
            playerRef.current = null;
          }
          const style = document.getElementById('youtube-branding-remover');
          if (style) style.remove();
        };

      } else {
        // Setup regular video player for Supabase or direct videos
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const player = videojs(videoElement, {
          controls: true,
          autoplay: false,
          preload: 'auto',
          sources: [{
            src: videoInfo.url!,
            type: 'video/mp4'
          }],
          controlBar: {
            children: [
              'playToggle',
              'volumePanel',
              'currentTimeDisplay',
              'timeDivider',
              'durationDisplay',
              'progressControl',
              'remainingTimeDisplay',
              'customControlSpacer',
              'playbackRateMenuButton',
              'fullscreenToggle'
            ]
          }
        });

        playerRef.current = player;

        // Cleanup
        return () => {
          if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
          }
        };
      }
    };

    const cleanup = setupPlayer();

    return () => {
      if (cleanup) cleanup();
    };
  }, [videoInfo.url, videoInfo.type]);

  // Handle mouse movement for controls visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Custom controls handlers
  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.paused()) {
        playerRef.current.play();
        setIsPlaying(true);
      } else {
        playerRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.volume(newVolume);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.currentTime(newTime);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!videoInfo.url) {
    return (
      <div className="w-full h-64 md:h-96 bg-gray-900 rounded-lg flex flex-col items-center justify-center p-6">
        <Video className="w-16 h-16 text-gray-500 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Video not available</p>
        <p className="text-gray-500 text-sm mt-2">This video cannot be loaded at the moment.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-64 md:h-96 bg-black rounded-lg overflow-hidden group"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video element */}
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered absolute inset-0 w-full h-full"
          playsInline
          preload="metadata"
          poster={`https://img.youtube.com/vi/${videoInfo.type === 'youtube' ? videoInfo.url : ''}/hqdefault.jpg`}
          onError={(e) => {
            console.error('Video loading error:', e);
          }}
        />
      </div>

      {/* Custom overlay with video info */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
        <div className="flex justify-between items-start">
          <div className="text-white">
            <h3 className="font-semibold text-lg truncate">{title}</h3>
            <p className="text-sm text-gray-300">Platform Video Player</p>
          </div>
          <div className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
            {videoInfo.type === 'youtube' ? 'Streaming' : 'Direct Play'}
          </div>
        </div>
      </div>

      {/* Custom controls overlay */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10 transition-opacity duration-300">
          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="text-white hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
              </button>

              <button
                onClick={handleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1H5zm10 0a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1h-4zM5 14a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1H5zm10 0a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1h-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading video player...</p>
        </div>
      </div>

      {/* Protection overlay to prevent right-click */}
      <div 
        className="absolute inset-0 z-0"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toast.error('Right-click is disabled on video player');
          return false;
        }}
      />
    </div>
  );
};

// Helper function to format time
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { centerSlug } = useParams<{ centerSlug: string }>();
  const { t } = useTranslation();

  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [centerSubdomain, setCenterSubdomain] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<{[key: string]: ExamResult[]}>({});
  
  // Active exam state
  const [activeExam, setActiveExam] = useState<ActiveExamState | null>(null);
  const [examTimer, setExamTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Exam results modal state
  const [showExamResultsModal, setShowExamResultsModal] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState<ExamResult[]>([]);
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [selectedTeacherName, setSelectedTeacherName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Video loading states
  const [videoLoading, setVideoLoading] = useState<{[key: string]: boolean}>({});
  const [videoErrors, setVideoErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchCenterInfo = async () => {
      if (!centerSlug) return;

      try {
        const { data: centerData, error } = await supabase
          .from("centers")
          .select("id, name, subdomain")
          .eq("subdomain", centerSlug)
          .single();

        if (error) {
          console.error("Error fetching center info:", error);
          return;
        }

        if (centerData) {
          setCenterId(centerData.id);
          setCenterSubdomain(centerData.subdomain || centerData.name);
        }
      } catch (error) {
        console.error("Unexpected error fetching center info:", error);
      }
    };

    fetchCenterInfo();
  }, [centerSlug]);

  useEffect(() => {
    const fetchExamResults = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("exam_results")
          .select(`
            id,
            exam_id,
            student_id,
            score,
            submitted_at,
            exam:exams(
              title,
              teacher_id,
              teacher:teachers(
                full_name,
                subject
              )
            )
          `)
          .eq("student_id", user.id)
          .order("submitted_at", { ascending: false });

        if (error) {
          console.error("Error fetching exam results:", error);
          return;
        }

        const groupedResults: {[key: string]: ExamResult[]} = {};
        data?.forEach(result => {
          if (!groupedResults[result.exam_id]) {
            groupedResults[result.exam_id] = [];
          }
          groupedResults[result.exam_id].push(result);
        });

        setExamResults(groupedResults);
      } catch (error) {
        console.error("Error fetching exam results:", error);
      }
    };

    fetchExamResults();
  }, [user, activeExam]);

  useEffect(() => {
    const fetchSubscriptionsAndContent = async () => {
      try {
        if (!user) {
          setUpcomingLessons([
            {
              id: "1",
              title: "Advanced Mathematics",
              time: "10:00 AM - 11:30 AM",
              teacher: "Dr. Sarah Johnson",
            },
            {
              id: "2",
              title: "Physics Fundamentals",
              time: "1:00 PM - 2:30 PM",
              teacher: "Prof. Michael Chen",
            },
          ]);
          setAiSuggestions([
            {
              id: "1",
              title: "Review Calculus Fundamentals",
              reason: "Based on your recent quiz performance",
              icon: "BookOpen",
            },
          ]);
          setCourseProgress([
            {
              id: "1",
              title: "Course 1",
              progress: 75,
              totalModules: 12,
              completedModules: 9,
            },
          ]);
          setLoading(false);
          return;
        }

        const { data: subs, error: subError } = await supabase
          .from("subscriptions")
          .select("id, teacher_id, is_active, start_date, end_date, center_wide")
          .eq("student_id", user.id)
          .eq("is_active", true);

        if (subError) {
          console.error("Subscription fetch error:", subError);
          toast.error("Failed to load subscriptions");
          return;
        }

        if (subs && subs.length > 0) {
          const teacherIds = subs.map((s: any) => s.teacher_id);
          const uniqueTeacherIds = [...new Set(teacherIds)];

          const isCenterWide = subs.some((s: any) => s.center_wide === true);

          const { data: teachersData } = await supabase
            .from("teachers")
            .select("id, full_name, email, subject, image_url, center_id")
            .in("id", uniqueTeacherIds);

          const teachersMap = new Map();
          teachersData?.forEach(teacher => {
            teachersMap.set(teacher.id, teacher);
          });

          const subsWithContent: SubscriptionItem[] = subs.map((s: any) => ({
            id: s.id,
            student_id: user.id,
            teacher_id: s.teacher_id,
            start_date: s.start_date,
            end_date: s.end_date,
            is_active: s.is_active,
            center_wide: s.center_wide,
            teacher: teachersMap.get(s.teacher_id) || null,
            videosWithExams: [],
            materials: [],
          }));

          if (isCenterWide && centerId) {
            const { data: centerTeachers } = await supabase
              .from("teachers")
              .select("id")
              .eq("center_id", centerId);

            if (centerTeachers && centerTeachers.length > 0) {
              const centerTeacherIds = centerTeachers.map(t => t.id);

              const { data: videosData } = await supabase
                .from("videos")
                .select("id, teacher_id, title, description, video_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (videosData && videosData.length > 0) {
                const videoIds = videosData.map(v => v.id);
                
                const { data: exams } = await supabase
                  .from('exams')
                  .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes')
                  .in('video_id', videoIds);

                if (exams) {
                  const examsWithQuestions = await Promise.all(
                    exams.map(async (exam) => {
                      const { data: questions } = await supabase
                        .from('exam_questions')
                        .select('id, question_text, exam_id')
                        .eq('exam_id', exam.id);

                      const questionsWithOptions = await Promise.all(
                        questions?.map(async (question) => {
                          const { data: options } = await supabase
                            .from('exam_options')
                            .select('id, option_text, is_correct, question_id')
                            .eq('question_id', question.id);

                          return {
                            ...question,
                            exam_options: options || []
                          };
                        }) || []
                      );

                      return {
                        ...exam,
                        questions_count: questionsWithOptions.length,
                        exam_questions: questionsWithOptions
                      };
                    })
                  );

                  const videosWithExams = videosData.map(video => ({
                    ...video,
                    exams: examsWithQuestions.filter(exam => exam.video_id === video.id) || []
                  }));

                  subsWithContent.forEach(sub => {
                    sub.videosWithExams = videosWithExams;
                  });
                }
              }

              const { data: materialsData } = await supabase
                .from("materials")
                .select("id, teacher_id, title, description, file_url, uploaded_at")
                .in("teacher_id", centerTeacherIds);

              if (materialsData) {
                subsWithContent.forEach(sub => {
                  sub.materials = materialsData || [];
                });
              }
            }
          } else {
            const { data: videosData } = await supabase
              .from("videos")
              .select("id, teacher_id, title, description, video_url, uploaded_at")
              .in("teacher_id", uniqueTeacherIds);

            if (videosData && videosData.length > 0) {
              const videoIds = videosData.map(v => v.id);
              
              const { data: exams } = await supabase
                .from('exams')
                .select('id, title, video_id, teacher_id, description, total_marks, created_at, duration_minutes')
                .in('video_id', videoIds)
                .in('teacher_id', uniqueTeacherIds);

              if (exams) {
                const examsWithQuestions = await Promise.all(
                  exams.map(async (exam) => {
                    const { data: questions } = await supabase
                      .from('exam_questions')
                      .select('id, question_text, exam_id')
                      .eq('exam_id', exam.id);

                    const questionsWithOptions = await Promise.all(
                      questions?.map(async (question) => {
                        const { data: options } = await supabase
                          .from('exam_options')
                          .select('id, option_text, is_correct, question_id')
                          .eq('question_id', question.id);

                        return {
                          ...question,
                          exam_options: options || []
                        };
                      }) || []
                    );

                    return {
                      ...exam,
                      questions_count: questionsWithOptions.length,
                      exam_questions: questionsWithOptions
                    };
                  })
                );

                subsWithContent.forEach(sub => {
                  const teacherVideos = videosData.filter(video => video.teacher_id === sub.teacher_id);
                  sub.videosWithExams = teacherVideos.map(video => ({
                    ...video,
                    exams: examsWithQuestions.filter(exam => exam.video_id === video.id && exam.teacher_id === sub.teacher_id) || []
                  }));
                });
              }
            }

            const { data: materialsData } = await supabase
              .from("materials")
              .select("id, teacher_id, title, description, file_url, uploaded_at")
              .in("teacher_id", uniqueTeacherIds);

            if (materialsData) {
              subsWithContent.forEach(sub => {
                sub.materials = materialsData ? materialsData.filter(material => material.teacher_id === sub.teacher_id) : [];
              });
            }
          }

          setSubscriptionsData(subsWithContent);
        } else {
          setSubscriptionsData([]);
        }

        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
          },
          {
            id: "2",
            title: "Physics Fundamentals",
            time: "1:00 PM - 2:30 PM",
            teacher: "Prof. Michael Chen",
          },
        ]);

        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
          },
        ]);

        if (subs && subs.length > 0) {
          setCourseProgress(
            subs.map((s: any, idx: number) => ({
              id: s.id,
              title: `Course ${idx + 1}`,
              progress: Math.floor(Math.random() * 100),
              totalModules: 12,
              completedModules: Math.floor(Math.random() * 12),
            }))
          );
        } else {
          setCourseProgress([]);
        }

      } catch (error) {
        console.error("Unexpected error in dashboard:", error);
        toast.error("Failed to load dashboard data");

        setUpcomingLessons([
          {
            id: "1",
            title: "Advanced Mathematics",
            time: "10:00 AM - 11:30 AM",
            teacher: "Dr. Sarah Johnson",
          },
        ]);
        setAiSuggestions([
          {
            id: "1",
            title: "Review Calculus Fundamentals",
            reason: "Based on your recent quiz performance",
            icon: "BookOpen",
          },
        ]);
        setCourseProgress([
          {
            id: "1",
            title: "Course 1",
            progress: 75,
            totalModules: 12,
            completedModules: 9,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionsAndContent();
  }, [user, centerId]);

  const computeSubscriptionStatus = (s: SubscriptionItem) => {
    const now = new Date();
    const end = s.end_date ? new Date(s.end_date) : null;
    if (!s.is_active) return "inactive";
    if (end && end < now) return "expired";
    return "active";
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const formatDateTime = (d?: string | null) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const handleStartExam = (examId: string, examTitle: string, teacherId: string, teacherName: string, subject?: string, questions: any[] = []) => {
    if (examTimer) {
      clearInterval(examTimer);
    }

    let examDuration = 30;
    
    subscriptionsData.forEach(sub => {
      sub.videosWithExams.forEach(video => {
        video.exams.forEach(exam => {
          if (exam.id === examId && exam.duration_minutes) {
            examDuration = exam.duration_minutes;
          }
        });
      });
    });

    const timeInSeconds = examDuration * 60;

    setActiveExam({
      examId,
      examTitle,
      teacherId,
      teacherName,
      subject,
      questions: questions || [],
      currentQuestionIndex: 0,
      userAnswers: {},
      timeRemaining: timeInSeconds,
      totalTime: timeInSeconds,
      isSubmitted: false,
      score: undefined
    });

    const timer = setInterval(() => {
      setActiveExam(prev => {
        if (!prev) return null;
        if (prev.timeRemaining <= 0) {
          clearInterval(timer);
          handleSubmitExam();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    setExamTimer(timer);
    toast.success(`Exam "${examTitle}" started!`);
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (!activeExam) return;

    setActiveExam(prev => {
      if (!prev) return null;
      
      const updatedAnswers = {
        ...prev.userAnswers,
        [questionId]: optionId
      };

      const currentIndex = prev.currentQuestionIndex;
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < prev.questions.length) {
        return {
          ...prev,
          userAnswers: updatedAnswers,
          currentQuestionIndex: nextIndex
        };
      } else {
        return {
          ...prev,
          userAnswers: updatedAnswers
        };
      }
    });
  };

  const handleNextQuestion = () => {
    if (!activeExam) return;
    
    setActiveExam(prev => {
      if (!prev) return null;
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex < prev.questions.length) {
        return { ...prev, currentQuestionIndex: nextIndex };
      }
      return prev;
    });
  };

  const handlePrevQuestion = () => {
    if (!activeExam) return;
    
    setActiveExam(prev => {
      if (!prev) return null;
      const prevIndex = prev.currentQuestionIndex - 1;
      if (prevIndex >= 0) {
        return { ...prev, currentQuestionIndex: prevIndex };
      }
      return prev;
    });
  };

  const handleSubmitExam = async () => {
    if (!activeExam || !user) return;

    if (examTimer) {
      clearInterval(examTimer);
      setExamTimer(null);
    }

    let correctAnswers = 0;
    const totalQuestions = activeExam.questions.length;

    activeExam.questions.forEach(question => {
      const userAnswer = activeExam.userAnswers[question.id];
      if (userAnswer) {
        const selectedOption = question.exam_options.find(opt => opt.id === userAnswer);
        if (selectedOption && selectedOption.is_correct) {
          correctAnswers++;
        }
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const submittedAt = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("exam_results")
        .insert({
          exam_id: activeExam.examId,
          student_id: user.id,
          score: score,
          submitted_at: submittedAt
        })
        .select();

      if (error) {
        console.error("Error saving exam result:", error);
        toast.error("Failed to save exam result");
        throw error;
      }

      const newResult: ExamResult = {
        id: data[0].id,
        exam_id: activeExam.examId,
        student_id: user.id,
        score: score,
        submitted_at: submittedAt,
        exam: {
          title: activeExam.examTitle,
          teacher_id: activeExam.teacherId,
          teacher: {
            full_name: activeExam.teacherName,
            subject: activeExam.subject
          }
        }
      };

      setExamResults(prev => {
        const existingResults = prev[activeExam.examId] || [];
        return {
          ...prev,
          [activeExam.examId]: [newResult, ...existingResults]
        };
      });

      toast.success(`Exam submitted! Your score: ${score}%`);

    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam");
    }

    setActiveExam(prev => prev ? { ...prev, isSubmitted: true, score } : null);
  };

  const handleCancelExam = () => {
    if (examTimer) {
      clearInterval(examTimer);
      setExamTimer(null);
    }
    setActiveExam(null);
    toast.success("Exam cancelled");
  };

  const handleShowExamResults = (examId: string, examTitle: string, teacherName: string, subject: string = "") => {
    const results = examResults[examId] || [];
    setSelectedExamResults(results);
    setSelectedExamTitle(examTitle);
    setSelectedTeacherName(teacherName);
    setSelectedSubject(subject);
    setShowExamResultsModal(true);
  };

  const handleDownloadMaterial = (fileUrl: string | null, title: string) => {
    if (!fileUrl) {
      toast.error("No file available for download");
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${title}`);
  };

  const handleVideoPlay = (videoId: string) => {
    setActiveVideo(activeVideo === videoId ? null : videoId);
    
    if (activeVideo !== videoId) {
      setVideoLoading(prev => ({ ...prev, [videoId]: true }));
      setVideoErrors(prev => ({ ...prev, [videoId]: "" }));
      
      setTimeout(() => {
        setVideoLoading(prev => ({ ...prev, [videoId]: false }));
      }, 500);
    }
  };

  const getHighestScore = (examId: string): number => {
    const results = examResults[examId];
    if (!results || results.length === 0) return 0;
    
    return Math.max(...results.map(r => r.score));
  };

  const getLatestResult = (examId: string): ExamResult | null => {
    const results = examResults[examId];
    if (!results || results.length === 0) return null;
    
    return results[0];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-center p-8">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      onNavAction={(action: string) => {
        if (action === "showVideos") setShowVideosPanel(true);
      }}
    >
      {activeExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{activeExam.examTitle}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Time: {formatTime(activeExam.timeRemaining)}</span>
                  </div>
                  <div>
                    Question {activeExam.currentQuestionIndex + 1} of {activeExam.questions.length}
                  </div>
                  <div>
                    Answered: {Object.keys(activeExam.userAnswers).length} / {activeExam.questions.length}
                  </div>
                </div>
                {activeExam.teacherName && (
                  <div className="text-sm mt-1 opacity-90">
                    Teacher: {activeExam.teacherName} {activeExam.subject && ` | Subject: ${activeExam.subject}`}
                  </div>
                )}
              </div>
              <button
                onClick={handleCancelExam}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Cancel Exam
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!activeExam.isSubmitted ? (
                <>
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6 border border-primary-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {activeExam.currentQuestionIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
                            {activeExam.questions[activeExam.currentQuestionIndex]?.question_text}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activeExam.questions[activeExam.currentQuestionIndex]?.exam_options.map((option, index) => {
                        const questionId = activeExam.questions[activeExam.currentQuestionIndex].id;
                        const isSelected = activeExam.userAnswers[questionId] === option.id;

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleSelectAnswer(questionId, option.id)}
                            className={`group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50 shadow-primary-100 ring-2 ring-primary-200'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25 hover:shadow-primary-50'
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
                                isSelected
                                  ? 'border-primary-600 bg-primary-600 text-white shadow-lg'
                                  : 'border-gray-300 bg-white group-hover:border-primary-400 group-hover:bg-primary-50'
                              }`}>
                                <span className={`font-bold text-sm ${
                                  isSelected ? 'text-white' : 'text-gray-600 group-hover:text-primary-600'
                                }`}>
                                  {String.fromCharCode(65 + index)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-base font-medium leading-relaxed block ${
                                  isSelected ? 'text-primary-900' : 'text-gray-800 group-hover:text-primary-800'
                                }`}>
                                  {option.option_text}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <CheckCircle className="w-6 h-6 text-primary-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      onClick={handlePrevQuestion}
                      disabled={activeExam.currentQuestionIndex === 0}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        activeExam.currentQuestionIndex === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleSubmitExam}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                      >
                        Submit Exam
                      </button>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      disabled={activeExam.currentQuestionIndex === activeExam.questions.length - 1}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        activeExam.currentQuestionIndex === activeExam.questions.length - 1
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-2">Questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {activeExam.questions.map((_, index) => {
                        const questionId = activeExam.questions[index].id;
                        const isAnswered = activeExam.userAnswers[questionId];
                        const isCurrent = index === activeExam.currentQuestionIndex;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setActiveExam(prev => 
                              prev ? { ...prev, currentQuestionIndex: index } : null
                            )}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              isCurrent
                                ? 'border-primary-600 bg-primary-100 text-primary-700 font-bold'
                                : isAnswered
                                ? 'border-green-500 bg-green-100 text-green-700'
                                : 'border-gray-300 bg-gray-100 text-gray-700'
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Exam Submitted Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      Your exam has been submitted and your score has been recorded.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold text-gray-800 mb-4">Exam Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Questions:</span>
                        <span className="font-medium">{activeExam.questions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Questions Answered:</span>
                        <span className="font-medium">
                          {Object.keys(activeExam.userAnswers).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Taken:</span>
                        <span className="font-medium">
                          {formatTime(activeExam.totalTime - activeExam.timeRemaining)}
                        </span>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Your Score:</span>
                          <span className="text-primary-600">
                            {activeExam.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      onClick={handleCancelExam}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md"
                    >
                      Back to Dashboard
                    </button>
                    <button
                      onClick={() => handleShowExamResults(activeExam.examId, activeExam.examTitle, activeExam.teacherName, activeExam.subject)}
                      className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-md"
                    >
                      View Results History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showExamResultsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedExamTitle}</h2>
                <div className="text-sm mt-1 opacity-90">
                  Teacher: {selectedTeacherName}
                  {selectedSubject && ` | Subject: ${selectedSubject}`}
                </div>
              </div>
              <button
                onClick={() => setShowExamResultsModal(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Exam Results History</h3>
                  <span className="text-sm text-gray-500">
                    {selectedExamResults.length} attempt(s)
                  </span>
                </div>

                {selectedExamResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Highest Score</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {Math.max(...selectedExamResults.map(r => r.score))}%
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Average Score</div>
                        <div className="text-2xl font-bold text-green-700">
                          {Math.round(selectedExamResults.reduce((sum, r) => sum + r.score, 0) / selectedExamResults.length)}%
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-medium">Latest Score</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {selectedExamResults[0].score}%
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attempt #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedExamResults.map((result, index) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  Attempt {selectedExamResults.length - index}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-lg font-bold ${
                                  result.score >= 80 ? 'text-green-600' :
                                  result.score >= 60 ? 'text-blue-600' :
                                  result.score >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {result.score}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatHistoryDate(result.submitted_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  result.score >= 60
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.score >= 60 ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                    <p className="text-gray-500">Take this exam to see your results here!</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowExamResultsModal(false)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {`Welcome, ${user?.name || "Student"}`}
          </h1>
          <p className="mt-1 text-gray-500">{new Date().toLocaleDateString()}</p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-primary-600">Center: {centerSubdomain || centerSlug || "Unknown"}</p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const allResults = Object.values(examResults).flat();
                  if (allResults.length > 0) {
                    setSelectedExamResults(allResults);
                    setSelectedExamTitle("All Exams");
                    setSelectedTeacherName("");
                    setSelectedSubject("");
                    setShowExamResultsModal(true);
                  } else {
                    toast.info("You haven't taken any exams yet");
                  }
                }}
                className="flex items-center text-sm bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                <History className="w-4 h-4 mr-2" />
                View All Results
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-primary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Today's Lessons</h2>
            </div>
            {upcomingLessons.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-500">{lesson.time}</p>
                    <p className="text-sm text-gray-500">{lesson.teacher}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No lessons scheduled for today</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-secondary-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Pending Assignments</h2>
            </div>
            {pendingAssignments.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.course} • Due {assignment.dueDate}</p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-error-100 text-error-800">{assignment.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No pending assignments</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-accent-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">AI Study Suggestions</h2>
            </div>
            {aiSuggestions.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="p-3 bg-gray-50 rounded-md border border-gray-100 flex">
                    <div className="mr-3 mt-1">{sug.icon === "BookOpen" ? <BookOpen className="w-5 h-5 text-primary-500" /> : <TrendingUp className="w-5 h-5 text-primary-500" />}</div>
                    <div>
                      <p className="font-medium text-gray-900">{sug.title}</p>
                      <p className="text-sm text-gray-500">{sug.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No suggestions available</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-card p-5 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 text-warning-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
            </div>
            {recentAchievements.length > 0 ? (
              <div className="space-y-3 flex-grow">
                {recentAchievements.map((ach) => (
                  <div key={ach.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <Award className="h-5 w-5 text-warning-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{ach.title}</p>
                        <p className="text-sm text-gray-500">{ach.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{ach.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">No achievements yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Subscriptions</h2>
            <button
              onClick={() => setShowVideosPanel(!showVideosPanel)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showVideosPanel ? "Hide Content" : "Show Content"}
            </button>
          </div>

          {subscriptionsData.length === 0 ? (
            <div className="text-gray-600">
              You have no subscriptions yet. Please subscribe to a teacher to access their courses, videos and exams.
            </div>
          ) : (
            <div className="space-y-6">
              {subscriptionsData.map((sub) => {
                const status = computeSubscriptionStatus(sub);
                const isExpired = status === "expired";

                return (
                  <div key={sub.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {sub.teacher?.full_name || "Unknown Teacher"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {sub.teacher?.subject && `Subject: ${sub.teacher.subject} • `}
                          Subscription: {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                          {sub.center_wide && " (Center Wide)"}
                        </p>
                        <p
                          className={`text-sm font-medium mt-1 ${
                            status === "expired"
                              ? "text-red-600"
                              : status === "inactive"
                              ? "text-gray-500"
                              : "text-green-600"
                          }`}
                        >
                          Status: {status.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {showVideosPanel && (
                      <div className="space-y-8">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                            Course Content ({sub.videosWithExams.length} Videos)
                          </h4>

                          {isExpired ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-red-600 font-medium">
                                Your subscription has expired. Please renew to access all content.
                              </p>
                            </div>
                          ) : sub.videosWithExams.length > 0 ? (
                            <div className="space-y-6">
                              {sub.videosWithExams.map((video) => {
                                const videoInfo = getVideoUrl(video.video_url);
                                
                                return (
                                  <div key={video.id} className="border rounded-lg overflow-hidden">
                                    <div 
                                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() => handleVideoPlay(video.id)}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                          <Play className="w-5 h-5 text-primary-600" />
                                          <div>
                                            <h5 className="font-semibold text-gray-900">{video.title}</h5>
                                            {video.description && (
                                              <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                              Uploaded: {formatDateTime(video.uploaded_at)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {activeVideo === video.id ? 'Hide Video' : 'Show Video'}
                                        </div>
                                      </div>
                                    </div>

                                    {activeVideo === video.id && video.video_url && (
                                      <div className="p-4 bg-black">
                                        <AdvancedVideoPlayer 
                                          videoInfo={videoInfo}
                                          title={video.title}
                                        />
                                      </div>
                                    )}

                                    {video.exams.length > 0 && (
                                      <div className="border-t">
                                        <div className="p-4 bg-blue-50">
                                          <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                            Exams for this video ({video.exams.length})
                                          </h6>
                                          <div className="space-y-3">
                                            {video.exams.map((exam) => {
                                              const highestScore = getHighestScore(exam.id);
                                              const latestResult = getLatestResult(exam.id);
                                              const resultsCount = examResults[exam.id]?.length || 0;
                                              const teacherInfo = sub.teacher;
                                              
                                              return (
                                                <div key={exam.id} className="bg-white rounded-lg p-4 border">
                                                  <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                      <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                          <p className="font-medium text-gray-900">{exam.title}</p>
                                                          {highestScore > 0 && (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                          )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                          <button
                                                            onClick={() => handleShowExamResults(
                                                              exam.id, 
                                                              exam.title, 
                                                              teacherInfo?.full_name || "Unknown Teacher",
                                                              teacherInfo?.subject || ""
                                                            )}
                                                            className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                                                          >
                                                            <History className="w-4 h-4 mr-1" />
                                                            Results ({resultsCount})
                                                          </button>
                                                        </div>
                                                      </div>
                                                      
                                                      {exam.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                                                      )}
                                                      
                                                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                                                        {exam.total_marks && (
                                                          <span>Total Marks: {exam.total_marks}</span>
                                                        )}
                                                        {exam.duration_minutes && (
                                                          <span className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {exam.duration_minutes} minutes
                                                          </span>
                                                        )}
                                                        {exam.questions_count && (
                                                          <span>Questions: {exam.questions_count}</span>
                                                        )}
                                                        {teacherInfo?.subject && (
                                                          <span>Subject: {teacherInfo.subject}</span>
                                                        )}
                                                      </div>
                                                      
                                                      {resultsCount > 0 && latestResult && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                          <div className="flex justify-between items-center">
                                                            <div>
                                                              <span className="text-sm text-gray-600">Latest: </span>
                                                              <span className={`text-sm font-medium ${
                                                                latestResult.score >= 60 ? 'text-green-600' : 'text-red-600'
                                                              }`}>
                                                                {latestResult.score}%
                                                              </span>
                                                              <span className="text-xs text-gray-500 ml-2">
                                                                ({formatDate(latestResult.submitted_at)})
                                                              </span>
                                                            </div>
                                                            <div>
                                                              <span className="text-sm text-gray-600">Highest: </span>
                                                              <span className={`text-sm font-bold ${
                                                                highestScore >= 60 ? 'text-green-600' : 'text-red-600'
                                                              }`}>
                                                                {highestScore}%
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                    
                                                    <div className="ml-4 flex flex-col space-y-2">
                                                      <button
                                                        onClick={() => handleStartExam(
                                                          exam.id, 
                                                          exam.title, 
                                                          sub.teacher_id, 
                                                          teacherInfo?.full_name || "Unknown Teacher",
                                                          teacherInfo?.subject,
                                                          exam.exam_questions || []
                                                        )}
                                                        className={`px-4 py-2 rounded-md whitespace-nowrap ${
                                                          resultsCount > 0
                                                            ? 'bg-secondary-600 text-white hover:bg-secondary-700'
                                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                                        }`}
                                                      >
                                                        {resultsCount > 0 ? 'Retake Exam' : 'Start Exam'}
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No videos available for this subscription</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                            Study Materials ({sub.materials.length})
                          </h4>

                          {isExpired ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-red-600 font-medium">
                                Your subscription has expired. Please renew to access materials.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {sub.materials.length > 0 ? (
                                sub.materials.map((material) => (
                                  <div key={material.id} className="border rounded p-4 bg-gray-50 flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-900">{material.title}</p>
                                      {material.description && (
                                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                      )}
                                      <p className="text-xs text-gray-500 mt-1">
                                        Uploaded: {formatDateTime(material.uploaded_at)}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadMaterial(material.file_url, material.title)}
                                      className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 text-center py-4">No study materials available</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold">Progress</h2>
          {courseProgress.length > 0 ? (
            <div className="mt-4 space-y-4">
              {courseProgress.map((progress) => (
                <div key={progress.id} className="p-4 bg-gray-50 rounded-md border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{progress.title}</h3>
                    <span className="text-sm text-gray-500">{progress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {progress.completedModules} of {progress.totalModules} modules completed
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-2">
              Your course progress and metrics will appear here.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
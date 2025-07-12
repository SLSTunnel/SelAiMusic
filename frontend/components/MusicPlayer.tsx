'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowDownTrayIcon,
  MusicalNoteIcon,
  HeartIcon,
  ShareIcon,
  CogIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon as PlaySolid,
  PauseIcon as PauseSolid,
  HeartIcon as HeartSolid
} from '@heroicons/react/24/solid';

interface Music {
  id: string;
  title: string;
  description: string;
  prompt: string;
  mood: string;
  genre: string;
  bpm: number;
  key: string;
  duration: number;
  files: {
    main: {
      url: string;
      format: string;
      bitrate: number;
      size: number;
    };
    waveform?: {
      url: string;
    };
  };
  status: string;
  plays: number;
  likes: number;
  creator: {
    username: string;
    avatar?: string;
  };
  createdAt: string;
  completedAt?: string;
}

interface MusicPlayerProps {
  music: Music;
  onClose?: () => void;
}

export function MusicPlayer({ music, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4f46e5',
      progressColor: '#06b6d4',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 1,
      height: 80,
      barGap: 2,
      responsive: true,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(music.files.main.url);

    // Event listeners
    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    wavesurfer.on('error', (error) => {
      setError('Failed to load audio');
      setIsLoading(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [music.files.main.url]);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!wavesurferRef.current) return;
    
    const time = parseFloat(e.target.value);
    wavesurferRef.current.setCurrentTime(time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (!wavesurferRef.current) return;
    
    if (isMuted) {
      wavesurferRef.current.setVolume(volume);
      setIsMuted(false);
    } else {
      wavesurferRef.current.setVolume(0);
      setIsMuted(true);
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    // TODO: API call to like/unlike
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/music/${music.id}/download`);
      const data = await response.json();
      
      if (data.success) {
        const link = document.createElement('a');
        link.href = data.data.downloadUrl;
        link.download = data.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: music.title,
        text: music.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-dark-800/80 backdrop-blur-lg border border-dark-600 rounded-2xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <MusicalNoteIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{music.title}</h3>
            <p className="text-sm text-gray-400">by {music.creator.username}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLike}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            {isLiked ? (
              <HeartSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-primary-400 transition-colors duration-200"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Waveform */}
      <div className="mb-6">
        {isLoading ? (
          <div className="h-20 bg-dark-700 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5 animate-spin text-primary-400" />
              <span className="text-gray-400">Loading audio...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-20 bg-dark-700 rounded-lg flex items-center justify-center">
            <span className="text-red-400">{error}</span>
          </div>
        ) : (
          <div ref={waveformRef} className="w-full" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
          disabled={isLoading || !!error}
        />
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoading || !!error}
            className="w-12 h-12 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors duration-200"
          >
            {isPlaying ? (
              <PauseSolid className="w-6 h-6 text-white" />
            ) : (
              <PlaySolid className="w-6 h-6 text-white ml-1" />
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-5 h-5" />
              ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </button>
        </div>
      </div>

      {/* Music Info */}
      <div className="mt-6 pt-6 border-t border-dark-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Genre:</span>
            <span className="text-white ml-2 capitalize">{music.genre}</span>
          </div>
          <div>
            <span className="text-gray-400">Mood:</span>
            <span className="text-white ml-2 capitalize">{music.mood}</span>
          </div>
          <div>
            <span className="text-gray-400">BPM:</span>
            <span className="text-white ml-2">{music.bpm}</span>
          </div>
          <div>
            <span className="text-gray-400">Key:</span>
            <span className="text-white ml-2">{music.key}</span>
          </div>
        </div>
        
        {music.description && (
          <div className="mt-4">
            <span className="text-gray-400 text-sm">Description:</span>
            <p className="text-white text-sm mt-1">{music.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  PlayIcon, 
  PauseIcon, 
  MusicalNoteIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightIcon,
  HeartIcon,
  ShareIcon,
  DownloadIcon,
  MicrophoneIcon,
  BeakerIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon as PlaySolid,
  PauseIcon as PauseSolid,
  HeartIcon as HeartSolid
} from '@heroicons/react/24/solid';

import { MusicGenerator } from '@/components/MusicGenerator';
import { MusicPlayer } from '@/components/MusicPlayer';
import { MoodSelector } from '@/components/MoodSelector';
import { GenreSelector } from '@/components/GenreSelector';
import { MusicCard } from '@/components/MusicCard';
import { StatsCard } from '@/components/StatsCard';
import { FeatureCard } from '@/components/FeatureCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMusic } from '@/hooks/useMusic';
import { api } from '@/lib/api';

const AVAILABLE_MOODS = [
  { id: 'happy', name: 'Happy', emoji: '😊', color: 'bg-yellow-500' },
  { id: 'sad', name: 'Sad', emoji: '😢', color: 'bg-blue-500' },
  { id: 'energetic', name: 'Energetic', emoji: '⚡', color: 'bg-orange-500' },
  { id: 'calm', name: 'Calm', emoji: '😌', color: 'bg-green-500' },
  { id: 'romantic', name: 'Romantic', emoji: '💕', color: 'bg-pink-500' },
  { id: 'mysterious', name: 'Mysterious', emoji: '🔮', color: 'bg-purple-500' },
  { id: 'uplifting', name: 'Uplifting', emoji: '🌟', color: 'bg-yellow-400' },
  { id: 'melancholic', name: 'Melancholic', emoji: '🌧️', color: 'bg-gray-500' },
  { id: 'aggressive', name: 'Aggressive', emoji: '🔥', color: 'bg-red-500' },
  { id: 'peaceful', name: 'Peaceful', emoji: '🕊️', color: 'bg-blue-400' },
  { id: 'nostalgic', name: 'Nostalgic', emoji: '📷', color: 'bg-amber-500' },
  { id: 'dramatic', name: 'Dramatic', emoji: '🎭', color: 'bg-red-600' },
  { id: 'playful', name: 'Playful', emoji: '🎈', color: 'bg-pink-400' },
  { id: 'serious', name: 'Serious', emoji: '🎯', color: 'bg-gray-600' },
  { id: 'dreamy', name: 'Dreamy', emoji: '💫', color: 'bg-indigo-400' },
  { id: 'powerful', name: 'Powerful', emoji: '💪', color: 'bg-red-700' }
];

const AVAILABLE_GENRES = [
  { id: 'pop', name: 'Pop', icon: '🎵' },
  { id: 'rock', name: 'Rock', icon: '🤘' },
  { id: 'jazz', name: 'Jazz', icon: '🎷' },
  { id: 'classical', name: 'Classical', icon: '🎻' },
  { id: 'electronic', name: 'Electronic', icon: '🎧' },
  { id: 'hip-hop', name: 'Hip-Hop', icon: '🎤' },
  { id: 'country', name: 'Country', icon: '🤠' },
  { id: 'blues', name: 'Blues', icon: '🎸' },
  { id: 'folk', name: 'Folk', icon: '🪕' },
  { id: 'reggae', name: 'Reggae', icon: '🌴' },
  { id: 'r&b', name: 'R&B', icon: '🎹' },
  { id: 'metal', name: 'Metal', icon: '⚡' },
  { id: 'punk', name: 'Punk', icon: '💀' },
  { id: 'indie', name: 'Indie', icon: '🎪' },
  { id: 'ambient', name: 'Ambient', icon: '🌌' },
  { id: 'lofi', name: 'Lo-Fi', icon: '☕' },
  { id: 'house', name: 'House', icon: '🏠' },
  { id: 'techno', name: 'Techno', icon: '🔊' }
];

const FEATURES = [
  {
    icon: SparklesIcon,
    title: 'AI Music Generation',
    description: 'Create unique music with advanced AI models using natural language prompts and mood selection.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BeakerIcon,
    title: 'AI Training System',
    description: 'Submit your code and music to train our AI models for better, more personalized results.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: MicrophoneIcon,
    title: 'Stem Separation',
    description: 'Get individual tracks for vocals, drums, bass, and melody for professional remixing.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: MusicalNoteIcon,
    title: 'MIDI Export',
    description: 'Export your generated music as MIDI files for further editing in your DAW.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: UserGroupIcon,
    title: 'Collaboration',
    description: 'Share and collaborate on music projects with other creators worldwide.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics',
    description: 'Track your music generation stats and see detailed analytics of your creative journey.',
    color: 'from-teal-500 to-blue-500'
  }
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { generateMusic, isGenerating, currentMusic } = useMusic();
  const [selectedMood, setSelectedMood] = useState(AVAILABLE_MOODS[0]);
  const [selectedGenre, setSelectedGenre] = useState(AVAILABLE_GENRES[0]);
  const [prompt, setPrompt] = useState('');
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch recent music
  const { data: recentMusic, isLoading: loadingRecent } = useQuery(
    'recent-music',
    () => api.get('/music/feed/public?limit=6'),
    { enabled: true }
  );

  // Fetch user stats
  const { data: userStats } = useQuery(
    'user-stats',
    () => api.get('/user/stats'),
    { enabled: isAuthenticated }
  );

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for music generation');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to generate music');
      return;
    }

    try {
      await generateMusic({
        prompt: prompt.trim(),
        mood: selectedMood.id,
        genre: selectedGenre.id,
        bpm,
        duration
      });
      
      toast.success('Music generation started!');
    } catch (error) {
      toast.error('Failed to start music generation');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-secondary-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-6">
              Create Music with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Generate professional music using advanced AI. Choose your mood, genre, and let our AI create unique tracks for you.
            </p>
            
            {/* Quick Generation Interface */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl mx-auto bg-dark-800/50 backdrop-blur-lg rounded-2xl p-8 border border-dark-700"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Mood Selection */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Choose Mood
                  </label>
                  <MoodSelector
                    moods={AVAILABLE_MOODS}
                    selectedMood={selectedMood}
                    onMoodSelect={setSelectedMood}
                  />
                </motion.div>

                {/* Genre Selection */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Choose Genre
                  </label>
                  <GenreSelector
                    genres={AVAILABLE_GENRES}
                    selectedGenre={selectedGenre}
                    onGenreSelect={setSelectedGenre}
                  />
                </motion.div>
              </div>

              {/* Prompt Input */}
              <motion.div variants={itemVariants} className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Describe your music
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A happy pop song about summer days with catchy melodies and upbeat rhythms..."
                  className="w-full h-24 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </motion.div>

              {/* Controls */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    BPM: {bpm}
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration: {duration}s
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="300"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateMusic}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        Generate Music
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Current Music Player */}
      {currentMusic && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <MusicPlayer music={currentMusic} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Advanced Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to create professional music with AI
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {FEATURES.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Music Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Recently Generated
            </h2>
            <p className="text-xl text-gray-300">
              Check out the latest music created by our community
            </p>
          </motion.div>

          {loadingRecent ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {recentMusic?.data?.data?.music?.map((music, index) => (
                <motion.div key={music.id} variants={itemVariants}>
                  <MusicCard music={music} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {isAuthenticated && userStats && (
        <section className="py-20 bg-dark-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Your Music Stats
              </h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Music Generated"
                  value={userStats.data.musicGenerated}
                  icon={MusicalNoteIcon}
                  color="from-primary-500 to-primary-600"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Total Play Time"
                  value={`${Math.round(userStats.data.totalPlayTime / 60)}m`}
                  icon={PlayIcon}
                  color="from-secondary-500 to-secondary-600"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Playlists Created"
                  value={userStats.data.playlistsCreated}
                  icon={HeartIcon}
                  color="from-accent-500 to-accent-600"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatsCard
                  title="Training Submissions"
                  value={userStats.data.trainingSubmissions}
                  icon={BeakerIcon}
                  color="from-success-500 to-success-600"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Amazing Music?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of creators using AI to generate professional music
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Start Creating
              </button>
              <button className="border border-gray-600 hover:border-gray-500 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                <StarIcon className="w-5 h-5" />
                View Examples
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Mood {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface MoodSelectorProps {
  moods: Mood[];
  selectedMood: Mood;
  onMoodSelect: (mood: Mood) => void;
}

export function MoodSelector({ moods, selectedMood, onMoodSelect }: MoodSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const containerVariants = {
    collapsed: {
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    expanded: {
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  return (
    <div className="relative">
      {/* Selected Mood Display */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 bg-dark-700 border border-dark-600 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${selectedMood.color} flex items-center justify-center text-xl`}>
            {selectedMood.emoji}
          </div>
          <div>
            <div className="text-white font-medium">{selectedMood.name}</div>
            <div className="text-sm text-gray-400">Mood</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <motion.div
                    key={mood.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={() => {
                      onMoodSelect(mood);
                      setIsExpanded(false);
                    }}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedMood.id === mood.id
                        ? 'bg-dark-700 border border-primary-500'
                        : 'bg-dark-700 hover:bg-dark-600 border border-transparent'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${mood.color} flex items-center justify-center text-lg`}>
                        {mood.emoji}
                      </div>
                      <span className="text-white text-sm font-medium">{mood.name}</span>
                    </div>
                    
                    {selectedMood.id === mood.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                      >
                        <CheckIcon className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for smaller screens
export function CompactMoodSelector({ moods, selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {moods.map((mood) => (
        <motion.button
          key={mood.id}
          onClick={() => onMoodSelect(mood)}
          className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 ${
            selectedMood.id === mood.id
              ? 'bg-primary-500 text-white'
              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`w-10 h-10 rounded-full ${mood.color} flex items-center justify-center text-xl`}>
            {mood.emoji}
          </div>
          <span className="text-xs font-medium">{mood.name}</span>
        </motion.button>
      ))}
    </div>
  );
}

// Grid version for larger displays
export function GridMoodSelector({ moods, selectedMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {moods.map((mood) => (
        <motion.button
          key={mood.id}
          onClick={() => onMoodSelect(mood)}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 ${
            selectedMood.id === mood.id
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
          }`}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`w-12 h-12 rounded-full ${mood.color} flex items-center justify-center text-2xl`}>
            {mood.emoji}
          </div>
          <span className="text-xs font-medium text-center">{mood.name}</span>
          
          {selectedMood.id === mood.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
            >
              <CheckIcon className="w-3 h-3 text-primary-500" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
} 
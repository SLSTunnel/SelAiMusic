const express = require('express');
const router = express.Router();
const Music = require('../models/Music');
const { validateMusicGeneration } = require('../middleware/validation');
const { uploadToS3, generateSignedUrl } = require('../services/s3Service');
const { generateMusic } = require('../services/aiService');
const { processAudio } = require('../services/audioService');

// Available moods for music generation
const AVAILABLE_MOODS = [
  'happy', 'sad', 'energetic', 'calm', 'romantic', 'mysterious',
  'uplifting', 'melancholic', 'aggressive', 'peaceful', 'nostalgic',
  'dramatic', 'playful', 'serious', 'dreamy', 'powerful'
];

// Available genres
const AVAILABLE_GENRES = [
  'pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop',
  'country', 'blues', 'folk', 'reggae', 'r&b', 'metal',
  'punk', 'indie', 'ambient', 'lofi', 'house', 'techno'
];

// Get available moods and genres
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: {
      moods: AVAILABLE_MOODS,
      genres: AVAILABLE_GENRES,
      keys: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
      bpmRange: { min: 60, max: 200, default: 120 }
    }
  });
});

// Generate music from prompt
router.post('/generate', validateMusicGeneration, async (req, res) => {
  try {
    const {
      prompt,
      mood,
      genre,
      bpm = 120,
      key = 'C',
      duration = 60,
      temperature = 0.8,
      topP = 0.9,
      tags = []
    } = req.body;

    const userId = req.user.id;

    // Create music record
    const music = new Music({
      title: `Generated Music - ${new Date().toLocaleDateString()}`,
      description: prompt,
      creator: userId,
      prompt,
      mood,
      genre,
      bpm,
      key,
      duration,
      aiModel: 'selai-music-v1',
      generationParams: {
        temperature,
        topP,
        seed: Math.floor(Math.random() * 1000000)
      },
      tags,
      startedAt: new Date()
    });

    await music.save();

    // Start generation in background
    generateMusic(music._id, {
      prompt,
      mood,
      genre,
      bpm,
      key,
      duration,
      temperature,
      topP
    }).catch(error => {
      console.error('Music generation error:', error);
      music.status = 'failed';
      music.error = {
        message: 'Generation failed',
        code: 'GENERATION_ERROR',
        details: error.message
      };
      music.save();
    });

    res.json({
      success: true,
      message: 'Music generation started',
      data: {
        musicId: music._id,
        status: music.status,
        estimatedTime: Math.ceil(duration / 10) // Rough estimate
      }
    });

  } catch (error) {
    console.error('Music generation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start music generation',
      error: error.message
    });
  }
});

// Get music generation status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const music = await Music.findOne({ _id: id, creator: userId });
    
    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: music._id,
        status: music.status,
        progress: music.progress,
        generationTime: music.generationTime,
        estimatedTimeRemaining: music.status === 'generating' ? 
          Math.max(0, Math.ceil((music.duration / 10) - (music.generationTime / 60))) : 0,
        error: music.error
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
});

// Get music details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const music = await Music.findOne({
      _id: id,
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    }).populate('creator', 'username avatar');

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }

    // Increment play count if not the creator
    if (music.creator._id.toString() !== userId) {
      music.incrementPlays();
    }

    res.json({
      success: true,
      data: music.getPublicData()
    });

  } catch (error) {
    console.error('Get music error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get music',
      error: error.message
    });
  }
});

// Download main audio file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const music = await Music.findOne({
      _id: id,
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    });

    if (!music || music.status !== 'completed') {
      return res.status(404).json({
        success: false,
        message: 'Music not found or not ready'
      });
    }

    // Increment download count
    music.incrementDownloads();

    // Generate signed URL for download
    const downloadUrl = await generateSignedUrl(music.files.main.key, 3600); // 1 hour

    res.json({
      success: true,
      data: {
        downloadUrl,
        filename: `${music.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${music.files.main.format}`,
        size: music.files.main.size
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link',
      error: error.message
    });
  }
});

// Get separated stems
router.get('/:id/stems', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const music = await Music.findOne({
      _id: id,
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    });

    if (!music || music.status !== 'completed') {
      return res.status(404).json({
        success: false,
        message: 'Music not found or not ready'
      });
    }

    // Check if stems exist
    if (!music.files.stems.vocals.url) {
      return res.status(404).json({
        success: false,
        message: 'Stems not available for this track'
      });
    }

    // Generate signed URLs for all stems
    const stems = {};
    for (const [stemName, stemData] of Object.entries(music.files.stems)) {
      if (stemData.url) {
        stems[stemName] = {
          url: await generateSignedUrl(stemData.key, 3600),
          size: stemData.size
        };
      }
    }

    res.json({
      success: true,
      data: {
        stems,
        trackInfo: {
          title: music.title,
          duration: music.duration,
          bpm: music.bpm,
          key: music.key
        }
      }
    });

  } catch (error) {
    console.error('Stems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stems',
      error: error.message
    });
  }
});

// Get MIDI file
router.get('/:id/midi', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const music = await Music.findOne({
      _id: id,
      $or: [
        { creator: userId },
        { isPublic: true }
      ]
    });

    if (!music || music.status !== 'completed') {
      return res.status(404).json({
        success: false,
        message: 'Music not found or not ready'
      });
    }

    if (!music.files.midi.url) {
      return res.status(404).json({
        success: false,
        message: 'MIDI file not available for this track'
      });
    }

    const midiUrl = await generateSignedUrl(music.files.midi.key, 3600);

    res.json({
      success: true,
      data: {
        midiUrl,
        filename: `${music.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mid`,
        size: music.files.midi.size
      }
    });

  } catch (error) {
    console.error('MIDI error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get MIDI file',
      error: error.message
    });
  }
});

// Get user's music
router.get('/user/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { creator: userId };
    if (status) {
      query.status = status;
    }

    const music = await Music.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('creator', 'username avatar');

    const total = await Music.countDocuments(query);

    res.json({
      success: true,
      data: {
        music: music.map(m => m.getPublicData()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user music error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user music',
      error: error.message
    });
  }
});

// Get public music feed
router.get('/feed/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, mood } = req.query;

    const query = { isPublic: true, status: 'completed' };
    if (genre) query.genre = genre;
    if (mood) query.mood = mood;

    const music = await Music.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('creator', 'username avatar');

    const total = await Music.countDocuments(query);

    res.json({
      success: true,
      data: {
        music: music.map(m => m.getPublicData()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Public feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public feed',
      error: error.message
    });
  }
});

// Update music metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, tags, isPublic, isRemixable, license } = req.body;

    const music = await Music.findOne({ _id: id, creator: userId });

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }

    // Update fields
    if (title) music.title = title;
    if (description !== undefined) music.description = description;
    if (tags) music.tags = tags;
    if (isPublic !== undefined) music.isPublic = isPublic;
    if (isRemixable !== undefined) music.isRemixable = isRemixable;
    if (license) music.license = license;

    await music.save();

    res.json({
      success: true,
      message: 'Music updated successfully',
      data: music.getPublicData()
    });

  } catch (error) {
    console.error('Update music error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update music',
      error: error.message
    });
  }
});

// Delete music
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const music = await Music.findOne({ _id: id, creator: userId });

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }

    // Delete files from S3
    // This would typically be done in a background job
    // For now, just delete the record
    await music.remove();

    res.json({
      success: true,
      message: 'Music deleted successfully'
    });

  } catch (error) {
    console.error('Delete music error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete music',
      error: error.message
    });
  }
});

module.exports = router; 
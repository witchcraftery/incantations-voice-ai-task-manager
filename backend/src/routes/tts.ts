import express from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schema for TTS request
const TTSRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().optional().default('aura-asteria-en'),
  speed: z.number().min(0.25).max(4.0).optional().default(1.0)
});

// Deepgram TTS endpoint
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice, speed } = TTSRequestSchema.parse(req.body);

    if (!process.env.DEEPGRAM_API_KEY) {
      logger.error('DEEPGRAM_API_KEY not configured');
      return res.status(500).json({ error: 'TTS service not configured' });
    }

    logger.info(`🎤 TTS request: "${text.slice(0, 50)}..." with voice: ${voice}`);

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/speak?model=' + voice, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Deepgram API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ 
        error: 'TTS synthesis failed',
        details: errorText
      });
    }

    // Stream the audio response back to client
    const audioBuffer = await response.arrayBuffer();
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.byteLength.toString(),
      'Cache-Control': 'no-cache'
    });

    res.send(Buffer.from(audioBuffer));
    
    logger.info(`✅ TTS synthesis completed: ${audioBuffer.byteLength} bytes`);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('TTS synthesis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available voices
router.get('/voices', async (req, res) => {
  try {
    const voices = [
      { id: 'aura-asteria-en', name: 'Asteria (Female)', language: 'en-US' },
      { id: 'aura-luna-en', name: 'Luna (Female)', language: 'en-US' },
      { id: 'aura-stella-en', name: 'Stella (Female)', language: 'en-US' },
      { id: 'aura-athena-en', name: 'Athena (Female)', language: 'en-US' },
      { id: 'aura-hera-en', name: 'Hera (Female)', language: 'en-US' },
      { id: 'aura-orion-en', name: 'Orion (Male)', language: 'en-US' },
      { id: 'aura-arcas-en', name: 'Arcas (Male)', language: 'en-US' },
      { id: 'aura-perseus-en', name: 'Perseus (Male)', language: 'en-US' },
      { id: 'aura-angus-en', name: 'Angus (Male)', language: 'en-US' },
      { id: 'aura-orpheus-en', name: 'Orpheus (Male)', language: 'en-US' }
    ];

    res.json({ voices });
  } catch (error) {
    logger.error('Failed to get voices:', error);
    res.status(500).json({ error: 'Failed to get available voices' });
  }
});

// Health check for TTS service
router.get('/health', async (req, res) => {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(503).json({ 
        status: 'unavailable',
        error: 'DEEPGRAM_API_KEY not configured'
      });
    }

    // Test Deepgram API connectivity with a minimal request
    const testResponse = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: 'test' })
    });

    if (testResponse.ok) {
      res.json({ 
        status: 'healthy',
        provider: 'deepgram',
        voices_available: 10
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy',
        error: `Deepgram API returned ${testResponse.status}`
      });
    }
  } catch (error) {
    logger.error('TTS health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Failed to connect to TTS service'
    });
  }
});

export default router;

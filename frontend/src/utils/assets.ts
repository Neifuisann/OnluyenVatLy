/**
 * Asset utilities for OnluyenVatLy Next.js frontend
 * Handles asset paths, loading, and optimization
 */

// Asset path constants
export const ASSET_PATHS = {
  images: '/images',
  audio: '/audio',
  lessonHandouts: '/lesson_handout',
} as const;

// Audio file mappings for quiz game
export const AUDIO_FILES = {
  background: {
    music1: '/audio/30sec_1.mp3',
    music2: '/audio/30sec_2.mp3',
    music3: '/audio/30sec_3.mp3',
  },
  celebration: {
    music1: '/audio/5sec_1.mp3',
    music2: '/audio/5sec_2.mp3',
    music3: '/audio/5sec_3.mp3',
  },
  correct: {
    sound1: '/audio/correct_1.mp3',
    sound2: '/audio/correct_2.mp3',
    sound3: '/audio/correct_3.mp3',
    sound4: '/audio/correct_4.mp3',
    sound5: '/audio/correct_5.mp3',
  },
  incorrect: '/audio/incorrect.mp3',
  points: '/audio/points.mp3',
} as const;

// Lesson image mappings
export const LESSON_IMAGES = {
  lesson1: '/images/lesson1.jpg',
  lesson2: '/images/lesson2.jpg',
  lesson3: '/images/lesson3.jpg',
  lesson4: '/images/lesson4.jpg',
} as const;

/**
 * Get the correct asset path for Next.js public folder
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${cleanPath}`;
}

/**
 * Get lesson handout image path
 */
export function getLessonHandoutPath(lessonNumber: number): string {
  return `${ASSET_PATHS.lessonHandouts}/${lessonNumber}.jpg`;
}

/**
 * Get lesson image path by lesson ID
 */
export function getLessonImagePath(lessonId: string | number): string {
  return `${ASSET_PATHS.images}/lesson${lessonId}.jpg`;
}

/**
 * Get audio file path by type and variant
 */
export function getAudioPath(type: keyof typeof AUDIO_FILES, variant?: string): string {
  const audioGroup = AUDIO_FILES[type];
  
  if (typeof audioGroup === 'string') {
    return audioGroup;
  }
  
  if (variant && variant in audioGroup) {
    return audioGroup[variant as keyof typeof audioGroup];
  }
  
  // Return first available variant if no specific variant requested
  const firstKey = Object.keys(audioGroup)[0];
  return audioGroup[firstKey as keyof typeof audioGroup];
}

/**
 * Preload audio files for better performance
 */
export function preloadAudio(audioPath: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioPath);
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
    audio.addEventListener('error', reject, { once: true });
    
    // Start loading
    audio.load();
  });
}

/**
 * Preload multiple audio files
 */
export async function preloadAudioFiles(audioPaths: string[]): Promise<HTMLAudioElement[]> {
  try {
    const audioPromises = audioPaths.map(path => preloadAudio(path));
    return await Promise.all(audioPromises);
  } catch (error) {
    console.warn('Failed to preload some audio files:', error);
    return [];
  }
}

/**
 * Check if an image URL is a base64 data URL
 */
export function isBase64Image(src: string): boolean {
  return src.startsWith('data:image/');
}

/**
 * Check if an image URL is an external URL
 */
export function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}

/**
 * Get optimized image props for Next.js Image component
 */
export function getImageProps(src: string, alt: string, options: {
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
} = {}) {
  const {
    width = 800,
    height = 600,
    priority = false,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  } = options;

  // For base64 or external images, use unoptimized
  if (isBase64Image(src) || isExternalImage(src)) {
    return {
      src,
      alt,
      width,
      height,
      priority,
      unoptimized: true,
    };
  }

  // For local images, use Next.js optimization
  return {
    src: getAssetPath(src),
    alt,
    width,
    height,
    priority,
    sizes,
  };
}

/**
 * Audio manager class for quiz game
 */
export class AudioManager {
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private currentlyPlaying: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioElements();
    }
  }

  private initializeAudioElements() {
    // Initialize background music
    Object.entries(AUDIO_FILES.background).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioElements.set(`background-${key}`, audio);
    });

    // Initialize celebration music
    Object.entries(AUDIO_FILES.celebration).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioElements.set(`celebration-${key}`, audio);
    });

    // Initialize correct sounds
    Object.entries(AUDIO_FILES.correct).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioElements.set(`correct-${key}`, audio);
    });

    // Initialize other sounds
    const incorrectAudio = new Audio(AUDIO_FILES.incorrect);
    incorrectAudio.preload = 'auto';
    this.audioElements.set('incorrect', incorrectAudio);

    const pointsAudio = new Audio(AUDIO_FILES.points);
    pointsAudio.preload = 'auto';
    this.audioElements.set('points', pointsAudio);
  }

  play(audioKey: string): void {
    const audio = this.audioElements.get(audioKey);
    if (audio) {
      this.stopAll();
      audio.currentTime = 0;
      audio.play().catch(console.warn);
      this.currentlyPlaying = audio;
    }
  }

  stop(audioKey: string): void {
    const audio = this.audioElements.get(audioKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (this.currentlyPlaying === audio) {
        this.currentlyPlaying = null;
      }
    }
  }

  stopAll(): void {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.currentlyPlaying = null;
  }

  setVolume(volume: number): void {
    this.audioElements.forEach(audio => {
      audio.volume = Math.max(0, Math.min(1, volume));
    });
  }

  getCurrentlyPlaying(): string | null {
    if (!this.currentlyPlaying) return null;
    
    for (const [key, audio] of this.audioElements.entries()) {
      if (audio === this.currentlyPlaying) {
        return key;
      }
    }
    return null;
  }
}

// Export singleton instance
export const audioManager = typeof window !== 'undefined' ? new AudioManager() : null;

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { audioManager, getAudioPath, AUDIO_FILES } from '@/utils/assets';

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  className?: string;
  showControls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/**
 * Audio Player component with custom controls
 */
export function AudioPlayer({
  src,
  autoPlay = false,
  loop = false,
  volume = 1,
  className = '',
  showControls = true,
  onPlay,
  onPause,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = currentVolume;
    audio.loop = loop;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    if (autoPlay) {
      audio.play().catch(console.warn);
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, loop, currentVolume, onPlay, onPause, onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.warn);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = currentVolume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setCurrentVolume(newVolume);
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  if (!showControls) {
    return (
      <audio
        ref={audioRef}
        src={src}
        className={className}
        preload="auto"
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 bg-glass-bg border border-glass-border rounded-lg backdrop-blur-sm ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
      />
      
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-primary-gradient text-white hover:scale-105 transition-transform"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      
      <button
        onClick={toggleMute}
        className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={isMuted ? 0 : currentVolume}
        onChange={handleVolumeChange}
        className="w-16 h-1 bg-glass-border rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

/**
 * Quiz Game Audio Manager Component
 */
export function QuizAudioManager({
  onAudioReady,
}: {
  onAudioReady?: () => void;
}) {
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    if (audioManager) {
      audioManager.setVolume(volume);
      setIsReady(true);
      onAudioReady?.();
    }
  }, [volume, onAudioReady]);

  const playBackgroundMusic = (index: number = 1) => {
    if (audioManager) {
      audioManager.play(`background-music${index}`);
    }
  };

  const playCelebrationMusic = (index: number = 1) => {
    if (audioManager) {
      audioManager.play(`celebration-music${index}`);
    }
  };

  const playCorrectSound = (streak: number = 1) => {
    if (audioManager) {
      const soundIndex = Math.min(streak, 5);
      audioManager.play(`correct-sound${soundIndex}`);
    }
  };

  const playIncorrectSound = () => {
    if (audioManager) {
      audioManager.play('incorrect');
    }
  };

  const playPointsSound = () => {
    if (audioManager) {
      audioManager.play('points');
    }
  };

  const stopAllAudio = () => {
    if (audioManager) {
      audioManager.stopAll();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  if (!isReady) {
    return (
      <div className="text-text-secondary text-sm">
        Loading audio...
      </div>
    );
  }

  // Audio control functions available for future use
  // These can be exposed via props or context when needed

  return (
    <div className="quiz-audio-manager">
      {/* Hidden audio elements for preloading */}
      {Object.values(AUDIO_FILES.background).map((src, index) => (
        <audio key={`bg-${index}`} src={src} preload="auto" />
      ))}
      {Object.values(AUDIO_FILES.celebration).map((src, index) => (
        <audio key={`cel-${index}`} src={src} preload="auto" />
      ))}
      {Object.values(AUDIO_FILES.correct).map((src, index) => (
        <audio key={`cor-${index}`} src={src} preload="auto" />
      ))}
      <audio src={AUDIO_FILES.incorrect} preload="auto" />
      <audio src={AUDIO_FILES.points} preload="auto" />

      {/* Volume control */}
      <div className="flex items-center gap-2 text-sm">
        <Volume2 size={16} className="text-text-secondary" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 bg-glass-border rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-text-secondary min-w-[3ch]">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Simple Audio Button for one-off sounds
 */
export function AudioButton({
  audioType,
  variant,
  children,
  className = '',
  ...props
}: {
  audioType: keyof typeof AUDIO_FILES;
  variant?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = () => {
    const audioPath = getAudioPath(audioType, variant);
    const audio = new Audio(audioPath);
    audio.play().catch(console.warn);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

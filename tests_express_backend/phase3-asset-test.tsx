/**
 * Phase 3 Asset Components Test
 * Tests the new asset management components and utilities
 */

import React from 'react';
import { 
  OptimizedImage, 
  LessonImage, 
  LessonHandoutImage, 
  AvatarImage,
  AudioPlayer,
  QuizAudioManager,
  AudioButton 
} from '../frontend/src/components/ui';
import { 
  getAssetPath, 
  getLessonImagePath, 
  getLessonHandoutPath, 
  getAudioPath,
  AUDIO_FILES,
  LESSON_IMAGES 
} from '../frontend/src/utils/assets';

export default function Phase3AssetTest() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold gradient-text">Phase 3 Asset Components Test</h1>
      
      {/* Image Components Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Image Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* OptimizedImage */}
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">OptimizedImage</h3>
            <OptimizedImage
              src="/images/lesson1.jpg"
              alt="Lesson 1 test"
              width={300}
              height={200}
              className="rounded-lg"
            />
          </div>
          
          {/* LessonImage */}
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">LessonImage</h3>
            <LessonImage
              lessonId={2}
              alt="Lesson 2 test"
              width={300}
              height={200}
              className="rounded-lg"
            />
          </div>
          
          {/* LessonHandoutImage */}
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">LessonHandoutImage</h3>
            <LessonHandoutImage
              lessonNumber={5}
              alt="Lesson 5 handout test"
              width={300}
              height={200}
              className="rounded-lg"
            />
          </div>
          
          {/* AvatarImage */}
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">AvatarImage</h3>
            <div className="flex gap-4 items-center">
              <AvatarImage
                src="/images/lesson1.jpg"
                alt="User Avatar"
                size={60}
              />
              <AvatarImage
                alt="Fallback Avatar"
                size={60}
                fallbackInitials="FA"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Audio Components Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Audio Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AudioPlayer */}
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">AudioPlayer</h3>
            <AudioPlayer
              src="/audio/correct_1.mp3"
              showControls={true}
              className="w-full"
            />
          </div>
          
          {/* AudioButton */}
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">AudioButton</h3>
            <div className="space-y-2">
              <AudioButton
                audioType="correct"
                variant="sound1"
                className="btn-base btn-primary"
              >
                🎵 Play Correct Sound
              </AudioButton>
              
              <AudioButton
                audioType="incorrect"
                className="btn-base btn-secondary"
              >
                ❌ Play Incorrect Sound
              </AudioButton>
            </div>
          </div>
        </div>
        
        {/* Quiz Audio Manager */}
        <div className="glass-card">
          <h3 className="text-lg font-medium mb-2">QuizAudioManager</h3>
          <QuizAudioManager onAudioReady={() => console.log('Quiz audio ready!')} />
        </div>
      </section>
      
      {/* Asset Utilities Test */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Asset Utilities</h2>
        
        <div className="glass-card">
          <h3 className="text-lg font-medium mb-2">Path Generation</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <strong>getLessonImagePath(1):</strong> {getLessonImagePath(1)}
            </div>
            <div>
              <strong>getLessonHandoutPath(5):</strong> {getLessonHandoutPath(5)}
            </div>
            <div>
              <strong>getAudioPath('correct', 'sound1'):</strong> {getAudioPath('correct', 'sound1')}
            </div>
            <div>
              <strong>getAssetPath('/images/test.jpg'):</strong> {getAssetPath('/images/test.jpg')}
            </div>
          </div>
        </div>
        
        <div className="glass-card">
          <h3 className="text-lg font-medium mb-2">Asset Constants</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Available Lesson Images:</strong>
              <ul className="list-disc list-inside ml-4">
                {Object.entries(LESSON_IMAGES).map(([key, path]) => (
                  <li key={key}>{key}: {path}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <strong>Available Audio Files:</strong>
              <ul className="list-disc list-inside ml-4">
                <li>Background Music: {Object.keys(AUDIO_FILES.background).length} files</li>
                <li>Celebration Sounds: {Object.keys(AUDIO_FILES.celebration).length} files</li>
                <li>Correct Sounds: {Object.keys(AUDIO_FILES.correct).length} files</li>
                <li>Other: incorrect, points</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Performance Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Performance Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">✅ Implemented</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Next.js Image optimization</li>
              <li>Automatic WebP conversion</li>
              <li>Responsive image loading</li>
              <li>Lazy loading for images</li>
              <li>Audio preloading for quiz</li>
              <li>Error handling with fallbacks</li>
              <li>Loading states with spinners</li>
              <li>TypeScript support</li>
            </ul>
          </div>
          
          <div className="glass-card">
            <h3 className="text-lg font-medium mb-2">🎯 Benefits</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Faster image loading</li>
              <li>Reduced bandwidth usage</li>
              <li>Better Core Web Vitals</li>
              <li>Instant audio playback</li>
              <li>Graceful error handling</li>
              <li>Consistent user experience</li>
              <li>Developer-friendly API</li>
              <li>Accessibility compliance</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

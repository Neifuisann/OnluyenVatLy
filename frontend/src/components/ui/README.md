# Asset Components Usage Guide

This guide explains how to use the optimized asset components in the OnluyenVatLy Next.js frontend.

## Image Components

### OptimizedImage

The main image component that automatically handles optimization, loading states, and error handling.

```tsx
import { OptimizedImage } from '@/components/ui';

// Basic usage
<OptimizedImage
  src="/images/lesson1.jpg"
  alt="Lesson 1 cover"
  width={800}
  height={600}
/>

// With loading spinner and fallback
<OptimizedImage
  src="/images/lesson1.jpg"
  alt="Lesson 1 cover"
  width={800}
  height={600}
  fallbackSrc="/images/default-lesson.jpg"
  showLoadingSpinner={true}
  className="rounded-lg shadow-lg"
/>

// For external or base64 images (automatically detected)
<OptimizedImage
  src="https://example.com/image.jpg"
  alt="External image"
  width={400}
  height={300}
/>
```

### LessonImage

Specialized component for lesson images with automatic fallbacks.

```tsx
import { LessonImage } from '@/components/ui';

// Using lesson ID (will use /images/lesson{id}.jpg)
<LessonImage
  lessonId={1}
  alt="Physics lesson 1"
  width={800}
  height={600}
/>

// Using custom lesson image
<LessonImage
  lessonImage="/images/custom-lesson.jpg"
  alt="Custom lesson image"
  width={800}
  height={600}
/>

// With click handler for zoom/modal
<LessonImage
  lessonId={1}
  alt="Physics lesson 1"
  onClick={() => openImageModal()}
  className="cursor-pointer hover:scale-105 transition-transform"
/>
```

### LessonHandoutImage

For lesson handout materials.

```tsx
import { LessonHandoutImage } from '@/components/ui';

<LessonHandoutImage
  lessonNumber={5}
  alt="Lesson 5 handout"
  width={600}
  height={800}
  onClick={() => openHandoutViewer()}
/>
```

### AvatarImage

For user profile images with automatic fallbacks.

```tsx
import { AvatarImage } from '@/components/ui';

<AvatarImage
  src="/images/user-avatar.jpg"
  alt="User Name"
  size={40}
  fallbackInitials="UN"
/>
```

## Audio Components

### AudioPlayer

Full-featured audio player with controls.

```tsx
import { AudioPlayer } from '@/components/ui';

<AudioPlayer
  src="/audio/lesson-intro.mp3"
  showControls={true}
  autoPlay={false}
  loop={false}
  volume={0.7}
  onPlay={() => console.log('Audio started')}
  onPause={() => console.log('Audio paused')}
/>
```

### QuizAudioManager

Specialized component for quiz game audio management.

```tsx
import { QuizAudioManager } from '@/components/ui';

function QuizGame() {
  return (
    <div>
      <QuizAudioManager onAudioReady={() => console.log('Audio ready')} />
      {/* Quiz game content */}
    </div>
  );
}
```

### AudioButton

Simple button that plays a sound when clicked.

```tsx
import { AudioButton } from '@/components/ui';

<AudioButton
  audioType="correct"
  variant="sound1"
  className="btn-primary"
>
  Play Correct Sound
</AudioButton>
```

## Asset Utilities

### Asset Path Functions

```tsx
import { 
  getAssetPath, 
  getLessonImagePath, 
  getLessonHandoutPath, 
  getAudioPath 
} from '@/utils/assets';

// Get optimized asset paths
const imagePath = getLessonImagePath(1); // "/images/lesson1.jpg"
const handoutPath = getLessonHandoutPath(5); // "/lesson_handout/5.jpg"
const audioPath = getAudioPath('correct', 'sound1'); // "/audio/correct_1.mp3"
```

### Audio Manager

```tsx
import { audioManager } from '@/utils/assets';

// Play specific audio
audioManager?.play('background-music1');

// Stop all audio
audioManager?.stopAll();

// Set volume for all audio
audioManager?.setVolume(0.5);
```

## Migration from HTML/JS

### Before (HTML)
```html
<img src="/images/lesson1.jpg" alt="Lesson 1" />
<audio src="/audio/correct_1.mp3" controls></audio>
```

### After (React/Next.js)
```tsx
<LessonImage lessonId={1} alt="Lesson 1" />
<AudioPlayer src="/audio/correct_1.mp3" showControls={true} />
```

### Before (JavaScript)
```javascript
const img = document.createElement('img');
img.src = '/images/lesson' + lessonId + '.jpg';
img.alt = 'Lesson ' + lessonId;

const audio = new Audio('/audio/correct_1.mp3');
audio.play();
```

### After (React/Next.js)
```tsx
<LessonImage lessonId={lessonId} alt={`Lesson ${lessonId}`} />

<AudioButton audioType="correct" variant="sound1">
  Play Sound
</AudioButton>
```

## Performance Benefits

1. **Automatic Optimization**: Next.js Image component automatically optimizes images
2. **Responsive Images**: Automatic srcset generation for different screen sizes
3. **Lazy Loading**: Images load only when needed
4. **WebP Support**: Automatic WebP format when supported
5. **Audio Preloading**: Quiz audio files are preloaded for instant playback
6. **Error Handling**: Graceful fallbacks for missing assets

## Best Practices

1. **Always provide alt text** for accessibility
2. **Use appropriate image sizes** - don't load huge images for small displays
3. **Provide fallback images** for critical content
4. **Preload important audio** for interactive features
5. **Use priority loading** for above-the-fold images
6. **Handle loading states** for better UX

## CSS Classes Available

The components work with the existing CSS classes from the design system:

- `.lesson-image` - Applied to lesson images
- `.lesson-handout-image` - Applied to handout images
- `.glass-card` - For glassmorphism effects
- `.btn-primary`, `.btn-secondary` - For buttons
- Loading and skeleton classes from the design system

## TypeScript Support

All components are fully typed with TypeScript for better development experience and type safety.

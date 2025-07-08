const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const aiService = require('./aiService');

class ImageGenerationService {
  constructor() {
    this.pollinationsUrl = 'https://image.pollinations.ai/prompt';
    this.imageStoragePath = path.join(process.cwd(), 'public', 'lesson_images');
  }

  /**
   * Generate an image for a lesson using AI
   * @param {Object} lessonData - Lesson data including title, subject, grade, tags, questions
   * @returns {Object} - { success: boolean, imageUrl?: string, error?: string }
   */
  async generateLessonImage(lessonData) {
    try {
      // Step 1: Generate image prompt using AI
      const imagePrompt = await aiService.generateImagePrompt(lessonData);
      
      // Step 2: Generate image using Pollinations
      const imageUrl = await this.generateWithPollinations(imagePrompt);
      
      // Step 3: Download and save the image
      const savedImagePath = await this.downloadAndSaveImage(imageUrl, lessonData.id || 'temp');
      
      return {
        success: true,
        imageUrl: savedImagePath,
        prompt: imagePrompt
      };
    } catch (error) {
      console.error('Error generating lesson image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate image URL using Pollinations API
   * @param {string} prompt - Image generation prompt
   * @param {Object} options - Generation options
   * @returns {string} - Pollinations image URL
   */
  async generateWithPollinations(prompt, options = {}) {
    // Clean and simplify the prompt to avoid encoding issues
    const cleanPrompt = prompt
      .replace(/[^\w\s,.-]/g, ' ') // Remove special characters except basic punctuation
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 200); // Limit prompt length

    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(cleanPrompt);

    // Construct the full URL using the correct format: /prompt/{prompt}?params
    const imageUrl = `${this.pollinationsUrl}/${encodedPrompt}}`;

    console.log('Generated Pollinations URL:', imageUrl);

    // Verify the URL is accessible with a simple test
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        timeout: 20000 // 20 second timeout for verification
      });
      if (!response.ok) {
        console.warn(`Pollinations API returned ${response.status}, but continuing anyway`);
      }
    } catch (error) {
      console.warn('Error verifying Pollinations URL (continuing anyway):', error.message);
    }

    return imageUrl;
  }

  /**
   * Download image from URL and save to local storage
   * @param {string} imageUrl - URL of the image to download
   * @param {string} lessonId - Lesson ID for naming the file
   * @returns {string} - Relative path to saved image
   */
  async downloadAndSaveImage(imageUrl, lessonId) {
    try {
      console.log('Downloading image from:', imageUrl);

      // Ensure the storage directory exists
      await fs.mkdir(this.imageStoragePath, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(`${lessonId}-${timestamp}`).digest('hex').substring(0, 8);
      const filename = `lesson-${lessonId}-${hash}.png`;
      const filepath = path.join(this.imageStoragePath, filename);

      // Download the image with retry logic and wait time for generation
      let response;
      let retries = 3;

      while (retries > 0) {
        try {
          // Wait a bit for image generation (Pollinations might need time to generate)
          if (retries < 3) {
            console.log(`Waiting 10 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }

          response = await fetch(imageUrl, {
            timeout: 45000, // Increased timeout to 45 seconds
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (response.ok) {
            // Check if we actually got content
            const contentLength = response.headers.get('content-length');
            console.log('Content-Length header:', contentLength);

            const buffer = await response.buffer();
            console.log('Downloaded image size:', buffer.length, 'bytes');

            if (buffer.length > 1000) { // Valid image should be at least 1KB
              // Check content type
              const contentType = response.headers.get('content-type');
              console.log('Response content-type:', contentType);

              if (!contentType || !contentType.startsWith('image/')) {
                throw new Error(`Invalid content type: ${contentType}`);
              }

              // Success - we have a valid image
              // Save to file
              await fs.writeFile(filepath, buffer);
              console.log('Image saved to:', filepath);

              // Return relative path for web access
              return `/lesson_images/${filename}`;
            } else {
              console.warn(`Image too small (${buffer.length} bytes), retrying...`);
            }
          } else {
            console.warn(`HTTP ${response.status}: ${response.statusText}, retries left: ${retries - 1}`);
          }
        } catch (fetchError) {
          console.warn(`Fetch attempt failed: ${fetchError.message}, retries left: ${retries - 1}`);
        }

        retries--;
      }

      throw new Error('Failed to download valid image after all retries');
    } catch (error) {
      console.error('Error downloading and saving image:', error);
      throw new Error(`Failed to save generated image: ${error.message}`);
    }
  }

  /**
   * Generate multiple image variations for a lesson
   * @param {Object} lessonData - Lesson data
   * @param {number} count - Number of variations to generate
   * @returns {Array} - Array of generated image results
   */
  async generateImageVariations(lessonData, count = 3) {
    const results = [];
    
    try {
      // Generate the base prompt once
      const basePrompt = await aiService.generateImagePrompt(lessonData);
      
      // Generate variations with different seeds
      for (let i = 0; i < count; i++) {
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = await this.generateWithPollinations(basePrompt, { seed });
        
        results.push({
          index: i,
          prompt: basePrompt,
          seed: seed,
          url: imageUrl
        });
      }
      
      return {
        success: true,
        variations: results
      };
    } catch (error) {
      console.error('Error generating image variations:', error);
      return {
        success: false,
        error: error.message,
        variations: results
      };
    }
  }

  /**
   * Regenerate image with a modified prompt
   * @param {string} originalPrompt - Original image prompt
   * @param {string} modifier - Modification to apply to the prompt
   * @returns {Object} - Generation result
   */
  async regenerateWithModifier(originalPrompt, modifier) {
    try {
      // Combine original prompt with modifier
      const modifiedPrompt = `${originalPrompt}, ${modifier}`;
      
      // Generate new image
      const imageUrl = await this.generateWithPollinations(modifiedPrompt);
      
      return {
        success: true,
        imageUrl: imageUrl,
        prompt: modifiedPrompt
      };
    } catch (error) {
      console.error('Error regenerating image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old generated images
   * @param {number} daysToKeep - Number of days to keep images
   * @returns {Object} - Cleanup result
   */
  async cleanupOldImages(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.imageStoragePath);
      const now = Date.now();
      const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.startsWith('lesson-')) {
          const filepath = path.join(this.imageStoragePath, file);
          const stats = await fs.stat(filepath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filepath);
            deletedCount++;
          }
        }
      }
      
      return {
        success: true,
        deletedCount: deletedCount
      };
    } catch (error) {
      console.error('Error cleaning up old images:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a thumbnail version of an image
   * @param {string} imageUrl - URL or path of the original image
   * @param {Object} options - Thumbnail options
   * @returns {string} - URL of the thumbnail
   */
  async generateThumbnail(imageUrl, options = {}) {
    const {
      width = 200,
      height = 150
    } = options;

    // For Pollinations URLs, we can modify the parameters
    if (imageUrl.includes('pollinations.ai')) {
      const url = new URL(imageUrl);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('height', height.toString());
      return url.toString();
    }

    // For local images, return the same URL (thumbnail generation would require sharp or similar)
    return imageUrl;
  }

  /**
   * Validate if an image URL is accessible
   * @param {string} imageUrl - URL to validate
   * @returns {boolean} - Whether the image is accessible
   */
  async validateImageUrl(imageUrl) {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ImageGenerationService();
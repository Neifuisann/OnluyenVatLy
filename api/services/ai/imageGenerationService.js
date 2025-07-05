const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const aiService = require('./aiService');

class ImageGenerationService {
  constructor() {
    this.pollinationsUrl = 'https://pollinations.ai/p';
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
    const {
      width = 800,
      height = 600,
      seed = Math.floor(Math.random() * 1000000),
      model = 'flux', // Pollinations supports multiple models
      nologo = true
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      prompt: prompt,
      width: width.toString(),
      height: height.toString(),
      seed: seed.toString(),
      model: model,
      nologo: nologo.toString()
    });

    // Construct the full URL
    const imageUrl = `${this.pollinationsUrl}?${params.toString()}`;
    
    // Verify the URL is accessible
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error verifying Pollinations URL:', error);
      throw new Error('Failed to generate image with Pollinations');
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
      // Ensure the storage directory exists
      await fs.mkdir(this.imageStoragePath, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(`${lessonId}-${timestamp}`).digest('hex').substring(0, 8);
      const filename = `lesson-${lessonId}-${hash}.png`;
      const filepath = path.join(this.imageStoragePath, filename);

      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const buffer = await response.buffer();
      
      // Save to file
      await fs.writeFile(filepath, buffer);

      // Return relative path for web access
      return `/lesson_images/${filename}`;
    } catch (error) {
      console.error('Error downloading and saving image:', error);
      throw new Error('Failed to save generated image');
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
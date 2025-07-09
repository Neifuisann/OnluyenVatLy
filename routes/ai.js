const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../lib/middleware/errorHandler');
const { requireAdminAuth } = require('../lib/middleware/auth');
const { noCacheMiddleware } = require('../lib/middleware/cache');
const aiCacheService = require('../lib/services/cache/aiCacheService');
const databaseService = require('../lib/services/databaseService');

// Get AI cache statistics
router.get('/cache/stats',
  requireAdminAuth,
  noCacheMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const cacheStats = aiCacheService.getStats();
      
      // Calculate cache size and usage percentage
      const memoryCacheSize = Object.keys(cacheStats.memoryCache).reduce((total, key) => {
        return total + cacheStats.memoryCache[key];
      }, 0);
      
      const totalSize = memoryCacheSize + cacheStats.persistentCache.size;
      const maxCacheItems = 1000; // Configure based on your needs
      const usagePercentage = (totalSize / maxCacheItems) * 100;
      
      res.json({
        memory: {
          size: totalSize,
          usage: Math.round(usagePercentage)
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({ error: 'Failed to get cache statistics' });
    }
  })
);

// Clear AI cache
router.post('/cache/clear',
  requireAdminAuth,
  noCacheMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const { type } = req.body;
      
      if (type) {
        // Clear specific cache type
        await aiCacheService.clearCache(type);
        res.json({ message: `${type} cache cleared successfully` });
      } else {
        // Clear all cache
        await aiCacheService.clearAllCache();
        res.json({ message: 'All cache cleared successfully' });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  })
);

// Get AI usage statistics
router.get('/usage/stats',
  requireAdminAuth,
  noCacheMiddleware,
  asyncHandler(async (req, res) => {
    try {
      // Get today's AI interactions from database
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: interactions, error } = await databaseService.supabase
        .from('ai_interactions')
        .select('tokens_used, interaction_type')
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      // Calculate statistics
      const dailyRequests = interactions ? interactions.length : 0;
      const totalTokens = interactions ? interactions.reduce((sum, i) => sum + (i.tokens_used || 0), 0) : 0;
      
      // Get cache stats for hit rate
      const cacheStats = aiCacheService.getStats();
      // For now, use a default cache hit rate since we don't track hits/misses yet
      const cacheHitRate = 0.5; // 50% default hit rate
      
      // Estimate cost (using Gemini pricing estimates)
      const estimatedCost = (totalTokens / 1000000) * 0.075;
      
      res.json({
        dailyRequests,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        estimatedCost: Math.round(estimatedCost * 100) / 100
      });
    } catch (error) {
      console.error('Error getting usage stats:', error);
      res.status(500).json({ error: 'Failed to get usage statistics' });
    }
  })
);

module.exports = router;
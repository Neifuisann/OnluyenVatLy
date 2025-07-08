const express = require('express');
const router = express.Router();

// Import individual route modules
const achievementRoutes = require('./achievements');
const activityRoutes = require('./activity');
const leagueRoutes = require('./leagues');
const questRoutes = require('./quests');
const streakRoutes = require('./streaks');
const xpRoutes = require('./xp');

// Mount all gamification-related routes
router.use('/achievements', achievementRoutes);
router.use('/activity', activityRoutes);
router.use('/leagues', leagueRoutes);
router.use('/quests', questRoutes);
router.use('/streaks', streakRoutes);
router.use('/xp', xpRoutes);

module.exports = router;

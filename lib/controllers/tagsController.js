const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class TagsController {
    getAllTags = asyncHandler(async (req, res) => {
        const tags = await databaseService.getAllUniqueTags();
        res.json(tags);
    });

    getPopularTags = asyncHandler(async (req, res) => {
        const { limit = 10 } = req.query;
        console.log(`[TagsController] Getting popular tags with limit: ${limit}`);

        const popularTags = await databaseService.getPopularTags(parseInt(limit));

        console.log(`[TagsController] Returning ${popularTags.length} popular tags`);

        res.json({
            success: true,
            tags: popularTags,
            count: popularTags.length
        });
    });
}

module.exports = new TagsController();

const express = require('express');
const router = express.Router();
const ImageUpdateLog = require('../models/imageUpdateLog.model');

/**
 * GET /api/image-logs
 * Query params:
 *   item_code  - filter by specific item code
 *   item_id    - filter by item ObjectId
 *   destructive_only - if "true", only show destructive changes
 *   triggered_by - filter by trigger source
 *   page       - page number (default 1)
 *   limit      - results per page (default 50)
 */
router.get('/', async (req, res) => {
  try {
    const {
      item_code,
      item_id,
      destructive_only,
      triggered_by,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (item_code) filter.item_code = Number(item_code);
    if (item_id)   filter.item_id   = item_id;
    if (destructive_only === 'true') filter.is_destructive = true;
    if (triggered_by)  filter.triggered_by = triggered_by;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      ImageUpdateLog.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ImageUpdateLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (err) {
    console.error('Error fetching image logs:', err.message);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

/**
 * GET /api/image-logs/destructive
 * Quick endpoint: only show cases where images were wiped/defaulted
 */
router.get('/destructive', async (req, res) => {
  try {
    const logs = await ImageUpdateLog.find({ is_destructive: true })
      .sort({ created_at: -1 })
      .limit(200)
      .lean();
    return res.status(200).json({ total: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

/**
 * GET /api/image-logs/item/:item_code
 * Full history for a specific item
 */
router.get('/item/:item_code', async (req, res) => {
  try {
    const logs = await ImageUpdateLog.find({ item_code: Number(req.params.item_code) })
      .sort({ created_at: -1 })
      .lean();
    return res.status(200).json({ total: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;

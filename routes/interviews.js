const express = require('express');
const testUser = require('../middleware/testUser');

const router = express.Router();
const {
  createInterview,
  deleteInterview,
  getAllInterviews,
  updateInterview,
  getInterview,
  showStats,
} = require('../controllers/interviews');

router.route('/').post(testUser, createInterview).get(getAllInterviews);
router.route('/stats').get(showStats);

router
  .route('/:id')
  .get(getInterview)
  .delete(testUser, deleteInterview)
  .patch(testUser, updateInterview);

module.exports = router;

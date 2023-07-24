const Interview = require('../models/Interview');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const mongoose = require('mongoose');
const moment = require('moment');

const getAllInterviews = async (req, res) => {
  const { search, status, type, sort } = req.query;

  const queryObject = {
    createdBy: req.user.userId,
  };

  if (status && status !== 'All') {
    queryObject.status = status;
  }
  if (type && type !== 'All') {
    queryObject.type = type;
  }

  let result = Interview.find(queryObject);
  if(search){
    result = result.or([{ 'position': { $regex: search, $options: 'i' }}, { 'company': { $regex: search, $options: 'i' }}])
  }

  if (sort === 'Latest') {
    result = result.sort('-date');
  }
  if (sort === 'a-z') {
    result = result.sort('position');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  let interviews = await result;
  interviews = interviews.map(interview => {
    interview.date = moment(interview.date).format('MMM Do, YYYY');
    interview.time = moment(interview.time, 'HH:mm').format('h:mm A')
    return interview
  })

  let totalInterviews = Interview.countDocuments(queryObject);
  if(search){
    totalInterviews = totalInterviews.or([{ 'position': { $regex: search, $options: 'i' }}, { 'company': { $regex: search, $options: 'i' }}])
  }
  totalInterviews = await totalInterviews

  const numOfPages = Math.ceil(totalInterviews / limit);

  res.status(StatusCodes.OK).json({ interviews:interviews, totalInterviews: totalInterviews, numOfPages });
};

const getInterview = async (req, res) => {
  const {
    user: { userId },
    params: { id: interviewId },
  } = req;

  const interview = await Interview.findOne({
    _id: interviewId,
    createdBy: userId,
  });

  if (!interview) {
    throw new NotFoundError(`No interview with id ${interviewId}`);
  }

  res.status(StatusCodes.OK).json({ interview:interview });
};

const createInterview = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const interview = await Interview.create(req.body);
  res.status(StatusCodes.CREATED).json({ interview });
};

const updateInterview = async (req, res) => {
  const {
    user: { userId },
    params: { id: interviewId },
  } = req;

  const interview = await Interview.findByIdAndUpdate(
    { _id: interviewId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!interview) {
    throw new NotFoundError(`No interview with id ${interviewId}`);
  }

  res.status(StatusCodes.OK).json({ interview:interview });
};

const deleteInterview = async (req, res) => {
  const {
    user: { userId },
    params: { id: interviewId },
  } = req;

  const interview = await Interview.findByIdAndRemove({
    _id: interviewId,
    createdBy: userId,
  });

  if (!interview) {
    throw new NotFoundError(`No interview with id ${interviewId}`);
  }

  res.status(StatusCodes.OK).send({ interview: {}});
};

const showStats = async (req, res) => {
  let statsArray = await Interview.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  let stats = {}

  statsArray.forEach((elem) => {
    const { _id: statusType, count } = elem;
    stats[statusType] = count
  });

  const defaultStats = {
    Pending: stats.Pending || 0,
    Rejected: stats.Rejected || 0,
    Cleared: stats.Cleared || 0,
    Scheduled: stats.Scheduled || 0,
  };

  let monthlyApplications = await Interview.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: {
          year: { $year: { $dateFromString: { dateString: '$date' } } },
          month: { $month: { $dateFromString: { dateString: '$date' } } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);

  monthlyApplications = monthlyApplications.map((item) => {
      const { _id: { year, month }, count } = item;
      
      const date = moment().month(month - 1).year(year).format('MMM Y');
      return { date, count };

  }).reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

module.exports = {
  createInterview,
  deleteInterview,
  getAllInterviews,
  updateInterview,
  getInterview,
  showStats,
};

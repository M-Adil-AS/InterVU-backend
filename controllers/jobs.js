const Job = require('../models/Job');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const mongoose = require('mongoose');
const moment = require('moment');

const getAllJobs = async (req, res) => {
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

  let result = Job.find(queryObject);
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

  let jobs = await result;
  jobs = jobs.map(job => {
    job.date = moment(job.date).format('MMM Do, YYYY');
    job.time = moment(job.time, 'HH:mm').format('h:mm A')
    return job
  })

  let totalJobs = Job.countDocuments(queryObject);
  if(search){
    totalJobs = totalJobs.or([{ 'position': { $regex: search, $options: 'i' }}, { 'company': { $regex: search, $options: 'i' }}])
  }
  totalJobs = await totalJobs

  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(StatusCodes.OK).json({ interviews:jobs, totalInterviews: totalJobs, numOfPages });
};

const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  });

  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }

  res.status(StatusCodes.OK).json({ interview:job });
};

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);
  res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }

  res.status(StatusCodes.OK).json({ interview:job });
};

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  });

  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }

  res.status(StatusCodes.OK).send({ interview: {}});
};

const showStats = async (req, res) => {
  let statsArray = await Job.aggregate([
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

  let monthlyApplications = await Job.aggregate([
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
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
};

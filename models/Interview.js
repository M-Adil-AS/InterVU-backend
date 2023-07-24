const mongoose = require('mongoose');
const moment = require('moment');

const InterviewSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Please provide company'],
      maxlength: [50, 'Company name should not be more than 50 characters'],
    },
    position: {
      type: String,
      required: [true, 'Please provide position'],
      maxlength: [50, 'Position should not be more than 50 characters'],
    },
    status: {
      type: String,
      required: [true, 'Please provide status'],
      enum: {
        values: ['Scheduled', 'Pending', 'Rejected', 'Cleared'],
        message: '{VALUE} is not a valid interview status',
      }
    },
    type: {
      type: String,
      required: [true, 'Please provide interview type'],
      enum: {
        values: ['Onsite', 'Online'],
        message: '{VALUE} is not a valid interview type',
      }
    },
    date: {
      type: String,
      required: [true, 'Please provide interview date'],
      validate: {
        validator: function(v) {
          return moment.isDate(new Date(v));
        },
        message: props => `${props.value} is not a valid date`
      },
    },
    time: {
      type: String,
      required: [true, 'Please provide interview time'],
      validate: {
        validator: function(v) {
          return moment(v, "HH:mm", true).isValid();
        },
        message: props => `${props.value} is not a valid time`
      },
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  }
);

module.exports = mongoose.model('Interview', InterviewSchema);

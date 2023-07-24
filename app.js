require('dotenv').config();
require('express-async-errors');

const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors')

const express = require('express');
const cookieParser = require('cookie-parser')

const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');

const authRouter = require('./routes/auth');
const interviewsRouter = require('./routes/interviews');

const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

const app = express();
// trust proxy used by express-rate-limiter when deployed to cloud services like Heroku, Nginx etc
// app.set('trust proxy', 1);
app.use(cookieParser())
app.use(express.json());
app.use(helmet());
app.use(cors({credentials: true, origin: 'http://localhost:3000'}))
app.use(xss());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/interviews', authenticateUser, interviewsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
require('dotenv').config();
try {
  require('./utils/checkEnv').checkEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorResponse } = require('./utils/responses');
const routes = require('./routes');
const { dailyMediaSync } = require('./middleware/dailyMediaSync');
const createPageRoutes = require('./routes/pageRoutes');

const app = express();
const port = process.env.FAVMOV_PORT || 3000;

app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(dailyMediaSync);

app.use('/api', routes);

app.use('/api', (req, res) => {
  const errorMessage = `Unknown API endpoint: ${req.originalUrl}`;
  console.error('Not Found: ', errorMessage);
  return errorResponse(res, 'Not Found', 404, errorMessage);
});

const publicDir = path.join(__dirname, 'public');
app.use(createPageRoutes(publicDir));

// eslint-disable-next-line no-unused-vars -- Express requires four parameters for error middleware.
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  // Client errors such as malformed JSON explain themselves; server error text stays internal.
  const message = status < 500 && err.message ? err.message : 'Internal server error';
  return errorResponse(res, message, status, err.details ?? err.message);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port} with environment ${process.env.FAVMOV_NODE_ENV}`);
});

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error
  let error = {
    success: false,
    status: err.status || 500,
    message: err.message || 'Internal Server Error'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error = {
      success: false,
      status: 400,
      message: 'Validation Error',
      details: messages
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error = {
      success: false,
      status: 409,
      message: `${field} already exists`
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      status: 401,
      message: 'Invalid token'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      status: 401,
      message: 'Token has expired'
    };
  }

  res.status(error.status).json(error);
};

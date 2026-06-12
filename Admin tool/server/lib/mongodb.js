const mongoose = require('mongoose');

function getMongoDB() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return null;
  }
  return mongoose.connection.db;
}

module.exports = { getMongoDB };

const mongoose = require('mongoose');

function getMongoTarget() {
  const atlas = String(process.env.MONGODB_ALTAS_URL || '').trim();
  if (atlas) {
    return { uri: atlas, source: 'atlas' };
  }

  const local = String(process.env.MONGODB_URI || '').trim();
  if (local) {
    return { uri: local, source: 'local' };
  }

  throw new Error(
    'MONGODB_ALTAS_URL 또는 MONGODB_URI가 환경변수에 설정되지 않았습니다.'
  );
}

async function connectDB() {
  const { uri, source } = getMongoTarget();
  await mongoose.connect(uri);
  return { source, host: mongoose.connection.host, db: mongoose.connection.name };
}

module.exports = connectDB;
module.exports.getMongoTarget = getMongoTarget;

require('dotenv').config();

// Express 앱 (내부에서 /api/products 라우트 연결)
// - 전체 상품: GET /api/products?all=true
// - 페이지네이션: GET /api/products?page=1&limit=20 (기본 20개)
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log('상품 API: http://localhost:' + PORT + '/api/products');
    });

    await connectDB().then(({ source, host, db }) => {
      if (source === 'atlas') {
        console.log(`MongoDB Atlas 연결 성공 (${host} / ${db})`);
      } else {
        console.log(`MongoDB 로컬 연결 성공 (${host} / ${db})`);
      }
    });
  } catch (error) {
    console.error('연결 실패:', error.message);
    process.exit(1);
  }
}

startServer();

// server.js
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT = 3306
} = process.env;

let pool;

const initDB = async () => {
  try {
    // 1) MySQL 서버 연결 (DB 미지정)
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });

    // 2) DB 생성 (없으면)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    // 3) DB 지정 후 pool 생성
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 4) 테이블 생성 (없으면)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mq2 VARCHAR(255),
        mq135 VARCHAR(255),
        lm35dz VARCHAR(255),
        dm436 VARCHAR(255),
        relay VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('DB 및 테이블 준비 완료');
  } catch (err) {
    console.error('DB 초기화 실패:', err);
    process.exit(1);
  }
};

app.get('/data', async (req, res) => {
  console.log('GET /data');
  try {
    const [rows] = await pool.query(
      'SELECT mq2, mq135, lm35dz, dm436, relay, created_at FROM sensor_data ORDER BY created_at DESC LIMIT 1'
    );

    if (!rows.length) return res.json(null);

    res.json(rows[0]); // { mq2, mq135, ..., created_at }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '데이터 조회 중 오류 발생' });
  }
});

app.post('/data', async (req, res) => {
  console.log('POST /data', req.body);
  try {
    const { mq2, mq135, lm35dz, dm436, relay } = req.body;

    await pool.query(
      `INSERT INTO sensor_data (mq2, mq135, lm35dz, dm436, relay) VALUES (?, ?, ?, ?, ?)`,
      [mq2 ?? null, mq135 ?? null, lm35dz ?? null, dm436 ?? null, relay ?? null]
    );

    res.json({ message: '데이터 저장 성공' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '데이터 저장 중 오류 발생' });
  }
});

// React 앱 정적 파일 서비스
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));

const PORT = 8888;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`서버 실행 중 http://localhost:${PORT}`);
  });
});
import request from 'supertest';
import app from './server/index';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const server = app.listen(0);
  try {
    const res = await request(app).get('/api/teacher/dashboard');
    console.log('Status code:', res.statusCode);
    console.log('Response body:', res.body);
  } finally {
    server.close();
  }
}

test();

const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const dbName = 'calendar-app';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  cachedDb = db;
  return db;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { type, email, password } = JSON.parse(event.body);
    const db = await connectToDatabase();
    const users = db.collection('users');

    if (type === 'register') {
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: '이미 존재하는 이메일입니다.' })
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await users.insertOne({
        email,
        password: hashedPassword,
        createdAt: new Date()
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: '회원가입이 완료되었습니다.' })
      };
    }

    if (type === 'login') {
      const user = await users.findOne({ email });
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: '이메일 또는 비밀번호가 잘못되었습니다.' })
        };
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: '이메일 또는 비밀번호가 잘못되었습니다.' })
        };
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token, userId: user._id.toString() })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: '잘못된 요청입니다.' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: '서버 오류가 발생했습니다.' })
    };
  }
}; 
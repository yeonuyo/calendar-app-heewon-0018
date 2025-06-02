const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const client = new MongoClient(uri);

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // Token verification
  const token = event.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: '인증이 필요합니다.' }),
    };
  }

  try {
    await client.connect();
    const db = client.db('calendar-app');
    const events = db.collection('events');

    // GET - 이벤트 조회
    if (event.httpMethod === 'GET') {
      const userEvents = await events.find({ userId: decoded.userId }).toArray();
      return {
        statusCode: 200,
        body: JSON.stringify(userEvents),
      };
    }

    // POST - 이벤트 생성
    if (event.httpMethod === 'POST') {
      const eventData = JSON.parse(event.body);
      const newEvent = {
        ...eventData,
        userId: decoded.userId,
        createdAt: new Date(),
      };

      await events.insertOne(newEvent);
      return {
        statusCode: 201,
        body: JSON.stringify(newEvent),
      };
    }

    // PUT - 이벤트 수정
    if (event.httpMethod === 'PUT') {
      const { id, ...updateData } = JSON.parse(event.body);
      await events.updateOne(
        { _id: id, userId: decoded.userId },
        { $set: updateData }
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: '이벤트가 수정되었습니다.' }),
      };
    }

    // DELETE - 이벤트 삭제
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await events.deleteOne({ _id: id, userId: decoded.userId });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: '이벤트가 삭제되었습니다.' }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ message: '지원하지 않는 메소드입니다.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: '서버 오류가 발생했습니다.' }),
    };
  } finally {
    await client.close();
  }
}; 
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  // 토큰 검증
  const authHeader = event.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: '인증이 필요합니다.' })
    };
  }

  try {
    const { message } = JSON.parse(event.body);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `당신은 학생들의 과제 정보를 분석하고 일정을 관리하는 전문 도우미입니다.
            
다음 정보를 정확히 추출하여 JSON 형식으로 응답해주세요:
1. 과제 제목 (title)
2. 마감일 (deadline) - YYYY-MM-DD 형식
3. 배점 (points) - 숫자만
4. 제출 장소 (location)
5. 과제 설명 (description)
6. 중요도 (priority) - high/medium/low
7. 예상 소요 시간 (estimatedHours) - 숫자만

추가 기능:
- 마감일이 가까우면 경고 메시지를 포함해주세요
- 과제 난이도를 1-5 사이로 평가해주세요
- 성공적인 과제 수행을 위한 팁을 제공해주세요

응답 형식:
{
  "analysis": {
    "title": "과제명",
    "deadline": "YYYY-MM-DD",
    "points": 100,
    "location": "제출 장소",
    "description": "과제 설명",
    "priority": "high/medium/low",
    "estimatedHours": 5
  },
  "warnings": ["경고 메시지"],
  "difficulty": 3,
  "tips": ["팁1", "팁2"]
}`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: data.choices[0].message.content
      })
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
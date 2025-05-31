import React, { useState } from 'react';
import '../styles/Chatbot.css';

const Chatbot = ({ onSave }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [extractedInfo, setExtractedInfo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 사용자 메시지 추가
    const newMessages = [...messages, { text: inputMessage, type: 'user' }];
    setMessages(newMessages);

    // 과제 정보 추출 시도
    const extracted = extractAssignmentInfo(inputMessage);
    if (extracted.title !== '알 수 없음' || extracted.deadline !== '알 수 없음') {
      setExtractedInfo(extracted);
    }

    // 봇 응답 추가
    setTimeout(() => {
      setMessages([...newMessages, {
        text: '과제 정보를 분석했습니다. 추출된 정보를 확인해 주세요.',
        type: 'bot'
      }]);
    }, 500);

    setInputMessage('');
  };

  const handleSaveToCalendar = () => {
    if (!extractedInfo) return;

    const deadlineDate = parseDeadlineDate(extractedInfo.deadline);
    if (!deadlineDate) {
      alert('마감일 형식이 올바르지 않습니다.');
      return;
    }

    const eventData = {
      title: extractedInfo.title,
      type: 'assignment',
      date: deadlineDate,
      time: '23:59',
      endTime: '23:59',
      description: `배점: ${extractedInfo.points}\n제출장소: ${extractedInfo.location}`,
      priority: 'high',
      color: '#FF5733' // 기본 과제 색상
    };

    onSave(eventData);
    setMessages([...messages, {
      text: '일정이 캘린더에 저장되었습니다.',
      type: 'bot'
    }]);
    setExtractedInfo(null);
  };

  const handleEditAndSave = () => {
    if (!extractedInfo) return;

    const deadlineDate = parseDeadlineDate(extractedInfo.deadline);
    if (!deadlineDate) {
      alert('마감일 형식이 올바르지 않습니다.');
      return;
    }

    const eventData = {
      title: extractedInfo.title,
      type: 'assignment',
      date: deadlineDate,
      time: '23:59',
      endTime: '23:59',
      description: `배점: ${extractedInfo.points}\n제출장소: ${extractedInfo.location}`,
      priority: 'high',
      color: '#FF5733' // 기본 과제 색상
    };

    onSave(eventData);
    setMessages([...messages, {
      text: '일정이 캘린더에 저장되었습니다.',
      type: 'bot'
    }]);
    setExtractedInfo(null);
  };

  const parseDeadlineDate = (deadlineStr) => {
    if (!deadlineStr || deadlineStr === '알 수 없음') return null;

    // 다양한 날짜 형식 처리
    const patterns = [
      {
        regex: /(\d{4})[-\/년]\s*(\d{1,2})[-\/월]\s*(\d{1,2})일?/,
        handler: (matches) => new Date(matches[1], matches[2] - 1, matches[3])
      },
      {
        regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        handler: (matches) => new Date(matches[3], matches[1] - 1, matches[2])
      },
      {
        regex: /(\d{1,2})월\s*(\d{1,2})일/,
        handler: (matches) => {
          const now = new Date();
          return new Date(now.getFullYear(), matches[1] - 1, matches[2]);
        }
      }
    ];

    for (const { regex, handler } of patterns) {
      const matches = deadlineStr.match(regex);
      if (matches) {
        return handler(matches);
      }
    }

    return null;
  };

  const extractAssignmentInfo = (text) => {
    const extracted = {
      title: '알 수 없음',
      deadline: '알 수 없음',
      points: '알 수 없음',
      location: '알 수 없음'
    };

    // 제목 추출
    const titlePatterns = [
      /과제[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
      /제목[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
      /[\[<【](.+?)[\]>】]/,
      /^(.+?)(?=과제|assignment|homework)/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.title = match[1].trim();
        break;
      }
    }

    // 마감일 추출
    const deadlinePatterns = [
      /마감일?[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
      /제출일?[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
      /기한[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
      /(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)까지/i,
      /(\d{1,2}\/\d{1,2}\/?\d{0,4})/,
      /(\d{1,2}월\s*\d{1,2}일)/
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.deadline = match[1].trim();
        break;
      }
    }

    // 배점 추출
    const pointsPatterns = [
      /배점[\s]*[:：]\s*(\d+)\s*점/i,
      /점수[\s]*[:：]\s*(\d+)\s*점/i,
      /(\d+)\s*점\s*만점/i,
      /(\d+)\s*점/i
    ];

    for (const pattern of pointsPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.points = match[1] + '점';
        break;
      }
    }

    // 제출 장소 추출
    const locationPatterns = [
      /제출[\s]*[:：]\s*(.+?)(?=\n|$)/i,
      /제출처[\s]*[:：]\s*(.+?)(?=\n|$)/i,
      /제출장소[\s]*[:：]\s*(.+?)(?=\n|$)/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted.location = match[1].trim();
        break;
      }
    }

    return extracted;
  };

  return (
    <div className="chatbot">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            {message.text}
          </div>
        ))}
      </div>

      {extractedInfo && (
        <div className="extracted-info">
          <h4>추출된 정보</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>과제명:</label>
              <span>{extractedInfo.title}</span>
            </div>
            <div className="info-item">
              <label>마감일:</label>
              <span>{extractedInfo.deadline}</span>
            </div>
            <div className="info-item">
              <label>배점:</label>
              <span>{extractedInfo.points}</span>
            </div>
            <div className="info-item">
              <label>제출장소:</label>
              <span>{extractedInfo.location}</span>
            </div>
          </div>
          <div className="extracted-actions">
            <button 
              className="save-extracted-button"
              onClick={handleSaveToCalendar}
            >
              캘린더에 저장
            </button>
            <button 
              className="edit-extracted-button"
              onClick={handleEditAndSave}
            >
              수정 후 저장
            </button>
          </div>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="과제 정보를 입력하세요..."
        />
        <button type="submit">전송</button>
      </form>
    </div>
  );
};

export default Chatbot; 
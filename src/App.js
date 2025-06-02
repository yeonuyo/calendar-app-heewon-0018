import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import Chatbot from './components/Chatbot';
import { isSameDay, isToday, addDays } from 'date-fns';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' 또는 'chatbot'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'login',
          email,
          password
        })
      });

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        setShowLoginForm(false);
        setEmail('');
        setPassword('');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('로그인에 실패했습니다.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'register',
          email,
          password
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        setShowRegisterForm(false);
        setShowLoginForm(true);
        setEmail('');
        setPassword('');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('회원가입에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // 로컬 스토리지에서 이벤트 불러오기
  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        // 날짜 문자열을 Date 객체로 변환
        const eventsWithDates = parsedEvents.map(event => ({
          ...event,
          date: new Date(event.date)
        }));
        setEvents(eventsWithDates);
      } catch (error) {
        console.error('Failed to parse saved events:', error);
      }
    }
  }, []);

  // 이벤트가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }, [events]);

  // 마감일 알림 체크
  useEffect(() => {
    const checkDeadlines = () => {
      const today = new Date();
      const tomorrow = addDays(today, 1);

      events.forEach(event => {
        const eventDate = new Date(event.date);
        
        // 마감일이 오늘인 경우
        if (isToday(eventDate)) {
          alert(`[마감일 알림] 오늘이 "${event.title}" ${getEventTypeName(event.type)}의 마감일입니다!`);
        }
        // 마감일이 내일인 경우
        else if (isSameDay(eventDate, tomorrow)) {
          alert(`[마감일 알림] 내일이 "${event.title}" ${getEventTypeName(event.type)}의 마감일입니다!`);
        }
      });
    };

    // 페이지 로드 시 한 번 체크
    checkDeadlines();

    // 매일 자정에 체크
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeToMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      checkDeadlines();
      // 이후 24시간마다 체크
      const dailyInterval = setInterval(checkDeadlines, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeToMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [events]);

  const getEventTypeName = (type) => {
    switch (type) {
      case 'assignment':
        return '과제';
      case 'exam':
        return '시험';
      case 'lecture':
        return '강의';
      case 'meeting':
        return '미팅';
      case 'academic':
        return '학사일정';
      case 'personal':
        return '개인일정';
      default:
        return '일정';
    }
  };

  const addEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: eventData.id || Date.now().toString(),
      date: new Date(eventData.date)
    };

    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id ? newEvent : event
      ));
    } else {
      setEvents([...events, newEvent]);
    }
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const deleteEvent = (eventId) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      setEvents(events.filter(event => event.id !== eventId));
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>학사일정 및 과제 관리 캘린더</h1>
        <div className="auth-buttons">
          {!isLoggedIn ? (
            <>
              <button onClick={() => {
                setShowLoginForm(true);
                setShowRegisterForm(false);
              }}>로그인</button>
              <button onClick={() => {
                setShowRegisterForm(true);
                setShowLoginForm(false);
              }}>회원가입</button>
            </>
          ) : (
            <button onClick={handleLogout}>로그아웃</button>
          )}
        </div>
      </header>

      {showLoginForm && !isLoggedIn && (
        <div className="auth-form">
          <h2>로그인</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">로그인</button>
          </form>
        </div>
      )}

      {showRegisterForm && !isLoggedIn && (
        <div className="auth-form">
          <h2>회원가입</h2>
          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">회원가입</button>
          </form>
        </div>
      )}

      {isLoggedIn ? (
        <main className="app-main">
          <Calendar 
            events={events} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAddEvent={() => {
              setEditingEvent(null);
              setShowEventForm(true);
            }}
          />
          <div className="sidebar">
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                일정 목록
              </button>
              <button 
                className={`tab-button ${activeTab === 'chatbot' ? 'active' : ''}`}
                onClick={() => setActiveTab('chatbot')}
              >
                챗봇
              </button>
            </div>

            {activeTab === 'events' ? (
              <>
                <EventList 
                  events={events.filter(event => {
                    const eventDate = new Date(event.date);
                    return isSameDay(eventDate, selectedDate);
                  })}
                  onDelete={deleteEvent}
                  onEdit={editEvent}
                />
                {showEventForm && (
                  <EventForm 
                    selectedDate={selectedDate}
                    onSave={addEvent}
                    onCancel={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
                    event={editingEvent}
                  />
                )}
                {!showEventForm && (
                  <button 
                    className="add-event-button"
                    onClick={() => {
                      setEditingEvent(null);
                      setShowEventForm(true);
                    }}
                  >
                    일정 추가하기
                  </button>
                )}
              </>
            ) : (
              <Chatbot onSave={addEvent} />
            )}
          </div>
        </main>
      ) : (
        <div className="welcome-message">
          <h2>로그인하여 캘린더와 챗봇 기능을 이용해보세요!</h2>
        </div>
      )}
    </div>
  );
}

export default App;
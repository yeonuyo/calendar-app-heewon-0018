import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import Chatbot from './components/Chatbot';
import { format, isSameDay, isToday, addDays } from 'date-fns';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' 또는 'chatbot'

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
      </header>
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
    </div>
  );
}

export default App;
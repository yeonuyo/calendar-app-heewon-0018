import React from 'react';
import { format } from 'date-fns';
import '../styles/EventList.css';

const getEventTypeIcon = (type) => {
  switch (type) {
    case 'assignment':
      return '📝';
    case 'exam':
      return '📚';
    case 'lecture':
      return '🎓';
    case 'meeting':
      return '👥';
    case 'academic':
      return '🏫';
    case 'personal':
      return '🌟';
    default:
      return '📌';
  }
};

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

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'high':
      return 'priority-high';
    case 'medium':
      return 'priority-medium';
    case 'low':
      return 'priority-low';
    default:
      return '';
  }
};

const EventList = ({ events, onDelete, onEdit }) => {
  if (events.length === 0) {
    return (
      <div className="event-list empty">
        <h3>선택한 날짜의 일정</h3>
        <p className="no-events">이 날짜에 등록된 일정이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="event-list">
      <h3>선택한 날짜의 일정</h3>
      {events.map(event => (
        <div 
          key={event.id} 
          className={`event-item ${getPriorityClass(event.priority)}`}
          style={{ borderLeft: `4px solid ${event.color || '#666'}` }}
        >
          <div className="event-header">
            <span className="event-type" style={{ color: event.color }}>
              {getEventTypeIcon(event.type)} {getEventTypeName(event.type)}
              {event.tag && <span className="event-tag">{event.tag}</span>}
            </span>
            <div className="event-actions">
              <button onClick={() => onEdit(event)} className="edit-button">
                ✏️
              </button>
              <button onClick={() => onDelete(event.id)} className="delete-button">
                🗑️
              </button>
            </div>
          </div>
          <h4 className="event-title">{event.title}</h4>
          <div className="event-time">
            {format(new Date(event.date), 'yyyy년 M월 d일')} {event.time} - {event.endTime}
          </div>
          {event.description && (
            <p className="event-description">{event.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventList;
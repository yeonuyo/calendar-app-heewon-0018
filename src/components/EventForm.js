import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import '../styles/EventForm.css';

const EVENT_TYPES = [
  { id: 'assignment', label: '과제', defaultColor: '#FF5733' },
  { id: 'exam', label: '시험', defaultColor: '#C70039' },
  { id: 'lecture', label: '강의', defaultColor: '#900C3F' },
  { id: 'meeting', label: '미팅', defaultColor: '#581845' },
  { id: 'academic', label: '학사일정', defaultColor: '#2874A6' },
  { id: 'personal', label: '개인일정', defaultColor: '#229954' }
];

const EventForm = ({ selectedDate, onSave, onCancel, event }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState('assignment');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState(EVENT_TYPES[0].defaultColor);
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(format(new Date(event.date), 'yyyy-MM-dd'));
      setTime(event.time || '09:00');
      setEndTime(event.endTime || '10:00');
      setType(event.type || 'assignment');
      setPriority(event.priority || 'medium');
      setColor(event.color || EVENT_TYPES.find(t => t.id === event.type)?.defaultColor || EVENT_TYPES[0].defaultColor);
      setTag(event.tag || '');
    } else {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
      setColor(EVENT_TYPES[0].defaultColor);
    }
  }, [event, selectedDate]);

  useEffect(() => {
    // 일정 유형이 변경될 때 기본 색상으로 변경
    const selectedType = EVENT_TYPES.find(t => t.id === type);
    if (selectedType) {
      setColor(selectedType.defaultColor);
    }
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      id: event ? event.id : Date.now().toString(),
      title,
      description,
      date: new Date(`${date}T${time}`),
      time,
      endTime,
      type,
      priority,
      color,
      tag
    };
    onSave(eventData);
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h3>{event ? '일정 수정' : '새 일정 추가'}</h3>
      
      <div className="form-group">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="type">유형</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {EVENT_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">날짜</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="time">시작 시간</label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endTime">종료 시간</label>
          <input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="priority">중요도</label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="high">높음</option>
          <option value="medium">중간</option>
          <option value="low">낮음</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="color">색상</label>
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tag">태그</label>
          <input
            id="tag"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="태그 입력 (선택사항)"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />
      </div>
      
      <div className="form-buttons">
        <button type="button" className="cancel-button" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="save-button">
          저장
        </button>
      </div>
    </form>
  );
};

export default EventForm;
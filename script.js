// Global variables
let events = [];
let selectedDate = new Date();
let currentMonth = new Date();
let editingEvent = null;
let notificationSystem = null;

// Event types and their labels
const EVENT_TYPES = {
    assignment: '과제',
    exam: '시험', 
    lecture: '강의',
    meeting: '미팅',
    academic: '학사일정',
    personal: '개인일정'
};

// Event type icons
const EVENT_TYPE_ICONS = {
    assignment: '📝',
    exam: '📚',
    lecture: '🎓',
    meeting: '👥',
    academic: '🏫',
    personal: '🌟'
};

// Priority labels
const PRIORITY_LABELS = {
    high: '높음',
    medium: '중간',
    low: '낮음'
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    initEventHandlers();
    loadEvents();
    updateCalendar();
    updateEventList();
    
    // 알림 시스템 초기화
    notificationSystem = new NotificationSystem();
});

// Initialize calendar
function initCalendar() {
    updateMonthDisplay();
}

// Initialize event handlers
function initEventHandlers() {
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', prevMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
    
    // Event form
    document.getElementById('add-event-btn').addEventListener('click', showEventForm);
    document.getElementById('cancel-btn').addEventListener('click', hideEventForm);
    document.getElementById('event-form').addEventListener('submit', saveEvent);
    
    // Tab navigation
    document.getElementById('events-tab').addEventListener('click', () => switchTab('events'));
    document.getElementById('chatbot-tab').addEventListener('click', () => switchTab('chatbot'));
    
    // Chatbot
    document.getElementById('chatbot-send').addEventListener('click', analyzeChatbotInput);
    document.getElementById('chatbot-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            analyzeChatbotInput();
        }
    });
    
    // Extracted info actions
    document.getElementById('save-extracted').addEventListener('click', saveExtractedEvent);
    document.getElementById('edit-extracted').addEventListener('click', editExtractedEvent);
}

// Date utility functions
function formatDate(date) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function isSameMonth(date1, date2) {
    return date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function formatDateKorean(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// Calendar functions
function prevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCalendar();
    updateMonthDisplay();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCalendar();
    updateMonthDisplay();
}

function updateMonthDisplay() {
    const monthElement = document.getElementById('current-month');
    monthElement.textContent = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;
}

function updateCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of calendar (start of week)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Get last day of calendar (end of week)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const row = document.createElement('div');
        row.className = 'calendar-row';
        
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            // Add classes
            if (!isSameMonth(currentDate, currentMonth)) {
                cell.classList.add('disabled');
            }
            if (isSameDay(currentDate, selectedDate)) {
                cell.classList.add('selected');
            }
            
            // Check for events on this day
            const dayEvents = getDayEvents(currentDate);
            if (dayEvents.length > 0) {
                cell.classList.add('has-events');
            }
            
            // Create cell content
            const dateNumber = document.createElement('span');
            dateNumber.className = 'number';
            dateNumber.textContent = currentDate.getDate();
            cell.appendChild(dateNumber);
            
            // Add event dots
            const eventDots = document.createElement('div');
            eventDots.className = 'event-dots';
            
            for (let j = 0; j < Math.min(dayEvents.length, 3); j++) {
                const dot = document.createElement('span');
                dot.className = 'event-dot';
                eventDots.appendChild(dot);
            }
            
            if (dayEvents.length > 3) {
                const moreDot = document.createElement('span');
                moreDot.className = 'more-events';
                moreDot.textContent = `+${dayEvents.length - 3}`;
                eventDots.appendChild(moreDot);
            }
            
            cell.appendChild(eventDots);
            
            // Add click handler
            const dateToSelect = new Date(currentDate);
            cell.addEventListener('click', () => {
                selectDate(dateToSelect);
            });
            
            row.appendChild(cell);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        calendarBody.appendChild(row);
    }
}

function selectDate(date) {
    selectedDate = new Date(date);
    updateCalendar();
    updateEventList();
    hideEventForm();
}

function getDayEvents(date) {
    return events.filter(event => isSameDay(new Date(event.date), date));
}

// Event management functions
function showEventForm(event = null) {
    editingEvent = event;
    const form = document.getElementById('event-form');
    const addButton = document.getElementById('add-event-btn');
    const formTitle = document.getElementById('form-title');
    
    if (event) {
        formTitle.textContent = '일정 수정';
        populateForm(event);
    } else {
        formTitle.textContent = '새 일정 추가';
        clearForm();
        document.getElementById('date').value = formatDate(selectedDate);
    }
    
    form.classList.remove('hidden');
    addButton.classList.add('hidden');
}

function hideEventForm() {
    const form = document.getElementById('event-form');
    const addButton = document.getElementById('add-event-btn');
    
    form.classList.add('hidden');
    addButton.classList.remove('hidden');
    editingEvent = null;
    clearForm();
}

function populateForm(event) {
    document.getElementById('title').value = event.title;
    document.getElementById('type').value = event.type;
    document.getElementById('date').value = formatDate(new Date(event.date));
    document.getElementById('time').value = event.time;
    document.getElementById('end-time').value = event.endTime;
    document.getElementById('priority').value = event.priority;
    document.getElementById('description').value = event.description || '';
}

function clearForm() {
    document.getElementById('title').value = '';
    document.getElementById('type').value = 'assignment';
    document.getElementById('date').value = formatDate(selectedDate);
    document.getElementById('time').value = '09:00';
    document.getElementById('end-time').value = '10:00';
    document.getElementById('priority').value = 'medium';
    document.getElementById('description').value = '';
}

function saveEvent(e) {
    e.preventDefault();
    
    const form = document.getElementById('event-form');
    const formData = new FormData(form);
    
    const eventData = {
        id: editingEvent ? editingEvent.id : Date.now(),
        title: formData.get('title'),
        type: formData.get('type'),
        date: formData.get('date'),
        time: formData.get('time'),
        endTime: formData.get('end-time'),
        priority: formData.get('priority'),
        description: formData.get('description'),
        color: editingEvent ? editingEvent.color : null
    };
    
    // 분석 및 우선순위 계산
    const analysis = analyzeAssignment(eventData.title + ' ' + eventData.description);
    eventData.difficulty = analysis.difficulty;
    eventData.estimatedHours = analysis.estimatedHours;
    eventData.priority = calculatePriority(eventData);
    
    // 체크리스트 생성
    const checklist = generateChecklist(eventData.type);
    localStorage.setItem(`checklist-${eventData.id}`, JSON.stringify(
        checklist.map(task => ({ text: task, completed: false }))
    ));
    
    if (editingEvent) {
        const index = events.findIndex(e => e.id === editingEvent.id);
        if (index !== -1) {
            events[index] = { ...events[index], ...eventData };
        }
    } else {
        events.push(eventData);
    }
    
    saveEvents();
    updateCalendar();
    updateEventList();
    hideEventForm();
    editingEvent = null;
    
    // 알림 설정
    if (notificationSystem) {
        notificationSystem.createReminder(eventData);
    }
}

function deleteEvent(id) {
    if (confirm('이 일정을 삭제하시겠습니까?')) {
        events = events.filter(event => event.id !== id);
        saveEvents();
        updateCalendar();
        updateEventList();
    }
}

function editEvent(event) {
    showEventForm(event);
}

// Event list functions
function updateEventList() {
    const dayEvents = getDayEvents(selectedDate);
    const eventContainer = document.getElementById('event-container');
    const dateStr = formatDateKorean(selectedDate);
    
    const header = document.createElement('div');
    header.className = 'event-list-header';
    header.innerHTML = `
        <h3>${dateStr}</h3>
        <span class="event-count">${dayEvents.length}개의 과제</span>
    `;
    
    if (dayEvents.length === 0) {
        eventContainer.innerHTML = '';
        eventContainer.appendChild(header);
        const noEvents = document.createElement('p');
        noEvents.className = 'no-events';
        noEvents.textContent = '이 날짜에 등록된 일정이 없습니다.';
        eventContainer.appendChild(noEvents);
        return;
    }
    
    eventContainer.innerHTML = '';
    eventContainer.appendChild(header);
    
    dayEvents.forEach(event => {
        const eventElement = createEventElement(event);
        eventContainer.appendChild(eventElement);
    });
}

function createEventElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event-item priority-${event.priority}`;
    
    const progress = trackProgress(event);
    const status = progress.isDelayed ? 'delayed' : 'on-track';
    const statusText = progress.isDelayed ? '지연' : '정상';
    
    eventDiv.innerHTML = `
        <div class="event-status">
            <span class="status-dot status-${status}"></span>
            <span>${statusText}</span>
            <div class="event-actions">
                <button class="edit-button" onclick="editEvent(${JSON.stringify(event).replace(/"/g, '&quot;')})">
                    ✏️
                </button>
                <button class="delete-button" onclick="deleteEvent('${event.id}')">
                    🗑️
                </button>
            </div>
        </div>
        <h4 class="event-title">${event.title}</h4>
        <div class="event-meta">
            <span>${event.time} - ${event.endTime}</span>
            ${event.type === 'assignment' ? 
                `<span class="event-points">예상 소요: ${event.estimatedHours}시간</span>` : 
                ''}
        </div>
        <div class="progress-bar">
            <div class="progress" style="width: ${progress.currentProgress}%"></div>
            <div class="expected-progress" style="left: ${progress.expectedProgress}%"></div>
        </div>
    `;
    
    return eventDiv;
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');
}

// Chatbot functions
let extractedData = null;

function analyzeChatbotInput() {
    const input = document.getElementById('chatbot-input');
    const text = input.value.trim();
    
    if (!text) {
        return;
    }
    
    // Add user message to chat
    addChatMessage(text, 'user');
    
    // Clear input
    input.value = '';
    
    // Show loading
    const loadingId = addChatMessage('분석 중<span class="loading-dots"></span>', 'bot');
    
    // Simulate processing time
    setTimeout(() => {
        // Remove loading message
        document.getElementById(loadingId).remove();
        
        // Extract information
        const extracted = extractAssignmentInfo(text);
        extractedData = extracted;
        
        // Show bot response
        let response = '과제 정보를 분석했습니다!\n\n';
        response += `📝 과제명: ${extracted.title}\n`;
        response += `📅 마감일: ${extracted.deadline}\n`;
        response += `💯 배점: ${extracted.points}\n`;
        response += `📍 제출장소: ${extracted.location}\n\n`;
        response += '아래에서 정보를 확인하고 캘린더에 저장해주세요.';
        
        addChatMessage(response, 'bot');
        
        // Show extracted info panel
        displayExtractedInfo(extracted);
    }, 1500);
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now();
    messageDiv.id = messageId;
    messageDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = message.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

function extractAssignmentInfo(text) {
    const extracted = {
        title: '알 수 없음',
        deadline: '알 수 없음',
        points: '알 수 없음',
        location: '알 수 없음'
    };
    
    // Extract title - look for common patterns
    const titlePatterns = [
        /과제[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
        /제목[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
        /주제[\s]*[:：]\s*(.+?)(?=\n|마감|제출|배점|점수)/i,
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
    
    // Extract deadline - look for date patterns
    const deadlinePatterns = [
        /마감일?[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
        /제출일?[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
        /기한[\s]*[:：]\s*(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)/i,
        /(\d{4}[-\/년]\s*\d{1,2}[-\/월]\s*\d{1,2}일?)까지/i,
        /(\d{1,2}\/\d{1,2}\/?\d{0,4})/,
        /(\d{1,2}월\s*\d{1,2}일)/,
        /(\d{4}-\d{1,2}-\d{1,2})/
    ];
    
    for (const pattern of deadlinePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            extracted.deadline = match[1].trim();
            break;
        }
    }
    
    // Extract points - look for score patterns
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
    
    // Extract location - look for submission location patterns
    const locationPatterns = [
        /제출\s*장소[\s]*[:：]\s*(.+?)(?=\n|$)/i,
        /제출\s*방법[\s]*[:：]\s*(.+?)(?=\n|$)/i,
        /제출[\s]*[:：]\s*(.+?)(?=\n|$)/i,
        /장소[\s]*[:：]\s*(.+?)(?=\n|$)/i,
        /(이메일|email)[\s]*[:：]\s*([^\s]+@[^\s]+)/i,
        /(온라인|사이버|웹)/i
    ];
    
    for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            extracted.location = match[1].trim();
            break;
        } else if (match && match[2]) {
            extracted.location = match[2].trim();
            break;
        }
    }
    
    return extracted;
}

function displayExtractedInfo(extracted) {
    document.getElementById('extracted-title').textContent = extracted.title;
    document.getElementById('extracted-deadline').textContent = extracted.deadline;
    document.getElementById('extracted-points').textContent = extracted.points;
    document.getElementById('extracted-location').textContent = extracted.location;
    
    document.getElementById('extracted-info').classList.remove('hidden');
}

function saveExtractedEvent() {
    const title = document.getElementById('extracted-title').textContent;
    const deadline = document.getElementById('extracted-deadline').textContent;
    const points = document.getElementById('extracted-points').textContent;
    const location = document.getElementById('extracted-location').textContent;
    const originalText = document.getElementById('chatbot-messages').lastElementChild.previousElementSibling.querySelector('.message-content').textContent;
    
    const deadlineDate = parseDeadlineDate(deadline);
    if (!deadlineDate) {
        alert('마감일을 파싱할 수 없습니다.');
        return;
    }
    
    const eventData = {
        id: Date.now(),
        title: title,
        type: 'assignment',
        date: formatDate(deadlineDate),
        time: '23:59',
        endTime: '23:59',
        priority: 'high',
        description: `[과제 정보]\n` +
                    `배점: ${points}\n` +
                    `제출장소: ${location}\n\n` +
                    `[원본 과제 내용]\n${originalText}`,
    };
    
    events.push(eventData);
    saveEvents();
    
    // 해당 날짜의 월로 이동
    currentMonth = new Date(deadlineDate);
    selectedDate = new Date(deadlineDate);
    
    // 캘린더와 이벤트 목록 업데이트
    updateCalendar();
    updateMonthDisplay();
    
    // 일정 목록 탭으로 전환
    switchTab('events');
    updateEventList();
    
    // 추출된 정보 숨기기
    document.getElementById('extracted-info').classList.add('hidden');
    document.getElementById('chatbot-input').value = '';
}

function editExtractedEvent() {
    if (!extractedData) return;
    
    // Switch to events tab
    switchTab('events');
    
    // Create a temporary event object for editing
    let deadlineDate = parseDeadlineDate(extractedData.deadline);
    if (!deadlineDate) {
        deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 7);
    }
    
    const tempEvent = {
        id: 'temp-' + Date.now(),
        title: extractedData.title,
        type: 'assignment',
        date: deadlineDate,
        time: '23:59',
        endTime: '23:59',
        priority: 'high',
        description: `배점: ${extractedData.points}\n제출장소: ${extractedData.location}`
    };
    
    showEventForm(tempEvent);
    
    // Clear extracted info
    document.getElementById('extracted-info').classList.add('hidden');
    extractedData = null;
}

function parseDeadlineDate(deadlineStr) {
    if (!deadlineStr || deadlineStr === '알 수 없음') return null;
    
    // Try different date formats
    const patterns = [
        /(\d{4})[-\/년]\s*(\d{1,2})[-\/월]\s*(\d{1,2})일?/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})월\s*(\d{1,2})일/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/
    ];
    
    for (const pattern of patterns) {
        const match = deadlineStr.match(pattern);
        if (match) {
            let year, month, day;
            
            if (pattern.source.includes('월')) {
                // Korean format like "12월 25일"
                month = parseInt(match[1]);
                day = parseInt(match[2]);
                year = new Date().getFullYear(); // Use current year
            } else if (pattern.source.includes('년')) {
                // Korean format like "2024년 12월 25일"
                year = parseInt(match[1]);
                month = parseInt(match[2]);
                day = parseInt(match[3]);
            } else if (match[3] && match[3].length === 4) {
                // US format MM/DD/YYYY
                month = parseInt(match[1]);
                day = parseInt(match[2]);
                year = parseInt(match[3]);
            } else {
                // ISO format YYYY-MM-DD
                year = parseInt(match[1]);
                month = parseInt(match[2]);
                day = parseInt(match[3]);
            }
            
            return new Date(year, month - 1, day);
        }
    }
    
    return null;
}

// Local storage functions
function saveEvents() {
    localStorage.setItem('calendar-events', JSON.stringify(events));
}

function loadEvents() {
    const savedEvents = localStorage.getItem('calendar-events');
    if (savedEvents) {
        events = JSON.parse(savedEvents);
    }
}

// 새로운 분석 기능
function analyzeAssignment(text) {
    const keywords = {
        high: ['프로젝트', '보고서', '논문', '기말', '발표'],
        medium: ['레포트', '요약', '조사', '실습'],
        low: ['퀴즈', '연습', '간단한']
    };
    
    let difficulty = 'medium';
    let estimatedHours = 2;
    
    text = text.toLowerCase();
    
    if (keywords.high.some(word => text.includes(word))) {
        difficulty = 'high';
        estimatedHours = 5;
    } else if (keywords.low.some(word => text.includes(word))) {
        difficulty = 'low';
        estimatedHours = 1;
    }
    
    return { difficulty, estimatedHours };
}

// 작업일 계산 기능
function calculateWorkingDays(deadline) {
    const today = new Date();
    const diff = deadline - today;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    let workingDays = days;
    let currentDate = new Date(today);
    
    for (let i = 0; i < days; i++) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            workingDays--;
        }
    }
    
    return workingDays;
}

// 우선순위 계산 기능
function calculatePriority(assignment) {
    const now = new Date();
    const deadline = new Date(assignment.date);
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    // 기본 점수 계산
    let score = 0;
    
    // 마감일 가중치 (40%)
    score += (10 - Math.min(daysLeft, 10)) * 0.4;
    
    // 과제 타입 가중치 (30%)
    if (assignment.type === 'exam') score += 0.3;
    else if (assignment.type === 'assignment') score += 0.25;
    else score += 0.15;
    
    // 설명 길이 가중치 (30%)
    const descriptionLength = (assignment.description || '').length;
    score += Math.min(descriptionLength / 1000, 1) * 0.3;
    
    return score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
}

// 체크리스트 생성 기능
function generateChecklist(type) {
    const templates = {
        assignment: [
            '자료 조사 및 수집',
            '개요 작성',
            '초안 작성',
            '검토 및 수정',
            '최종 제출'
        ],
        exam: [
            '학습 계획 수립',
            '주요 내용 정리',
            '연습 문제 풀이',
            '오답 노트 작성',
            '최종 복습'
        ],
        default: [
            '계획 수립',
            '준비',
            '실행',
            '검토',
            '완료'
        ]
    };
    
    return templates[type] || templates.default;
}

// 진행 상황 추적 기능
function trackProgress(assignment) {
    const checklist = JSON.parse(localStorage.getItem(`checklist-${assignment.id}`) || '[]');
    const completedTasks = checklist.filter(task => task.completed).length;
    const totalTasks = checklist.length || 1;
    
    const progress = (completedTasks / totalTasks) * 100;
    const deadline = new Date(assignment.date);
    const totalDays = calculateWorkingDays(deadline);
    
    const expectedProgress = Math.max(0, Math.min(100, 
        (1 - (totalDays / (totalDays + 1))) * 100
    ));
    
    return {
        currentProgress: progress,
        expectedProgress,
        isDelayed: progress < expectedProgress,
        warningLevel: progress < expectedProgress - 20 ? 'high' : 'low'
    };
}

// 알림 시스템
class NotificationSystem {
    constructor() {
        this.initialized = false;
        this.setup();
    }
    
    async setup() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.initialized = permission === 'granted';
        }
    }
    
    createReminder(assignment) {
        if (!this.initialized) return;
        
        const deadline = new Date(assignment.date);
        const now = new Date();
        
        // 마감 24시간 전 알림
        if (deadline - now <= 24 * 60 * 60 * 1000) {
            new Notification('과제 마감 임박!', {
                body: `${assignment.title}이(가) 24시간 내에 마감됩니다.`,
                icon: '/favicon.ico'
            });
        }
    }
}
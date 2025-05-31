// Global variables
let events = [];
let selectedDate = new Date();
let currentMonth = new Date();
let editingEvent = null;

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
    
    const eventData = {
        id: editingEvent ? editingEvent.id : Date.now().toString(),
        title: document.getElementById('title').value,
        type: document.getElementById('type').value,
        date: new Date(document.getElementById('date').value + 'T' + document.getElementById('time').value),
        time: document.getElementById('time').value,
        endTime: document.getElementById('end-time').value,
        priority: document.getElementById('priority').value,
        description: document.getElementById('description').value
    };
    
    if (editingEvent) {
        // Update existing event
        const index = events.findIndex(e => e.id === editingEvent.id);
        if (index !== -1) {
            events[index] = eventData;
        }
    } else {
        // Add new event
        events.push(eventData);
    }
    
    saveEvents();
    updateCalendar();
    updateEventList();
    hideEventForm();
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
    
    if (dayEvents.length === 0) {
        eventContainer.innerHTML = '<p class="no-events">이 날짜에 등록된 일정이 없습니다.</p>';
        return;
    }
    
    eventContainer.innerHTML = '';
    
    dayEvents.forEach(event => {
        const eventElement = createEventElement(event);
        eventContainer.appendChild(eventElement);
    });
}

function createEventElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event-item priority-${event.priority}`;
    
    eventDiv.innerHTML = `
        <div class="event-header">
            <span class="event-type">
                ${EVENT_TYPE_ICONS[event.type] || '📌'} ${EVENT_TYPES[event.type] || '일정'}
            </span>
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
        <div class="event-time">
            ${formatDateKorean(new Date(event.date))} ${event.time} - ${event.endTime}
        </div>
        ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
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
    if (!extractedData) return;
    
    // Convert deadline to date
    let deadlineDate = parseDeadlineDate(extractedData.deadline);
    if (!deadlineDate) {
        deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 7); // Default to 1 week from now
    }
    
    const eventData = {
        id: Date.now().toString(),
        title: extractedData.title,
        type: 'assignment',
        date: deadlineDate,
        time: '23:59',
        endTime: '23:59',
        priority: 'high',
        description: `배점: ${extractedData.points}\n제출장소: ${extractedData.location}`
    };
    
    events.push(eventData);
    saveEvents();
    updateCalendar();
    updateEventList();
    
    // Clear extracted info
    document.getElementById('extracted-info').classList.add('hidden');
    extractedData = null;
    
    // Show success message
    addChatMessage('✅ 과제가 성공적으로 캘린더에 저장되었습니다!', 'bot');
    
    // Switch to events tab to show the added event
    switchTab('events');
    
    // Select the date of the added event
    selectDate(deadlineDate);
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
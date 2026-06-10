const mainContent = document.getElementById('main-content');
const STORAGE_KEY_MEMOS = 'notesri_memos';

// 状态管理
let currentView = 'mid'; 
let selectedDate = new Date(); 
let activeSelectDate = new Date(); 
let memos = JSON.parse(localStorage.getItem(STORAGE_KEY_MEMOS)) || [];
let editingMemoId = null;
let sortMode = 'priority'; // 'priority' 或 'time'

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fullMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

if(mainContent) {
    const html = `
        <div class="page active" id="page-calendar">
            <div class="calendar-tabs">
                <h2 class="calendar-main-title" id="calendarTitle"></h2>
                
                <!-- 排序切换按钮 -->
                <div class="sort-toggle" id="sortToggle" onclick="toggleSortMode()">
                    <div class="sort-slider"></div>
                    <span class="sort-label label-priority">Priority</span>
                    <span class="sort-label label-time">Time</span>
                </div>

                <div class="calendar-tabs-right">
                    <div class="tab" id="tab-long" onclick="switchPlan('long')">Year</div>
                    <div class="tab active" id="tab-mid" onclick="switchPlan('mid')">Month</div>
                    <div class="tab" id="tab-short" onclick="switchPlan('short')">Day</div>
                </div>
            </div>
            
            <div id="calendar-content-wrapper" class="calendar-content-wrapper">
                <div id="calendarDisplayArea"></div>
                
                <div class="calendar-nav" id="calendarNav">
                    <span onclick="navigate(-1)">&#10094;</span>
                    <span class="nav-title" id="navTitle" onclick="jumpToCurrent()"></span>
                    <span onclick="navigate(1)">&#10095;</span>
                </div>

                <div class="memo-list" id="memoListArea"></div>
            </div>
        </div>

        <div class="memo-modal" id="memoModal">
            <div class="memo-modal-card">
                <div class="memo-modal-header">
                    <span id="memoModalTitle">Add Memo</span>
                    <i class="fas fa-times modal-close-btn" onclick="closeMemoModal()"></i>
                </div>
                <!-- 标题 -->
                <input type="text" id="memoTitleInput" class="memo-input" placeholder="Memo Title...">
                
                <!-- 备注 -->
                <textarea id="memoRemarkInput" class="memo-input memo-remark-input" placeholder="Add a remark (optional)..."></textarea>
                
                <!-- 子项 -->
                <div class="modal-section-title">Sub-items <i class="fas fa-plus modal-add-sub-btn" onclick="addSubItemInput()"></i></div>
                <div id="subItemsContainer" class="modal-subitems-container"></div>
                
                <!-- 颜色优先级 -->
                <div class="modal-section-title">Priority Color</div>
                <div class="color-picker" id="colorPicker">
                    <div class="color-circle dot-4" onclick="selectColor(4)"></div>
                    <div class="color-circle dot-3" onclick="selectColor(3)"></div>
                    <div class="color-circle dot-2" onclick="selectColor(2)"></div>
                    <div class="color-circle dot-1 selected" onclick="selectColor(1)"></div>
                </div>

                <button class="btn-save modal-save-btn" onclick="saveMemo()">Save</button>
            </div>
        </div>
    `;
    mainContent.insertAdjacentHTML('beforeend', html);
    renderView();
}

// 切换排序模式
function toggleSortMode() {
    sortMode = sortMode === 'priority' ? 'time' : 'priority';
    const toggleBtn = document.getElementById('sortToggle');
    if(sortMode === 'time') {
        toggleBtn.classList.add('time-mode');
    } else {
        toggleBtn.classList.remove('time-mode');
    }
    renderMemoList();
}

// 触发淡入淡出动画的包裹函数
function triggerFade(callback) {
    const wrapper = document.getElementById('calendar-content-wrapper');
    if(!wrapper) return callback();
    wrapper.style.opacity = '0.8'; 
    setTimeout(() => {
        callback(); 
        wrapper.style.opacity = '1'; 
    }, 150); 
}

function switchPlan(type) {
    if(currentView === type) return;
    currentView = type;
    triggerFade(renderView);
}

function navigate(dir) {
    triggerFade(() => {
        if(currentView === 'long') {
            selectedDate.setFullYear(selectedDate.getFullYear() + dir);
        } else if(currentView === 'mid') {
            selectedDate.setMonth(selectedDate.getMonth() + dir);
            // 修复：让选中的具体日期也跟着翻月
            activeSelectDate.setMonth(activeSelectDate.getMonth() + dir); 
        } else if(currentView === 'short') {
            selectedDate.setDate(selectedDate.getDate() + (dir * 7));
            activeSelectDate.setDate(activeSelectDate.getDate() + (dir * 7));
        }
        renderView();
    });
}

function jumpToCurrent() {
    triggerFade(() => {
        selectedDate = new Date();
        activeSelectDate = new Date();
        renderView();
    });
}

function renderView() {
    document.querySelectorAll('.calendar-tabs-right .tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${currentView}`).classList.add('active');
    
    const displayArea = document.getElementById('calendarDisplayArea');
    const title = document.getElementById('calendarTitle');
    const navTitle = document.getElementById('navTitle');
    
    // 无论什么视图，左上角标题始终保持为 Month Year
    title.textContent = `${fullMonthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    
    if(currentView === 'long') {
        navTitle.textContent = selectedDate.getFullYear();
        renderYearGrid(displayArea);
    } else if(currentView === 'mid') {
        navTitle.textContent = `${fullMonthNames[selectedDate.getMonth()]}`;
        renderMonthGrid(displayArea);
    } else if(currentView === 'short') {
        navTitle.textContent = "This Week";
        renderWeekGrid(displayArea);
    }
    renderMemoList();
}

function getHighestPriorityColor(dateStr, type) {
    const dayMemos = memos.filter(m => m.dateKey === dateStr && m.type === type && !m.completed);
    if(dayMemos.length === 0) return 0;
    return Math.max(...dayMemos.map(m => m.color));
}

function getMonthKey(year, month) { return `${year}-${String(month+1).padStart(2, '0')}`; }
function getDayKey(year, month, day) { return `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }

function renderYearGrid(container) {
    container.innerHTML = `<div class="year-grid" id="yearGrid"></div>`;
    const grid = document.getElementById('yearGrid');
    const today = new Date();
    const year = selectedDate.getFullYear();
    
    for(let i=0; i<12; i++) {
        const cell = document.createElement('div');
        cell.className = 'month-cell';
        if(year === today.getFullYear() && i === today.getMonth()) cell.classList.add('current');
        if(year === activeSelectDate.getFullYear() && i === activeSelectDate.getMonth()) cell.classList.add('selected');
        
        cell.textContent = monthNames[i];
        
        const color = getHighestPriorityColor(getMonthKey(year, i), 'month');
        if(color > 0) {
            const dot = document.createElement('div');
            dot.className = `day-dot dot-${color}`;
            cell.appendChild(dot);
        }
        
        cell.onclick = () => handleCellClick(new Date(year, i, 1), 'month');
        grid.appendChild(cell);
    }
}

function renderMonthGrid(container) {
    container.innerHTML = `
        <div class="calendar-board">
            <div class="calendar-grid" id="monthGrid">
                <div class="weekday">S</div><div class="weekday">M</div><div class="weekday">T</div>
                <div class="weekday">W</div><div class="weekday">T</div><div class="weekday">F</div><div class="weekday">S</div>
            </div>
        </div>`;
    const grid = document.getElementById('monthGrid');
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        grid.appendChild(empty);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.textContent = i;
        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) cell.classList.add('today');
        if (year === activeSelectDate.getFullYear() && month === activeSelectDate.getMonth() && i === activeSelectDate.getDate()) cell.classList.add('selected');
        
        const color = getHighestPriorityColor(getDayKey(year, month, i), 'day');
        if(color > 0) {
            const dot = document.createElement('div');
            dot.className = `day-dot dot-${color}`;
            cell.appendChild(dot);
        }
        
        cell.onclick = () => handleCellClick(new Date(year, month, i), 'day');
        grid.appendChild(cell);
    }
}

function renderWeekGrid(container) {
    container.innerHTML = `
        <div class="calendar-board">
            <div class="calendar-grid" id="weekGrid">
                <div class="weekday">S</div><div class="weekday">M</div><div class="weekday">T</div>
                <div class="weekday">W</div><div class="weekday">T</div><div class="weekday">F</div><div class="weekday">S</div>
            </div>
        </div>`;
    const grid = document.getElementById('weekGrid');
    const today = new Date();
    
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    for(let i=0; i<7; i++) {
        const curr = new Date(startOfWeek);
        curr.setDate(startOfWeek.getDate() + i);
        
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.textContent = curr.getDate();
        
        if (curr.getFullYear() === today.getFullYear() && curr.getMonth() === today.getMonth() && curr.getDate() === today.getDate()) cell.classList.add('today');
        if (curr.getFullYear() === activeSelectDate.getFullYear() && curr.getMonth() === activeSelectDate.getMonth() && curr.getDate() === activeSelectDate.getDate()) cell.classList.add('selected');
        
        const color = getHighestPriorityColor(getDayKey(curr.getFullYear(), curr.getMonth(), curr.getDate()), 'day');
        if(color > 0) {
            const dot = document.createElement('div');
            dot.className = `day-dot dot-${color}`;
            cell.appendChild(dot);
        }
        
        cell.onclick = () => handleCellClick(curr, 'day');
        grid.appendChild(cell);
    }
}

function handleCellClick(date, type) {
    const isSame = (type === 'month') ? 
        (activeSelectDate.getFullYear() === date.getFullYear() && activeSelectDate.getMonth() === date.getMonth()) :
        (activeSelectDate.getFullYear() === date.getFullYear() && activeSelectDate.getMonth() === date.getMonth() && activeSelectDate.getDate() === date.getDate());
    
    activeSelectDate = date;
    selectedDate = date;

    if(isSame) {
        openMemoModal(null);
    } else {
        renderView(); 
    }
}

function renderMemoList() {
    const listArea = document.getElementById('memoListArea');
    listArea.innerHTML = '';
    
    let targetMemos = [];
    if(currentView === 'long') {
        // Year视图只展示该年份下的所有【月Memo】(Month Goal)
        targetMemos = memos.filter(m => m.type === 'month' && m.dateKey.startsWith(selectedDate.getFullYear().toString()));
    } else if(currentView === 'mid') {
        const dKey = getDayKey(activeSelectDate.getFullYear(), activeSelectDate.getMonth(), activeSelectDate.getDate());
        targetMemos = memos.filter(m => m.type === 'day' && m.dateKey === dKey);
    } else {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startKey = getDayKey(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        const endKey = getDayKey(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate());
        
        targetMemos = memos.filter(m => m.type === 'day' && m.dateKey >= startKey && m.dateKey <= endKey);
    }

    // 根据排序模式进行排序
    if (sortMode === 'priority') {
        // 优先级高到低，同优先级按时间排序
        targetMemos.sort((a, b) => b.color - a.color || a.dateKey.localeCompare(b.dateKey));
    } else {
        // 时间先后，同时间按优先级排序
        targetMemos.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || b.color - a.color);
    }

    if(targetMemos.length === 0) {
        listArea.innerHTML = `<div class="empty-memo-tip">No memos. Tap a date twice to add.</div>`;
        return;
    }

    targetMemos.forEach(memo => {
        const item = document.createElement('div');
        item.className = `memo-item ${memo.completed ? 'checked' : ''}`;
        
        let prefix = '';
        if(currentView === 'long') {
            prefix = memo.type === 'month' ? `[${memo.dateKey.split('-')[1]}月] ` : `[${memo.dateKey.substring(5)}] `;
        } else if(currentView === 'short') {
            prefix = `[${memo.dateKey.substring(5)}] `;
        }

        const hasSub = memo.subItems && memo.subItems.length > 0;
        const foldIconHtml = hasSub ? `<i class="fas fa-chevron-down fold-btn ${memo.isFolded ? 'folded' : ''}" onclick="toggleFold('${memo.id}', event)"></i>` : `<span class="fold-icon-placeholder"></span>`;
        const remarkHtml = memo.remark ? `<div class="memo-remark">${memo.remark}</div>` : '';

        const header = document.createElement('div');
        header.className = 'memo-header';
        header.innerHTML = `
            <div class="memo-title-area memo-item-title-area" onclick="toggleMemo('${memo.id}')">
                ${foldIconHtml}
                <div class="checkbox memo-item-checkbox"></div>
                <div class="memo-item-content">
                    <div class="memo-text memo-item-text">
                        <span class="dot-${memo.color} priority-dot"></span>
                        ${prefix}${memo.title}
                    </div>
                    ${remarkHtml}
                </div>
            </div>
            <div class="memo-actions">
                <i class="fas fa-pen" onclick="openMemoModal('${memo.id}')"></i>
                <i class="fas fa-trash" onclick="deleteMemo('${memo.id}')"></i>
            </div>
        `;
        item.appendChild(header);

        // 渲染子项
        if(hasSub) {
            const subWrapper = document.createElement('div');
            subWrapper.className = 'sub-items-wrapper';
            subWrapper.style.display = memo.isFolded ? 'none' : 'block';
            
            memo.subItems.forEach(sub => {
                const subEl = document.createElement('div');
                subEl.className = `sub-item ${sub.completed ? 'checked' : ''}`;
                subEl.innerHTML = `
                    <div class="checkbox"></div>
                    <div class="memo-text">${sub.text}</div>
                `;
                subEl.onclick = () => toggleSubItem(memo.id, sub.id);
                subWrapper.appendChild(subEl);
            });
            item.appendChild(subWrapper);
        }
        listArea.appendChild(item);
    });
}

function toggleFold(id, event) {
    event.stopPropagation();
    const m = memos.find(x => x.id === id);
    if(m) { 
        m.isFolded = !m.isFolded; 
        saveMemos(); 
        renderMemoList(); // 仅重渲染列表
    }
}

function toggleMemo(id) {
    const m = memos.find(x => x.id === id);
    if(m) { m.completed = !m.completed; saveMemos(); renderView(); }
}

function toggleSubItem(memoId, subId) {
    const m = memos.find(x => x.id === memoId);
    if(m) {
        const s = m.subItems.find(x => x.id === subId);
        if(s) { s.completed = !s.completed; saveMemos(); renderView(); }
    }
}

async function deleteMemo(id) {
    const isConfirmed = await AppDialog.confirm('Are you sure you want to delete this memo?', 'Delete Memo', true);
    if(isConfirmed) {
        memos = memos.filter(x => x.id !== id);
        saveMemos(); 
        renderView();
    }
}

let selectedColor = 1;

function openMemoModal(id) {
    editingMemoId = id;
    const container = document.getElementById('subItemsContainer');
    container.innerHTML = '';
    
    if(id) {
        const m = memos.find(x => x.id === id);
        document.getElementById('memoModalTitle').textContent = 'Edit Memo';
        document.getElementById('memoTitleInput').value = m.title;
        document.getElementById('memoRemarkInput').value = m.remark || '';
        selectColor(m.color);
        m.subItems.forEach(sub => addSubItemInput(sub.text));
    } else {
        document.getElementById('memoModalTitle').textContent = currentView === 'long' ? 'Add Month Goal' : 'Add Daily Memo';
        document.getElementById('memoTitleInput').value = '';
        document.getElementById('memoRemarkInput').value = '';
        selectColor(1);
    }
    document.getElementById('memoModal').classList.add('active');
}


function closeMemoModal() {
    document.getElementById('memoModal').classList.remove('active');
}

function selectColor(c) {
    selectedColor = c;
    document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.color-circle.dot-${c}`).classList.add('selected');
}

function addSubItemInput(val = '') {
    const container = document.getElementById('subItemsContainer');
    const row = document.createElement('div');
    row.className = 'sub-input-row';
    row.innerHTML = `
        <input type="text" placeholder="Sub-item task..." value="${val}">
        <i class="fas fa-times" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(row);
}

function saveMemo() {
    const title = document.getElementById('memoTitleInput').value.trim();
    if(!title) return alert("Title is required");
    
    const remark = document.getElementById('memoRemarkInput').value.trim();
    const subInputs = document.querySelectorAll('#subItemsContainer input');
    const subs = [];
    subInputs.forEach(inp => {
        if(inp.value.trim()) subs.push({ id: Date.now() + Math.random(), text: inp.value.trim(), completed: false });
    });

    const type = currentView === 'long' ? 'month' : 'day';
    const dateKey = type === 'month' ? 
        getMonthKey(activeSelectDate.getFullYear(), activeSelectDate.getMonth()) : 
        getDayKey(activeSelectDate.getFullYear(), activeSelectDate.getMonth(), activeSelectDate.getDate());

    if(editingMemoId) {
        const m = memos.find(x => x.id === editingMemoId);
        m.title = title; 
        m.remark = remark;
        m.color = selectedColor; 
        m.subItems = subs; 
    } else {
        memos.push({
            id: Date.now().toString(),
            type: type,
            dateKey: dateKey,
            title: title,
            remark: remark,
            color: selectedColor,
            completed: false,
            isFolded: false, // 默认不折叠
            subItems: subs
        });
    }
    
    saveMemos();
    closeMemoModal();
    renderView();
}

function saveMemos() {
    localStorage.setItem(STORAGE_KEY_MEMOS, JSON.stringify(memos));
}

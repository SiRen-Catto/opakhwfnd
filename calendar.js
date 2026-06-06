const mainContent = document.getElementById('main-content');
const STORAGE_KEY_MEMOS = 'notesri_memos';

// 状态管理
let currentView = 'mid'; // long (year), mid (month), short (day)
let selectedDate = new Date(); // 当前选中的基准时间
let activeSelectDate = new Date(); // 用户点击选中的具体格子时间
let memos = JSON.parse(localStorage.getItem(STORAGE_KEY_MEMOS)) || [];
let editingMemoId = null;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fullMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

if(mainContent) {
    const html = `
        <div class="page active" id="page-calendar">
            <div class="calendar-tabs">
                <h2 style="font-weight: normal; margin: 0; font-size: 24px;" id="calendarTitle"></h2>
                <div class="calendar-tabs-right">
                    <div class="tab" id="tab-long" onclick="switchPlan('long')">Year</div>
                    <div class="tab active" id="tab-mid" onclick="switchPlan('mid')">Month</div>
                    <div class="tab" id="tab-short" onclick="switchPlan('short')">Day</div>
                </div>
            </div>
            
            <div id="calendarDisplayArea"></div>
            
            <div class="calendar-nav" id="calendarNav">
                <span onclick="navigate(-1)">&#10094;</span>
                <span class="nav-title" id="navTitle" onclick="jumpToCurrent()"></span>
                <span onclick="navigate(1)">&#10095;</span>
            </div>

            <div class="memo-list" id="memoListArea"></div>
        </div>

        <!-- 添加/编辑 Memo 的弹窗 -->
        <div class="memo-modal" id="memoModal">
            <div class="memo-modal-card">
                <div class="memo-modal-header">
                    <span id="memoModalTitle">Add Memo</span>
                    <i class="fas fa-times" style="cursor:pointer; color:var(--text-dim);" onclick="closeMemoModal()"></i>
                </div>
                <input type="text" id="memoTitleInput" class="memo-input" placeholder="Memo Title...">
                
                <div style="font-size: 12px; color: var(--text-dim); margin-top: 10px;">Sub-items <i class="fas fa-plus" style="cursor:pointer; float:right;" onclick="addSubItemInput()"></i></div>
                <div id="subItemsContainer" style="display:flex; flex-direction:column; gap:8px;"></div>
                
                <div style="font-size: 12px; color: var(--text-dim); margin-top: 10px;">Priority Color</div>
                <div class="color-picker" id="colorPicker">
                    <div class="color-circle dot-4" onclick="selectColor(4)"></div>
                    <div class="color-circle dot-3" onclick="selectColor(3)"></div>
                    <div class="color-circle dot-2" onclick="selectColor(2)"></div>
                    <div class="color-circle dot-1 selected" onclick="selectColor(1)"></div>
                </div>

                <button class="btn-save" style="margin-top: 15px; border:none; cursor:pointer;" onclick="saveMemo()">Save</button>
            </div>
        </div>
    `;
    mainContent.insertAdjacentHTML('beforeend', html);
    renderView();
}

// 核心渲染逻辑
function renderView() {
    document.querySelectorAll('.calendar-tabs-right .tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${currentView}`).classList.add('active');
    
    const displayArea = document.getElementById('calendarDisplayArea');
    const title = document.getElementById('calendarTitle');
    const navTitle = document.getElementById('navTitle');
    
    if(currentView === 'long') {
        title.textContent = selectedDate.getFullYear();
        navTitle.textContent = selectedDate.getFullYear();
        renderYearGrid(displayArea);
    } else if(currentView === 'mid') {
        title.textContent = `${fullMonthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
        navTitle.textContent = `${fullMonthNames[selectedDate.getMonth()]}`;
        renderMonthGrid(displayArea);
    } else if(currentView === 'short') {
        title.textContent = `${fullMonthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
        navTitle.textContent = "This Week";
        renderWeekGrid(displayArea);
    }
    renderMemoList();
}

function switchPlan(type) {
    currentView = type;
    renderView();
}

function navigate(dir) {
    if(currentView === 'long') selectedDate.setFullYear(selectedDate.getFullYear() + dir);
    else if(currentView === 'mid') selectedDate.setMonth(selectedDate.getMonth() + dir);
    else if(currentView === 'short') selectedDate.setDate(selectedDate.getDate() + (dir * 7));
    renderView();
}

function jumpToCurrent() {
    selectedDate = new Date();
    activeSelectDate = new Date();
    renderView();
}

// 获取某一天的最高级颜色，如果没有未完成的memo则返回0
function getHighestPriorityColor(dateStr, type) {
    const dayMemos = memos.filter(m => m.dateKey === dateStr && m.type === type && !m.completed);
    if(dayMemos.length === 0) return 0;
    return Math.max(...dayMemos.map(m => m.color));
}

// 格式化日期 key
function getMonthKey(year, month) { return `${year}-${String(month+1).padStart(2, '0')}`; }
function getDayKey(year, month, day) { return `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }

// 渲染年视图
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
        
        const mKey = getMonthKey(year, i);
        const color = getHighestPriorityColor(mKey, 'month');
        if(color > 0) {
            const dot = document.createElement('div');
            dot.className = `day-dot dot-${color}`;
            cell.appendChild(dot);
        }
        
        cell.onclick = () => handleCellClick(new Date(year, i, 1), 'month');
        grid.appendChild(cell);
    }
}

// 渲染月视图
function renderMonthGrid(container) {
    container.innerHTML = `
        <div class="calendar-grid" id="monthGrid">
            <div class="weekday">S</div><div class="weekday">M</div><div class="weekday">T</div>
            <div class="weekday">W</div><div class="weekday">T</div><div class="weekday">F</div><div class="weekday">S</div>
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
        
        const dKey = getDayKey(year, month, i);
        const color = getHighestPriorityColor(dKey, 'day');
        if(color > 0) {
            const dot = document.createElement('div');
            dot.className = `day-dot dot-${color}`;
            cell.appendChild(dot);
        }
        
        cell.onclick = () => handleCellClick(new Date(year, month, i), 'day');
        grid.appendChild(cell);
    }
}

// 渲染周视图 (Day)
function renderWeekGrid(container) {
    container.innerHTML = `
        <div class="calendar-grid" id="weekGrid">
            <div class="weekday">S</div><div class="weekday">M</div><div class="weekday">T</div>
            <div class="weekday">W</div><div class="weekday">T</div><div class="weekday">F</div><div class="weekday">S</div>
        </div>`;
    const grid = document.getElementById('weekGrid');
    const today = new Date();
    
    // 找到当前选中日期所在周的周日
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
        
        const dKey = getDayKey(curr.getFullYear(), curr.getMonth(), curr.getDate());
        const color = getHighestPriorityColor(dKey, 'day');
        if(color > 0) {
            const dot = document.createElement('div');
            dot.className = `day-dot dot-${color}`;
            cell.appendChild(dot);
        }
        
        cell.onclick = () => handleCellClick(curr, 'day');
        grid.appendChild(cell);
    }
}

// 处理格子点击
function handleCellClick(date, type) {
    const isSame = (type === 'month') ? 
        (activeSelectDate.getFullYear() === date.getFullYear() && activeSelectDate.getMonth() === date.getMonth()) :
        (activeSelectDate.getFullYear() === date.getFullYear() && activeSelectDate.getMonth() === date.getMonth() && activeSelectDate.getDate() === date.getDate());
    
    activeSelectDate = date;
    selectedDate = date;

    if(isSame) {
        // 再次点击，打开添加弹窗
        openMemoModal(null);
    } else {
        renderView();
    }
}

// 渲染 Memo 列表
function renderMemoList() {
    const listArea = document.getElementById('memoListArea');
    listArea.innerHTML = '';
    
    let targetMemos = [];
    if(currentView === 'long') {
        // Year: 显示这一年所有月份的大目标
        targetMemos = memos.filter(m => m.type === 'month' && m.dateKey.startsWith(selectedDate.getFullYear().toString()));
        targetMemos.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || b.color - a.color);
    } else if(currentView === 'mid') {
         // Month: 显示选中当天的memo
        const dKey = getDayKey(activeSelectDate.getFullYear(), activeSelectDate.getMonth(), activeSelectDate.getDate());
        targetMemos = memos.filter(m => m.type === 'day' && m.dateKey === dKey);
        targetMemos.sort((a, b) => b.color - a.color);
    } else {
        // Day: 显示本周所有的memo
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startKey = getDayKey(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        const endKey = getDayKey(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate());
        
        targetMemos = memos.filter(m => m.type === 'day' && m.dateKey >= startKey && m.dateKey <= endKey);
        targetMemos.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || b.color - a.color);
    }

    if(targetMemos.length === 0) {
        listArea.innerHTML = `<div style="text-align:center; color:var(--text-dim); font-size:12px; margin-top:20px;">No memos. Tap a date twice to add.</div>`;
        return;
    }

    targetMemos.forEach(memo => {
        const item = document.createElement('div');
        item.className = `memo-item ${memo.completed ? 'checked' : ''}`;
        
        // 标题区
        const header = document.createElement('div');
        header.className = 'memo-header';
        
        // 如果是Year或Day视图，显示一下具体日期前缀
        let prefix = '';
        if(currentView === 'long') prefix = `[${memo.dateKey.split('-')[1]}月] `;
        if(currentView === 'short') prefix = `[${memo.dateKey.substring(5)}] `;

        header.innerHTML = `
            <div class="memo-title-area" onclick="toggleMemo('${memo.id}')">
                <div class="checkbox"></div>
                <div class="memo-text" style="color: var(--text-main);"><span class="dot-${memo.color}" style="display:inline-block; width:6px; height:6px; border-radius:50%; margin-right:5px;"></span>${prefix}${memo.title}</div>
            </div>
            <div class="memo-actions">
                <i class="fas fa-pen" onclick="openMemoModal('${memo.id}')"></i>
                <i class="fas fa-trash" onclick="deleteMemo('${memo.id}')"></i>
            </div>
        `;
        item.appendChild(header);

        // 子项区
        if(memo.subItems && memo.subItems.length > 0) {
            memo.subItems.forEach(sub => {
                const subEl = document.createElement('div');
                subEl.className = `sub-item ${sub.completed ? 'checked' : ''}`;
                subEl.innerHTML = `
                    <div class="checkbox"></div>
                    <div class="memo-text">${sub.text}</div>
                `;
                subEl.onclick = () => toggleSubItem(memo.id, sub.id);
                item.appendChild(subEl);
            });
        }
        listArea.appendChild(item);
    });
}

// 交互逻辑
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

function deleteMemo(id) {
    if(confirm('Delete this memo?')) {
        memos = memos.filter(x => x.id !== id);
        saveMemos(); renderView();
    }
}

// 弹窗逻辑
let selectedColor = 1;

function openMemoModal(id) {
    editingMemoId = id;
    const container = document.getElementById('subItemsContainer');
    container.innerHTML = '';
    
    if(id) {
        const m = memos.find(x => x.id === id);
        document.getElementById('memoModalTitle').textContent = 'Edit Memo';
        document.getElementById('memoTitleInput').value = m.title;
        selectColor(m.color);
        m.subItems.forEach(sub => addSubItemInput(sub.text));
    } else {
        document.getElementById('memoModalTitle').textContent = currentView === 'long' ? 'Add Month Goal' : 'Add Daily Memo';
        document.getElementById('memoTitleInput').value = '';
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
        m.title = title; m.color = selectedColor; 
        // 简单处理：覆盖子项，保留已完成状态如果文字相同
        m.subItems = subs; 
    } else {
        memos.push({
            id: Date.now().toString(),
            type: type,
            dateKey: dateKey,
            title: title,
            color: selectedColor,
            completed: false,
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

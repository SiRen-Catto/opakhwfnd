const mainContent = document.getElementById('main-content');
if(mainContent) {
    const html = `
        <div class="page active" id="page-calendar">
            <div class="calendar-tabs">
                <div class="tab" onclick="switchPlan('long')">Year</div>
                <div class="tab active" onclick="switchPlan('mid')">Month</div>
                <div class="tab" onclick="switchPlan('short')">Day</div>
            </div>
            <h2 style="font-weight: normal; margin: 0 0 15px 0; font-size: 24px;" id="monthTitle"></h2>
            <div class="calendar-grid" id="calendarGrid">
                <div class="weekday">S</div><div class="weekday">M</div><div class="weekday">T</div>
                <div class="weekday">W</div><div class="weekday">T</div><div class="weekday">F</div><div class="weekday">S</div>
            </div>
            <div style="margin-top: 30px; border-top: 1px solid var(--border); padding-top: 15px;">
                <div style="font-size: 12px; color: var(--text-dim); margin-bottom: 10px;">TODAY'S MEMO</div>
                <div style="font-size: 13px; line-height: 1.6;">
                    ▫ 完成界面框架搭建<br>▫ 确认黑白灰配色方案<br>▫ 22:00 晚间阅读
                </div>
            </div>
        </div>
    `;
    mainContent.insertAdjacentHTML('beforeend', html);
    renderCalendar();
}

function renderCalendar() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = date.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('monthTitle').textContent = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('calendarGrid');
    
    while (grid.children.length > 7) grid.removeChild(grid.lastChild);
    
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        grid.appendChild(empty);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.textContent = i;
        if (i === today) dayEl.classList.add('today');
        
        if (Math.random() > 0.7) {
            const dot = document.createElement('div');
            dot.className = 'day-dot';
            grid.appendChild(dayEl);
            dayEl.appendChild(dot);
        } else {
            grid.appendChild(dayEl);
        }
    }
}

function switchPlan(type) {
    document.querySelectorAll('#page-calendar .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    const title = document.getElementById('monthTitle');
    if(type === 'long') title.textContent = "2026 Plans";
    else if(type === 'mid') renderCalendar();
    else if(type === 'short') title.textContent = "Today's Focus";
}

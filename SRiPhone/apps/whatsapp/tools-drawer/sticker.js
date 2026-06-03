// sticker.js - 表情包功能模块

// 表情包数据存储结构
let stickerData = {
    groups: [
        {
            id: 'default',
            name: 'Stickers',
            stickers: []
        }
    ]
};

let currentGroupId = 'default';

// 注入样式
function injectStickerStyles() {
    if (document.getElementById('sticker-styles')) return;
    
    const css = `
        /* 隐藏滚动条 */
        .sticker-modal-content::-webkit-scrollbar {
            display: none;
        }
        .sticker-modal-content {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
        }
        .sticker-group-tabs::-webkit-scrollbar {
            display: none;
        }
        .sticker-group-tabs {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        
        /* 描述文本样式 */
        .sticker-desc {
            font-size: 0.7rem;
            color: var(--text-dim);
            text-align: center;
            margin-top: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
        }
        
        /* 调整每个表情包项的高度以容纳描述 */
        .sticker-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: auto;
            aspect-ratio: auto; /* 覆盖原有的 aspect-ratio: 1 */
        }
        
        .sticker-img-container {
            width: 100%;
            aspect-ratio: 1;
            position: relative;
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* 调整标题栏 */
        .sticker-modal-header {
            justify-content: space-between; /* 两端对齐 */
            padding: 10px 15px;
            border-bottom: 2px solid var(--border);
            display: flex;
            align-items: center;
        }
        
        /* 分组标题栏样式 */
        .sticker-header-tabs {
            display: flex; 
            gap: 15px; 
            overflow-x: auto; 
            scrollbar-width: none; 
            -ms-overflow-style: none;
            flex: 1;
            margin-right: 15px;
            white-space: nowrap;
        }
        .sticker-header-tabs::-webkit-scrollbar { display: none; }
        
        .sticker-header-tab {
            font-size: 0.95rem;
            font-weight: bold;
            color: var(--text-dim);
            cursor: pointer;
            transition: color 0.2s;
            position: relative;
            padding-bottom: 5px;
        }
        .sticker-header-tab.active {
            color: var(--text-main);
        }
        .sticker-header-tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--accent);
        }
        
        /* 自定义添加分组弹窗样式 */
        .custom-prompt-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 11000;
            display: flex; justify-content: center; align-items: center;
            opacity: 0; pointer-events: none; transition: opacity 0.2s;
            backdrop-filter: blur(3px);
        }
        .custom-prompt-overlay.active { opacity: 1; pointer-events: all; }
        .custom-prompt-box {
            width: 80%; max-width: 320px;
            background: var(--item-bg);
            border: 2px solid var(--border); border-radius: 12px;
            padding: 20px; 
            display: flex; flex-direction: column; gap: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            transform: scale(0.9); transition: transform 0.2s;
        }
        .custom-prompt-overlay.active .custom-prompt-box { transform: scale(1); }
        .custom-prompt-title { font-weight: bold; font-size: 1.1rem; color: var(--text-main); text-align: center; }
        .custom-prompt-input {
            padding: 10px; border: 1px solid var(--border);
            background: var(--bg-color); color: var(--text-main);
            border-radius: 6px; font-size: 1rem; outline: none;
        }
        .custom-prompt-input:focus { border-color: var(--accent); }
        .custom-prompt-actions { display: flex; gap: 10px; }
        .custom-prompt-btn {
            flex: 1; padding: 8px; border: none; border-radius: 6px;
            font-weight: bold; cursor: pointer; font-size: 0.9rem;
        }
        .custom-prompt-btn.confirm { background: var(--accent); color: var(--bg-color); }
        .custom-prompt-btn.cancel { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
    `;
    
    const style = document.createElement('style');
    style.id = 'sticker-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

// 加载表情包数据
function loadStickerData() {
    const data = localStorage.getItem('sticker_data');
    if (data) {
        stickerData = JSON.parse(data);
    }
    injectStickerStyles();
    injectCustomPrompt();
}

// 注入自定义弹窗HTML
function injectCustomPrompt() {
    if (document.getElementById('add-group-modal')) return;
    
    const html = `
        <div class="custom-prompt-overlay" id="add-group-modal">
            <div class="custom-prompt-box">
                <div class="custom-prompt-title">新建分组</div>
                <input type="text" class="custom-prompt-input" id="new-group-name" placeholder="分组名称">
                <div class="custom-prompt-actions">
                    <button class="custom-prompt-btn cancel" onclick="closeAddGroupModal()">取消</button>
                    <button class="custom-prompt-btn confirm" onclick="confirmAddGroup()">确定</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// 保存表情包数据
function saveStickerData() {
    localStorage.setItem('sticker_data', JSON.stringify(stickerData));
}

// 切换分组
function switchStickerGroup(groupId) {
    currentGroupId = groupId;
    
    const modal = document.getElementById('sticker-modal');
    if (modal) {
        // 更新内容
        const currentGroup = stickerData.groups.find(g => g.id === currentGroupId);
        
        // 更新顶部Tabs状态
        const tabs = modal.querySelectorAll('.sticker-header-tab');
        tabs.forEach(btn => {
            if (btn.getAttribute('onclick').includes(groupId)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新Grid
        const grid = modal.querySelector('.sticker-grid');
        grid.innerHTML = currentGroup.stickers.map(sticker => 
            `<div class="sticker-item" data-sticker-id="${sticker.id}">
                <div class="sticker-img-container">
                    <img src="${sticker.url}" alt="${sticker.description}" 
                         class="sticker-img" 
                         onclick="sendSticker('${sticker.id}')">
                    <div class="sticker-actions">
                        <button class="sticker-delete-btn" 
                                onclick="deleteSticker('${sticker.id}', event)">
                            ×
                        </button>
                    </div>
                </div>
                <div class="sticker-desc">${sticker.description}</div>
            </div>`
        ).join('');
    } else {
        openStickerModal();
    }
}

// 打开表情包弹窗
function openStickerModal() {
    injectStickerStyles();
    injectCustomPrompt();
    
    // 先检查是否已存在弹窗
    if (document.getElementById('sticker-modal')) {
        const modal = document.getElementById('sticker-modal');
        modal.classList.remove('active');
        modal.remove();
    }
    
    // 确保当前分组存在
    if (!stickerData.groups.find(g => g.id === currentGroupId)) {
        if (stickerData.groups.length > 0) {
            currentGroupId = stickerData.groups[0].id;
        } else {
            stickerData.groups.push({
                id: 'default',
                name: 'Stickers',
                stickers: []
            });
            currentGroupId = 'default';
        }
    }

    const currentGroup = stickerData.groups.find(g => g.id === currentGroupId);

    // 创建弹窗HTML结构
    // 注意：将分组标签移到了 header 中
    const modalHTML = `
        <div class="sticker-modal-overlay" id="sticker-modal" style="z-index: 10001;">
            <div class="sticker-modal" style="z-index: 10002;">
                <div class="sticker-modal-header">
                    <!-- 分组标题栏 -->
                    <div class="sticker-header-tabs">
                        ${stickerData.groups.map(group => 
                            `<div class="sticker-header-tab ${group.id === currentGroupId ? 'active' : ''}" 
                                  onclick="switchStickerGroup('${group.id}')">
                                ${group.name}
                            </div>`
                        ).join('')}
                        <div class="sticker-header-tab" onclick="openAddGroupModal()" style="font-size: 1.2rem; line-height: 1;">+</div>
                    </div>
                    <button class="sticker-close-btn" onclick="closeStickerModal()">×</button>
                </div>
                <div class="sticker-modal-content">
                    <!-- 移除了原本的 sticker-group-tabs -->
                    
                    <!-- 表情包展示区 -->
                    <div class="sticker-grid">
                        ${currentGroup.stickers.map(sticker => 
                            `<div class="sticker-item" data-sticker-id="${sticker.id}">
                                <div class="sticker-img-container">
                                    <img src="${sticker.url}" alt="${sticker.description}" 
                                         class="sticker-img" 
                                         onclick="sendSticker('${sticker.id}')">
                                    <div class="sticker-actions">
                                        <button class="sticker-delete-btn" 
                                                onclick="deleteSticker('${sticker.id}', event)">
                                            ×
                                        </button>
                                    </div>
                                </div>
                                <div class="sticker-desc">${sticker.description}</div>
                            </div>`
                        ).join('')}
                    </div>
                    
                    <!-- 添加表情包区域 -->
                    <div class="sticker-add-section">
                        <textarea id="sticker-input" 
                                  placeholder="粘贴表情包链接，每行一个链接，格式：描述:链接"
                                  class="sticker-input"></textarea>
                        <button class="sticker-add-btn" onclick="addStickers()">添加</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 强制重排并添加 active 类以触发动画
    const modal = document.getElementById('sticker-modal');
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    
    // 关闭其他工具
    if (typeof closeTools === 'function') {
        closeTools();
    }
}

// 关闭表情包弹窗
function closeStickerModal() {
    const modal = document.getElementById('sticker-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 200); // 等待过渡动画
    }
    if (typeof closeTools === 'function') {
        closeTools();
    }
}

// 添加表情包
function addStickers() {
    const input = document.getElementById('sticker-input').value.trim();
    if (!input) return;
    
    const lines = input.split('\n');
    const newStickers = [];
    
    lines.forEach(line => {
        let description = '表情包';
        let url = line.trim();
        
        const colonIndex = line.indexOf(':');
        
        if (colonIndex > -1) {
            const part1 = line.substring(0, colonIndex).trim().toLowerCase();
            if (part1 === 'http' || part1 === 'https') {
                url = line.trim();
            } else {
                description = line.substring(0, colonIndex).trim();
                url = line.substring(colonIndex + 1).trim();
            }
        }
        
        if (url.length > 5) {
            newStickers.push({
                id: Date.now() + Math.random(),
                url: url,
                description: description
            });
        }
    });
    
    if (newStickers.length > 0) {
        const group = stickerData.groups.find(g => g.id === currentGroupId);
        if (group) {
            group.stickers.push(...newStickers);
            saveStickerData();
            // 刷新当前视图
            switchStickerGroup(currentGroupId);
        }
    }
}

// 发送表情包
function sendSticker(stickerId) {
    let sticker = null;
    for (const group of stickerData.groups) {
        sticker = group.stickers.find(s => s.id == stickerId);
        if (sticker) break;
    }

    if (sticker) {
        // 发送带描述的格式：[STICKER: url, description]
        const stickerText = `[STICKER: ${sticker.url}, ${sticker.description}]`;
        const msgInput = document.getElementById('msg-input');
        if (msgInput) {
            msgInput.value = stickerText;
            closeStickerModal();
            if (typeof pushUserMessage === 'function') {
                pushUserMessage();
            }
        }
    }
}

// 删除表情包
function deleteSticker(stickerId, event) {
    event.stopPropagation();
    const group = stickerData.groups.find(g => g.id === currentGroupId);
    if (group) {
        group.stickers = group.stickers.filter(s => s.id != stickerId);
        saveStickerData();
        // 刷新视图
        switchStickerGroup(currentGroupId);
    }
}

// 打开添加分组弹窗
function openAddGroupModal() {
    const modal = document.getElementById('add-group-modal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('new-group-name');
        if (input) {
            input.value = '';
            input.focus();
        }
    } else {
        injectCustomPrompt();
        document.getElementById('add-group-modal').classList.add('active');
    }
}

// 关闭添加分组弹窗
function closeAddGroupModal() {
    const modal = document.getElementById('add-group-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 确认添加分组
function confirmAddGroup() {
    const input = document.getElementById('new-group-name');
    const groupName = input.value.trim();
    if (groupName) {
        const newGroup = {
            id: Date.now() + Math.random() + '_grp',
            name: groupName,
            stickers: []
        };
        stickerData.groups.push(newGroup);
        saveStickerData();
        closeAddGroupModal();
        // 重新打开整个表情包弹窗以刷新顶部标签栏
        openStickerModal(); 
        // 切换到新分组
        setTimeout(() => switchStickerGroup(newGroup.id), 50);
    }
}

// 初始化
loadStickerData();

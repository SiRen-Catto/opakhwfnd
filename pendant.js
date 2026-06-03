// others/pendant.js

(function() {
    // 1. 注入挂坠和作者牌子的 CSS (包含从 index.html 提取的样式)
    const style = document.createElement('style');
    style.textContent = `
        /* 挂坠样式 */
        .heart-pendant { 
            position: absolute; 
            top: -15px; 
            right: 15px; 
            z-index: 10001; /* 最高层级，确保在教程之上 */
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            transform-origin: top center; 
            animation: swing 3s infinite ease-in-out; 
            cursor: pointer; 
            transition: transform 0.3s; 
            -webkit-text-stroke: 1px #434343; /* 1像素黑色描边 */
        }
        .heart-pendant:hover { 
            animation-play-state: paused; 
            transform: scale(1.1); 
        }
        .pendant-string { 
            width: 2px; 
            height: 40px; 
            background-color: #444; 
            box-shadow: 1px 1px 2px rgba(0,0,0,0.3); 
        }
        .heart-icon { 
            font-size: 2.5rem; 
            color: #000; 
            text-shadow: 0 0 2px rgba(255,255,255,0.2); 
            margin-top: -8px; 
        }
        @keyframes swing { 
            0% { transform: rotate(5deg); } 
            50% { transform: rotate(-5deg); } 
            100% { transform: rotate(5deg); } 
        }

        /* 作者牌子样式 (下拉效果) */
        .author-card {
            position: absolute;
            top: 0;
            right: 70px; /* 在挂坠左侧一点 */
            width: 180px;
            background: var(--bg);
            border: 2px solid var(--border);
            border-top: none;
            border-radius: 0 0 10px 10px;
            padding: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            z-index: 9998; /* 在挂坠之下，但在屏幕之上 */
            transform: translateY(-150%); /* 默认隐藏在上方 */
            transition: transform 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: var(--text-dim);
        }

        .author-card.show {
            transform: translateY(0);
        }

        .author-info {
            display: flex;
            flex-direction: column;
        }
        
        .author-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .author-role {
            font-size: 13px;
            color: var(--text-dim);
        }

        .star-btn {
            color: #c9c9c9ff;
            font-size: 16px;
            cursor: pointer;
            padding: 5px;
            transition: transform 0.2s;
            -webkit-text-stroke: 1px #5d5d5d; /* 1像素黑色描边 */
        }
        
        .star-btn:hover {
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(style);

    // 2. 创建 HTML 结构
    function createPendant() {
        const phoneContainer = document.querySelector('#app-frame');
        if (!phoneContainer) return;

        // 创建作者牌子
        const card = document.createElement('div');
        card.className = 'author-card';
        card.id = 'authorCard';
        card.innerHTML = `
            <div class="author-info">
                <span class="author-name">WindowSR</span>
                <span class="author-role">Created by SiRen</span>
            </div>
            <i class="fas fa-star star-btn" id="tutorialBtn" title="打开教程"></i>
        `;
        
        // 创建挂坠
        const pendant = document.createElement('div');
        pendant.className = 'heart-pendant';
        pendant.id = 'heartPendant';
        pendant.innerHTML = `
            <div class="pendant-string"></div>
            <i class="fas fa-heart heart-icon"></i>
        `;

        // 插入到容器中
        phoneContainer.appendChild(card);
        phoneContainer.appendChild(pendant);

        // 3. 绑定事件逻辑
        const tutorialBtn = document.getElementById('tutorialBtn');
        
        // 点击星星：打开教程
        tutorialBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.SRTutorial) {
                window.SRTutorial.show();
                card.classList.remove('show');
            } 
        });

        // 点击爱心挂坠
        pendant.addEventListener('click', () => {
            // 场景A：如果教程是打开的，点击爱心则关闭教程（退回桌面）
            if (window.SRTutorial && window.SRTutorial.isOpen()) {
                window.SRTutorial.hide();
                return;
            }

            // 场景B：教程没打开，则切换作者牌子的显示/隐藏
            card.classList.toggle('show');
        });

        // 点击屏幕其他地方收起牌子 (可选体验优化)
        document.addEventListener('click', (e) => {
            if (!pendant.contains(e.target) && !card.contains(e.target)) {
                card.classList.remove('show');
            }
        });
    }

    window.addEventListener('DOMContentLoaded', createPendant);
})();

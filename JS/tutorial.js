(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* 教程全屏遮罩 - 极简纯黑底色 */
        .tutorial-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background-color: #000000;
            color: #cccccc;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .tutorial-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* 顶部固定标题栏 */
        .tutorial-header {
            flex-shrink: 0;
            padding: 20px 20px 15px 20px;
            text-align: center;
            background: rgba(0, 0, 0, 0.9);
            border-bottom: 1px solid #111111;
            position: relative;
            z-index: 10;
        }
        .tutorial-header h2 {
            margin: 0; font-size: 18px; font-weight: 500; color: #eeeeee; letter-spacing: 1px;
        }
        .tutorial-header p {
            margin: 6px 0 0 0; font-size: 12px; color: #555555;
        }

        /* 顶部阅读进度条 */
        .progress-container {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: transparent;
        }
        .progress-bar {
            height: 100%; width: 0%; background: #555555; transition: width 0.1s;
        }

        /* 滚动内容区 */
        .tutorial-body {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
            scroll-behavior: smooth;
        }
        .tutorial-body::-webkit-scrollbar { width: 0px; }

        /* --- 目录样式 --- */
        .toc-container {
            background: #050505;
            border: 1px solid #111111;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }
        .toc-title {
            font-size: 12px; color: #666; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;
        }
        .toc-list {
            display: flex; flex-direction: column; gap: 6px;
        }
        
        /* 一级目录 */
        .toc-item {
            text-decoration: none; color: #999; font-size: 14px; padding: 8px 12px;
            background: #0a0a0a; border-radius: 4px; transition: all 0.2s;
            display: flex; justify-content: space-between; align-items: center;
        }
        .toc-item::after { content: "→"; font-size: 12px; opacity: 0.3; }
        .toc-item:hover { color: #fff; background: #151515; }

        /* 二级子目录 (小标题) */
        .toc-sub-list {
            display: flex; flex-direction: column; gap: 4px; margin-top: 2px; margin-bottom: 6px;
        }
        .toc-sub-item {
            text-decoration: none; color: #666666; font-size: 13px; 
            padding: 6px 12px 6px 24px; /* 左侧缩进 */
            border-radius: 4px; transition: all 0.2s;
            position: relative;
        }
        .toc-sub-item::before {
            content: ""; position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
            width: 3px; height: 3px; background: #444; border-radius: 50%; /* 前面加个极简小圆点 */
        }
        .toc-sub-item:hover { color: #aaaaaa; background: #0a0a0a; }

        /* --- 正文排版样式 --- */
        .tutorial-section {
            margin-bottom: 45px;
        }
        /* 大标题 */
        .tutorial-section h3 {
            color: #eeeeee; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 8px;
            border-bottom: 1px solid #151515;
        }
        /* 小标题 */
        .tutorial-section h4 {
            color: #dddddd; font-size: 14px; font-weight: 500; 
            margin: 24px 0 12px 0; display: flex; align-items: center;
        }
        .tutorial-section h4::before {
            content: ""; display: inline-block; width: 3px; height: 12px; 
            background: #444; margin-right: 8px; border-radius: 2px; /* 极简竖线 */
        }
        
        .tutorial-section p {
            font-size: 14px; line-height: 1.7; color: #a0a0a0; margin-bottom: 12px;
        }
        
        /* 强调块 (Callout) */
        .tutorial-callout {
            background: #080808; border-left: 3px solid #333;
            padding: 12px 15px; margin: 15px 0; border-radius: 0 4px 4px 0;
            font-size: 13px; color: #888; line-height: 1.6;
        }

        /* 返回顶部按钮 */
        .back-to-top {
            position: absolute; bottom: 25px; right: 20px;
            width: 36px; height: 36px; border-radius: 50%;
            background: #0a0a0a; border: 1px solid #222; color: #888;
            font-size: 16px; display: flex; justify-content: center; align-items: center;
            cursor: pointer; opacity: 0; transform: translateY(10px); pointer-events: none;
            transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            z-index: 20;
        }
        .back-to-top.visible {
            opacity: 1; transform: translateY(0); pointer-events: auto;
        }
        .back-to-top:hover { background: #151515; color: #fff; }
    `;
    document.head.appendChild(style);

    function createTutorialInterface() {
        const appFrame = document.querySelector('#app-frame');
        if (!appFrame) return;

        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.id = 'tutorialOverlay';
        
        overlay.innerHTML = `
            <div class="tutorial-header">
                <h2>NoteSRi</h2>
                <p>再次点击右上角 🖤 返回</p>
                <div class="progress-container"><div class="progress-bar" id="tutorialProgress"></div></div>
            </div>

            <div class="tutorial-body" id="tutorialBody">
                
                <!-- 目录区 -->
                <div class="toc-container">
                    <div class="toc-title">目录 Table of Contents</div>
                    <div class="toc-list">
                        <a href="#sec-intro" class="toc-item">1. 简介</a>
                        
                        <a href="#sec-basic" class="toc-item">2. 底栏各功能</a>
                        <!-- 二级子目录 -->
                        <div class="toc-sub-list">
                            <a href="#sub-gesture" class="toc-sub-item">日历</a>
                            <a href="#sub-shortcut" class="toc-sub-item">用户</a>
                        </div>

                        <a href="#sec-memo" class="toc-item">3. iPhone</a>
                    </div>
                </div>

                <!-- 正文板块区 -->
                <section id="sec-intro" class="tutorial-section">
                    <h3>1. 简介</h3>
                    <p>欢迎使用 NoteSRi。</p>
                    <div class="tutorial-callout">
                        💡 提示：你可以随时点击右上角的爱心挂坠来打开或关闭这篇教程。
                    </div>
                </section>

                <section id="sec-basic" class="tutorial-section">
                    <h3>2. 底栏各功能</h3>
                    <p></p>
                    
                    <!-- 小标题 1 -->
                    <h4 id="sub-gesture">日历</h4>
                    <p></p>


                    <!-- 小标题 2 -->
                    <h4 id="sub-shortcut">用户</h4>
                    <p></p>
                    <br><br><br> <!-- 占位 -->
                </section>

                <section id="sec-memo" class="tutorial-section">
                    <h3>3. iPhone</h3>
                    <p></p>
                    <br><br><br><br><br><br><br><br> <!-- 占位 -->
                </section>
                
                <p style="text-align:center; color:#444; font-size:12px; margin-top: 40px; padding-bottom: 40px;">
                    Designed by SiRen
                </p>
            </div>

            <!-- 返回顶部按钮 -->
            <div class="back-to-top" id="backToTopBtn">↑</div>
        `;

        appFrame.appendChild(overlay);

        // --- 交互逻辑绑定 ---
        const tutorialBody = overlay.querySelector('#tutorialBody');
        const progressBar = overlay.querySelector('#tutorialProgress');
        const backToTopBtn = overlay.querySelector('#backToTopBtn');
        const tocLinks = overlay.querySelectorAll('.toc-item, .toc-sub-item'); // 同时选中一级和二级目录

        // 1. 监听滚动：更新进度条 & 显示/隐藏返回顶部按钮
        tutorialBody.addEventListener('scroll', () => {
            const scrollTop = tutorialBody.scrollTop;
            const scrollHeight = tutorialBody.scrollHeight - tutorialBody.clientHeight;
            const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = scrollPercent + '%';

            if (scrollTop > 200) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // 2. 点击返回顶部
        backToTopBtn.addEventListener('click', () => {
            tutorialBody.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // 3. 点击目录平滑跳转
        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    window.addEventListener('DOMContentLoaded', createTutorialInterface);
    
    window.SRTutorial = {
        show: function() {
            const overlay = document.getElementById('tutorialOverlay');
            if (overlay) overlay.classList.add('active');
        },
        hide: function() {
            const overlay = document.getElementById('tutorialOverlay');
            if (overlay) overlay.classList.remove('active');
        },
        isOpen: function() {
            const overlay = document.getElementById('tutorialOverlay');
            return overlay && overlay.classList.contains('active');
        }
    };
})();

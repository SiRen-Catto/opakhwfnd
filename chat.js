const mainContentChat = document.getElementById('main-content');
if(mainContentChat) {
    const html = `
        <div class="page" id="page-chat">
            <div class="chat-container">
                <div class="chat-bubble received">
                    Hey, 这里的UI设计非常冷淡。<br>Everything is black and white.
                    <div class="chat-time">10:23 AM</div>
                </div>
                <div class="chat-bubble sent">
                    是的，这就是我们要的效果。<br>极致简约，专注于内容。
                    <div class="chat-time">10:25 AM</div>
                </div>
                <div class="chat-bubble received">
                    记得把夜间模式做成默认的。
                    <div class="chat-time">10:40 AM</div>
                </div>
            </div>
        </div>
    `;
    mainContentChat.insertAdjacentHTML('beforeend', html);
}

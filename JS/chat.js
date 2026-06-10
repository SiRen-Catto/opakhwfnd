const mainContentChat = document.getElementById('main-content');
if(mainContentChat) {
    const html = `
        <div class="page" id="page-chat">
            <div class="chat-container">
                <div class="chat-bubble received">
                    why u do this to me?
                    <div class="chat-time">10:23 AM</div>
                </div>
                <div class="chat-bubble sent">
                    wha
                    <div class="chat-time">14:25 AM</div>
                </div>
                <div class="chat-bubble received">
                    ?
                    <div class="chat-time">14:40 AM</div>
                </div>
                <div class="chat-bubble received">
                    what the fuck u mean wha??
                    <div class="chat-time">14:40 AM</div>
                </div>
            </div>
        </div>
    `;
    mainContentChat.insertAdjacentHTML('beforeend', html);
}

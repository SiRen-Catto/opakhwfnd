const mainContentMore = document.getElementById('main-content');
if(mainContentMore) {
    const html = `
        <div class="page" id="page-more">
            <div class="text-center">
                <p>Settings & More</p>
                <div style="border:1px solid var(--border); padding: 10px; margin: 20px auto; width: 60%; font-size: 12px;">
                    Data Export<br><br>
                    Theme Settings<br><br>
                    About
                </div>
            </div>
        </div>
    `;
    mainContentMore.insertAdjacentHTML('beforeend', html);
}

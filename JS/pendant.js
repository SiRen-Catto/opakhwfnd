(function() {
    const style = document.createElement('style');
    style.textContent = `
        .heart-pendant { 
            position: absolute; 
            top: -15px; 
            right: 15px; 
            z-index: 10001; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            transform-origin: top center; 
            animation: swing 3s infinite ease-in-out; 
            cursor: pointer; 
            transition: transform 0.3s; 
            -webkit-text-stroke: 1px #434343;
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
    `;
    document.head.appendChild(style);

    function createPendant() {
        const phoneContainer = document.querySelector('#app-frame');
        if (!phoneContainer) return;
        const pendant = document.createElement('div');
        pendant.className = 'heart-pendant';
        pendant.id = 'heartPendant';
        pendant.innerHTML = `
            <div class="pendant-string"></div>
            <i class="fas fa-heart heart-icon"></i>
        `;
        phoneContainer.appendChild(pendant);
        pendant.addEventListener('click', () => {
            if (window.SRTutorial) {
                if (window.SRTutorial.isOpen()) {
                    window.SRTutorial.hide();
                } else {
                    window.SRTutorial.show();
                }
            }
        });
    }
    window.addEventListener('DOMContentLoaded', createPendant);
})();

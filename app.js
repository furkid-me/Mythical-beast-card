// 神獸卡牌資料庫
const tarotCards = [
    { id: 0, name: '吉祥如意', image: '吉祥如意的主張.webp', meaning: '萬事如意、心想事成。神獸為你帶來吉祥的祝福，一切順遂圓滿。' },
    { id: 1, name: '大富翁', image: '大富翁的主張.webp', meaning: '財富滿盈、富貴榮華。神獸賜予你累積財富的力量，前途一片光明。' },
    { id: 2, name: '守護', image: '守護的主張.webp', meaning: '護佑平安、趨吉避凶。神獸化身守護者，為你抵擋一切災厄。' },
    { id: 3, name: '幸福快樂', image: '幸福快樂的主張.webp', meaning: '歡樂滿溢、幸福洋溢。神獸帶來滿滿的歡笑與溫馨。' },
    { id: 4, name: '幸福', image: '幸福的主張.webp', meaning: '美滿幸福、知足常樂。神獸祝福你擁有平凡卻珍貴的幸福。' },
    { id: 5, name: '幸運', image: '幸運的主張.webp', meaning: '好運連連、福星高照。神獸為你帶來意想不到的好運氣。' },
    { id: 6, name: '快樂', image: '快樂的主張.webp', meaning: '開心愉悅、笑口常開。神獸傳遞純粹的快樂能量給你。' },
    { id: 7, name: '恆財', image: '恆財的主張.webp', meaning: '財源不絕、穩定增長。神獸賜予你持續穩定的財運。' },
    { id: 8, name: '救世者', image: '救世者的主張.webp', meaning: '濟世救人、大愛無疆。神獸賦予你幫助他人的使命與力量。' },
    { id: 9, name: '救貧', image: '救貧的主張.webp', meaning: '扶危濟困、善心善行。神獸指引你行善積德，福報自來。' },
    { id: 10, name: '暗財', image: '暗財的主張.webp', meaning: '意外之財、隱藏收穫。神獸暗中帶來不為人知的財富機遇。' },
    { id: 11, name: '有錢人', image: '有錢人的主張.webp', meaning: '腰纏萬貫、富甲一方。神獸助你邁向富裕的人生道路。' },
    { id: 12, name: '疑難雜症', image: '疑難雜症的主張.webp', meaning: '逢凶化吉、迎刃而解。神獸賜予你解決困難的智慧與勇氣。' },
    { id: 13, name: '發財', image: '發財的主張.webp', meaning: '財運亨通、大發利市。神獸帶來強大的招財能量。' },
    { id: 14, name: '觀測', image: '觀測的主張.webp', meaning: '洞察先機、明察秋毫。神獸賦予你看透事物本質的能力。' },
    { id: 15, name: '貴夫人', image: '貴夫人的主張.webp', meaning: '貴人相助、優雅高貴。神獸帶來貴人運，助你提升格局。' },
    { id: 16, name: '金錢', image: '金錢的主張.webp', meaning: '財源廣進、金銀滿屋。神獸為你開啟金錢的大門。' },
    { id: 17, name: '領袖', image: '領袖的主張.webp', meaning: '領導才能、眾望所歸。神獸賜予你領袖的氣質與能力。' }
];

// 應用狀態
let camera = null;
let hands = null;
let isReady = false;
let selectedCardIndex = null;
let isDrawing = false;
let isCardDrawn = false;
let cardElements = [];

// 搖晃檢測
let shakeHistory = [];
const SHAKE_THRESHOLD = 0.15;
const SHAKE_TIME_WINDOW = 800;

// DOM 元素
const startBtn = document.getElementById('startBtn');
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const gestureStatus = document.getElementById('gestureStatus');
const carouselTrack = document.getElementById('carouselTrack');
const infoPanel = document.getElementById('infoPanel');
const cardName = document.getElementById('cardName');
const cardNameEn = document.getElementById('cardNameEn');
const cardMeaning = document.getElementById('cardMeaning');
const tutorialOverlay = document.getElementById('tutorialOverlay');
const tutorialBtn = document.getElementById('tutorialBtn');

// 生成所有塔羅牌 - 一字排開
function generateCards() {
    tarotCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'tarot-card';
        cardElement.dataset.index = index;

        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        const backImg = document.createElement('img');
        backImg.src = 'PIC/back.webp';
        backImg.alt = '卡牌背面';
        cardBack.appendChild(backImg);

        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        const img = document.createElement('img');
        img.src = getCardImage(card.id);
        img.alt = card.name;
        cardFront.appendChild(img);

        cardElement.appendChild(cardBack);
        cardElement.appendChild(cardFront);
        carouselTrack.appendChild(cardElement);

        // 點擊事件 - 備用抽牌方式
        cardElement.addEventListener('click', () => {
            if (isCardDrawn || isDrawing) return;
            selectedCardIndex = index;
            updateSelectedCard();
            drawCard();
        });

        cardElements.push(cardElement);
    });
}

// 手部位置追蹤
let handXHistory = [];
const HAND_HISTORY_SIZE = 5;
let lastSelectTime = 0;
const SELECT_COOLDOWN = 200; // 選擇冷卻時間 200ms

// 檢查卡片是否可選（未被抽走）
function isCardAvailable(index) {
    return cardElements[index] && cardElements[index].style.display !== 'none';
}

// 根據手部位置選擇卡片（使用位置映射）
function selectCardByHandPosition(handX, handY) {
    if (isCardDrawn || isDrawing) return;

    // 翻轉 X 坐標（因為攝影機是鏡像的）
    const flippedX = 1 - handX;

    // 記錄手部位置歷史（平滑處理）
    handXHistory.push(flippedX);
    if (handXHistory.length > HAND_HISTORY_SIZE) {
        handXHistory.shift();
    }

    // 計算平均位置
    const avgX = handXHistory.reduce((a, b) => a + b, 0) / handXHistory.length;

    // 取得可用卡片列表
    const availableCards = [];
    cardElements.forEach((card, index) => {
        if (isCardAvailable(index)) {
            availableCards.push(index);
        }
    });

    if (availableCards.length === 0) return;

    // 將手部 X 位置映射到卡片索引（0.1 ~ 0.9 範圍）
    const normalizedX = Math.max(0, Math.min(1, (avgX - 0.1) / 0.8));
    const targetIndex = Math.floor(normalizedX * availableCards.length);
    const clampedIndex = Math.max(0, Math.min(availableCards.length - 1, targetIndex));
    const newSelectedIndex = availableCards[clampedIndex];

    // 檢查是否需要更新選擇
    const currentTime = Date.now();
    if (newSelectedIndex !== selectedCardIndex && currentTime - lastSelectTime >= SELECT_COOLDOWN) {
        selectedCardIndex = newSelectedIndex;
        updateSelectedCard();
        scrollToSelectedCard();
        lastSelectTime = currentTime;
    }
}

// 滾動到選中的卡片
function scrollToSelectedCard() {
    if (selectedCardIndex === null) return;
    const card = cardElements[selectedCardIndex];
    const carousel = document.getElementById('tarotCarousel');

    card.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
    });
}

// 更新選中的卡片
function updateSelectedCard() {
    cardElements.forEach((card, index) => {
        if (index === selectedCardIndex) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    // 更新提示文字
    if (selectedCardIndex !== null) {
        updateGestureStatus('✊', `已選第 ${selectedCardIndex + 1} 張，握拳召喚`);
    }
}

// 教學覆蓋層
tutorialBtn.addEventListener('click', () => {
    tutorialOverlay.classList.add('hidden');
    initializeCamera();
});

startBtn.addEventListener('click', () => {
    tutorialOverlay.classList.add('hidden');
    initializeCamera();
});

async function initializeCamera() {
    try {
        startBtn.disabled = true;
        startBtn.textContent = '⏳ 初始化中...';

        // 初始化 MediaPipe Hands
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.3, // 降低門檻，提高偵測靈敏度
            minTrackingConfidence: 0.3
        });

        hands.onResults(onResults);

        // 啟動攝影機
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        webcamElement.srcObject = stream;

        await new Promise((resolve) => {
            webcamElement.onloadedmetadata = () => {
                resolve();
            };
        });

        camera = new Camera(webcamElement, {
            onFrame: async () => {
                await hands.send({ image: webcamElement });
            },
            width: 1280,
            height: 720
        });

        await camera.start();

        isReady = true;
        startBtn.textContent = '✅ 運行中';
        startBtn.style.display = 'none';
        gestureStatus.classList.add('active');
        updateGestureStatus('👋', '移動手掌選擇神獸');

    } catch (error) {
        console.error('初始化失敗:', error);
        startBtn.disabled = false;
        startBtn.textContent = '❌ 啟動失敗，請重試';
        alert('無法存取攝影機。請確保已授予權限。');
    }
}

function onResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        updateGestureStatus('🖐️', '請伸出手掌');
        return;
    }

    const landmarks = results.multiHandLandmarks[0];

    // 使用手掌中心（landmark 9）來選擇卡片
    const handX = landmarks[9].x;
    const handY = landmarks[9].y;

    selectCardByHandPosition(handX, handY);

    // 偵測手勢
    const gesture = detectGesture(landmarks);
    handleGesture(gesture, landmarks);
}

let gestureStartTime = 0;
let lastGesture = 'none';

function detectGesture(landmarks) {
    // 檢測 OK 手勢（拇指和食指指尖靠近，其他手指伸展）
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const thumbIndexDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    // OK 手勢：拇指食指靠近，且中指伸展
    const middleExtended = isFingerExtended(landmarks, 12, 10);
    if (thumbIndexDist < 0.06 && middleExtended) {
        return 'ok';
    }

    // 檢測各手指是否伸展
    const fingers = {
        index: isFingerExtended(landmarks, 8, 6),
        middle: isFingerExtended(landmarks, 12, 10),
        ring: isFingerExtended(landmarks, 16, 14),
        pinky: isFingerExtended(landmarks, 20, 18)
    };

    const extendedCount = Object.values(fingers).filter(v => v).length;

    // 握拳：所有四指都彎曲（不含拇指）
    if (extendedCount <= 1) {
        return 'fist';
    }
    // 張開手掌：至少3指伸展
    else if (extendedCount >= 3) {
        return 'open';
    }

    return 'none';
}

function isFingerExtended(landmarks, tipIdx, mcpIdx) {
    const tip = landmarks[tipIdx];
    const mcp = landmarks[mcpIdx];
    const wrist = landmarks[0];

    // 計算指尖到手腕的距離
    const tipToWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    // 計算指根到手腕的距離
    const mcpToWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

    // 如果指尖比指根離手腕更遠，表示手指伸展
    return tipToWrist > mcpToWrist * 1.15;
}

function detectShakeGesture(handX) {
    const SHAKE_THRESHOLD = 0.05; // X軸移動的閾值
    const SHAKE_DURATION = 10; // 記錄最近10個X位置

    shakeHistory.push(handX);
    if (shakeHistory.length > SHAKE_DURATION) {
        shakeHistory.shift();
    }

    if (shakeHistory.length < SHAKE_DURATION) {
        return false;
    }

    const minX = Math.min(...shakeHistory);
    const maxX = Math.max(...shakeHistory);

    return (maxX - minX) > SHAKE_THRESHOLD;
}

let fistDetectedTime = 0;
let okDetectedTime = 0;
const FIST_HOLD_TIME = 400; // 握拳需要保持 400ms
const OK_HOLD_TIME = 300; // OK手勢需要保持 300ms

function handleGesture(gesture, landmarks) {
    const currentTime = Date.now();

    // 卡片已抽出時，檢測 OK 手勢關閉卡片
    if (isCardDrawn) {
        if (gesture === 'ok') {
            if (okDetectedTime === 0) {
                okDetectedTime = currentTime;
                updateGestureStatus('👌', '保持OK手勢...', true);
            } else if (currentTime - okDetectedTime >= OK_HOLD_TIME) {
                updateGestureStatus('👌', '收起神獸！', true);
                collectCard();
                okDetectedTime = 0;
            }
        } else {
            okDetectedTime = 0;
            updateGestureStatus('👌', 'OK手勢收起神獸');
        }
        return;
    }

    // 張開手掌 - 選擇模式
    if (gesture === 'open') {
        fistDetectedTime = 0;
        if (selectedCardIndex !== null) {
            updateGestureStatus('👋', '握拳召喚選中的神獸');
        } else {
            updateGestureStatus('👋', '左右滑動選擇神獸');
        }
    }
    // 握拳 - 抽牌
    else if (gesture === 'fist' && !isDrawing && selectedCardIndex !== null) {
        if (fistDetectedTime === 0) {
            fistDetectedTime = currentTime;
            updateGestureStatus('✊', '保持握拳...', true);
        } else if (currentTime - fistDetectedTime >= FIST_HOLD_TIME) {
            updateGestureStatus('✊', '召喚！', true);
            drawCard();
            fistDetectedTime = 0;
        }
    } else {
        fistDetectedTime = 0;
    }
}

function updateGestureStatus(icon, text, detecting = false) {
    const iconElement = gestureStatus.querySelector('.gesture-icon');
    const textElement = gestureStatus.querySelector('.gesture-text');

    if (iconElement) iconElement.textContent = icon;
    if (textElement) textElement.textContent = text;

    if (detecting) {
        gestureStatus.classList.add('detecting');
    } else {
        gestureStatus.classList.remove('detecting');
    }
}

function drawCard() {
    if (isDrawing || selectedCardIndex === null || isCardDrawn) return;

    isDrawing = true;
    isCardDrawn = true;

    const cardElement = cardElements[selectedCardIndex];

    // 移除選中樣式，直接顯示抽出的卡片
    cardElement.classList.remove('selected');
    cardElement.classList.add('drawn');

    // 移除 carousel 的 overflow 限制
    const carousel = document.getElementById('tarotCarousel');
    carousel.classList.add('card-drawn');

    updateGestureStatus('👌', 'OK手勢收起神獸');

    isDrawing = false;
}

// 收集卡片到右下角
function collectCard() {
    if (!isCardDrawn || selectedCardIndex === null) return;

    const cardElement = cardElements[selectedCardIndex];
    const selectedCard = tarotCards[selectedCardIndex];

    // 隱藏資訊面板
    infoPanel.classList.remove('visible');

    // 創建收集的卡片縮圖
    const collectedCards = document.getElementById('collectedCards');
    const collectedCard = document.createElement('div');
    collectedCard.className = 'collected-card';
    collectedCard.title = selectedCard.name;

    const img = document.createElement('img');
    img.src = getCardImage(selectedCard.id);
    img.alt = selectedCard.name;
    collectedCard.appendChild(img);

    // 點擊收集的卡片可以再次查看圖片
    collectedCard.addEventListener('click', (e) => {
        e.stopPropagation();
        showCardPreview(selectedCard);
    });

    collectedCards.appendChild(collectedCard);

    // 移除原卡片
    cardElement.classList.remove('drawn');
    cardElement.style.display = 'none';

    // 恢復 carousel 的 overflow
    const carousel = document.getElementById('tarotCarousel');
    carousel.classList.remove('card-drawn');

    // 重置狀態
    selectedCardIndex = null;
    isCardDrawn = false;

    updateGestureStatus('👋', '選擇下一位神獸');
}

// 關閉卡片函數（點擊關閉，也會收集）
function slideAwayCard() {
    collectCard();
}

// 顯示卡牌預覽
function showCardPreview(card) {
    // 創建預覽遮罩
    const overlay = document.createElement('div');
    overlay.className = 'card-preview-overlay';

    // 創建卡牌容器
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-preview';

    // 創建卡牌圖片
    const img = document.createElement('img');
    img.src = getCardImage(card.id);
    img.alt = card.name;

    cardContainer.appendChild(img);
    overlay.appendChild(cardContainer);
    document.body.appendChild(overlay);

    // 動畫顯示
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    // 點擊關閉預覽
    overlay.addEventListener('click', () => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    });
}

function getCardImage(cardId) {
    const card = tarotCards.find(c => c.id === cardId);
    return card ? `PIC/${card.image}` : 'PIC/back.webp';
}

// 初始化
generateCards();

// 點擊任意位置關閉卡片
document.addEventListener('click', (e) => {
    if (isCardDrawn && !e.target.closest('.tarot-card:not(.drawn)')) {
        slideAwayCard();
    }
});

console.log('%c🐉 神獸卡牌已載入', 'font-size: 20px; color: #B464FF; font-weight: bold;');
console.log('%c左右滑動選牌，握拳抽牌，或直接點擊卡片', 'font-size: 14px; color: #FF64E8;');

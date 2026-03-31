// --- GLOBAL AUDIO (Synth) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
    osc.stop(audioCtx.currentTime + 0.3);
}

const tones = {
    "green": 261.63, "red": 329.63, "yellow": 392.00, "blue": 493.88,
    "correct": 600, "wrong": 150
};

// --- NAVIGATION STATE ---
let activeGameMode = ''; // 'number', 'color', 'symbol'

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showMenu() {
    showScreen('menu-screen');
    document.body.style.backgroundColor = '#011F3F'; // Reset BG
}

function triggerGameOver(score) {
    document.getElementById('final-score-display').innerText = score;
    
    // Visual feedback
    document.body.classList.add("game-over-bg");
    playTone(tones.wrong, 'sawtooth');

    setTimeout(() => {
        document.body.classList.remove("game-over-bg");
        showScreen('game-over-screen');
    }, 200);
}

function restartCurrentGame() {
    if (activeGameMode === 'color') initColorGame();
    else if (activeGameMode === 'number') initNumberGame();
    else if (activeGameMode === 'symbol') initSymbolGame();
}

// ==========================================
//  GAME 1: COLOR MEMORY
// ==========================================
const buttonColors = ["red", "blue", "green", "yellow"];
let gamePattern = [];
let userClickedPattern = [];
let level = 0;
let colorGameStarted = false;

function initColorGame() {
    activeGameMode = 'color';
    level = 0;
    gamePattern = [];
    colorGameStarted = true;
    showScreen('color-screen');
    nextColorSequence();
}

document.querySelectorAll(".btn-color").forEach(btn => {
    btn.addEventListener("click", function() {
        if(!colorGameStarted) return; // Prevent clicking when not in color mode

        let userChosenColour = this.id;
        userClickedPattern.push(userChosenColour);

        animatePress(userChosenColour);
        playTone(tones[userChosenColour], 'sine');
        checkColorAnswer(userClickedPattern.length - 1);
    });
});

function checkColorAnswer(currentLevel) {
    if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
        if (userClickedPattern.length === gamePattern.length) {
            setTimeout(function () {
                nextColorSequence();
            }, 1000);
        }
    } else {
        colorGameStarted = false;
        triggerGameOver(level > 0 ? level - 1 : 0);
    }
}

function nextColorSequence() {
    userClickedPattern = [];
    level++;
    document.getElementById("color-title").textContent = "Level " + level;
    
    let randomNumber = Math.floor(Math.random() * 4);
    let randomChosenColour = buttonColors[randomNumber];
    gamePattern.push(randomChosenColour);

    setTimeout(() => {
        let btn = document.getElementById(randomChosenColour);
        btn.style.opacity = 0;
        playTone(tones[randomChosenColour], 'sine');
        setTimeout(() => {
            btn.style.opacity = 1;
        }, 100);
    }, 500);
}

function animatePress(currentColor) {
    let activeBtn = document.getElementById(currentColor);
    activeBtn.classList.add("pressed");
    setTimeout(function() {
        activeBtn.classList.remove("pressed");
    }, 100);
}

// ==========================================
//  GAME 2 & 3: NUMBERS & SYMBOLS
// ==========================================
let logicScore = 0;
let logicCorrectAnswer = 0; 
let activeSequenceType = ''; 

// --- MENU & NAVIGATION ---

function showMenu() {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Show menu
    document.getElementById('menu-screen').classList.add('active');
    // Reset background color in case it was stuck on red/green
    document.body.style.backgroundColor = '#011F3F';
}

function restartCurrentGame() {
    if (activeGameMode === 'number') {
        initNumberGame();
    } else if (activeGameMode === 'color') {
        initColorGame(); 
    } else if (activeGameMode === 'symbol') {
        initSymbolGame(); 
    }
}

// Sets up the UI for any logic game (Number or Symbol)
function setupLogicUI(modeTitle) {
    // Switch Screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('logic-screen').classList.add('active');
    
    // Reset Score & Title
    logicScore = 0;
    document.getElementById('logic-score').innerText = logicScore;
    document.getElementById('logic-mode-title').innerText = modeTitle;
    
    // Reset Feedback
    const feedback = document.getElementById('logic-feedback');
    feedback.innerText = '';
    feedback.style.color = '#ecf0f1';
    
    document.body.style.backgroundColor = '#011F3F'; // Reset BG
}

// Renders the cards on the screen
function renderLogicSequence(sequenceArray) {
    const container = document.getElementById('sequence-display');
    container.innerHTML = ''; // Clear old cards

    sequenceArray.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('item-card');
        card.innerText = item;
        container.appendChild(card);
    });
}

// Handles a correct answer (updates score, flashes green, next round)
function handleLogicCorrect(nextRoundCallback) {
    logicScore++;
    document.getElementById('logic-score').innerText = logicScore;
    
    // Visual Feedback (Green Flash)
    document.getElementById('logic-feedback').innerText = "Correct!";
    document.getElementById('logic-feedback').style.color = '#2ECC71';
    document.body.style.backgroundColor = '#2ECC71';
    
    setTimeout(() => {
        document.body.style.backgroundColor = '#011F3F'; // Reset BG
        document.getElementById('logic-feedback').innerText = "";
        nextRoundCallback(); // Generate next question
    }, 800);
}

// Handles a wrong answer (Game Over)
function handleLogicWrong() {
    // Flash Red
    document.body.classList.add('game-over-bg');
    
    setTimeout(() => {
        document.body.classList.remove('game-over-bg');
        
        // Switch to Game Over Screen
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-over-screen').classList.add('active');
        
        // Display Final Score
        document.getElementById('final-score-display').innerText = logicScore;
    }, 1000);
}

// --- NUMBER GAME LOGIC ---

function initNumberGame() {
    activeGameMode = 'number';
    setupLogicUI('Number Sequence');
    
    // Show Number Input, Hide Symbol Options
    document.getElementById('number-input-area').style.display = 'flex';
    document.getElementById('options-input-area').style.display = 'none';
    
    generateNumberRound();
}

function generateNumberRound() {
    document.getElementById('num-guess').value = '';
    document.getElementById('logic-feedback').innerText = ''; 
    document.getElementById('logic-feedback').style.color = '#ecf0f1';
    document.getElementById('num-guess').focus(); // Auto-focus input
    
    // 1. Determine available types based on score
    let availableTypes = ['arithmetic', 'geometric']; 
    
    if (logicScore > 4)  availableTypes.push('fibonacci', 'square');
    if (logicScore > 8) availableTypes.push('cube', 'triangular');
    if (logicScore > 12) availableTypes.push('fibonacci', 'square', 'cube', 'arithmetic', 'triangular', 'geometric');

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    activeSequenceType = type; 

    let seq = [];
    let start = Math.floor(Math.random() * 10) + 1;
    let step = Math.floor(Math.random() * 5) + 2;

    switch (type) {
        case 'arithmetic':
            start = Math.floor(Math.random() * 20) + 1; 
            for(let i=0; i<4; i++) seq.push(start + (i * step));
            logicCorrectAnswer = seq[seq.length-1] + step;
            break;

        case 'geometric':
            start = Math.floor(Math.random() * 5) + 1; 
            step = Math.floor(Math.random() * 2) + 2; 
            for(let i=0; i<4; i++) seq.push(start * Math.pow(step, i));
            logicCorrectAnswer = seq[seq.length-1] * step;
            break;

        case 'fibonacci':
            let n1 = Math.floor(Math.random() * 5) + 1;
            let n2 = Math.floor(Math.random() * 5) + 1;
            seq = [n1, n2];
            for(let i=0; i<3; i++) seq.push(seq[seq.length-1] + seq[seq.length-2]);
            if(seq.length > 4) seq.shift(); 
            logicCorrectAnswer = seq[seq.length-1] + seq[seq.length-2];
            break;

        case 'square':
            start = Math.floor(Math.random() * 5) + 2; 
            for(let i=0; i<4; i++) seq.push(Math.pow(start + i, 2));
            logicCorrectAnswer = Math.pow(start + 4, 2);
            break;

        case 'cube':
            start = Math.floor(Math.random() * 3) + 1; 
            for(let i=0; i<4; i++) seq.push(Math.pow(start + i, 3));
            logicCorrectAnswer = Math.pow(start + 4, 3);
            break;
            
        case 'triangular':
            start = Math.floor(Math.random() * 3) + 1; 
            for(let i=0; i<4; i++) {
                let n = start + i;
                seq.push((n * (n + 1)) / 2);
            }
            let nextTri = start + 4;
            logicCorrectAnswer = (nextTri * (nextTri + 1)) / 2;
            break;
    }

    renderLogicSequence(seq);
}

// Returns a text hint based on the active type
function getHintText() {
    switch(activeSequenceType) {
        case 'arithmetic': return "Hint: Constant difference (adding same number)";
        case 'geometric':  return "Hint: Constant ratio (multiplying by same number)";
        case 'fibonacci':  return "Hint: Sum of the previous two numbers";
        case 'square':     return "Hint: Sequence of Perfect Squares (n²)";
        case 'cube':       return "Hint: Sequence of Perfect Cubes (n³)";
        case 'triangular': return "Hint: Triangular numbers (Add 1, then 2, then 3...)";
        default:           return "Hint: Try to find the pattern";
    }
}

function checkNumber() {
    const val = parseInt(document.getElementById('num-guess').value);
    
    if (isNaN(val)) return;

    if (val === logicCorrectAnswer) {
        handleLogicCorrect(generateNumberRound);
    } else {
        const feedbackEl = document.getElementById('logic-feedback');
        feedbackEl.innerText = getHintText();
        feedbackEl.style.color = '#e74c3c'; // Warning Color
        
        handleLogicWrong();
    }
}

// Allow Enter key to submit
document.getElementById('num-guess').addEventListener("keypress", function(event) {
    if (event.key === "Enter") checkNumber();
});

// --- SYMBOL GAME ---
const symbolSets = [
    ['🌑', '🌒', '🌓', '🌔', '🌕'],
    ['🕐', '🕑', '🕒', '🕓', '🕔'],
    ['⬆️', '↗️', '➡️', '↘️', '⬇️'],
    ['🌱', '🌿', '🌳', '🍂', '💀'],
    ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
];

function initSymbolGame() {
    activeGameMode = 'symbol';
    setupLogicUI('Symbol Puzzle');
    document.getElementById('number-input-area').style.display = 'none';
    document.getElementById('options-input-area').style.display = 'flex';
    generateSymbolRound();
}

function generateSymbolRound() {
    document.getElementById('logic-feedback').innerText = '';
    
    const set = symbolSets[Math.floor(Math.random() * symbolSets.length)];
    const startIdx = Math.floor(Math.random() * (set.length - 3));
    let seq = set.slice(startIdx, startIdx + 3);
    logicCorrectAnswer = set[startIdx + 3];

    renderLogicSequence(seq);

    // Generate options
    let options = [logicCorrectAnswer];
    while(options.length < 4) {
        let rand = set[Math.floor(Math.random() * set.length)];
        if(!options.includes(rand)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);

    const optContainer = document.getElementById('options-input-area');
    optContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            if(opt === logicCorrectAnswer) handleLogicCorrect(generateSymbolRound);
            else handleLogicWrong();
        };
        optContainer.appendChild(btn);
    });
}

// --- LOGIC HELPERS ---
function renderLogicSequence(arr) {
    const display = document.getElementById('sequence-display');
    display.innerHTML = '';
    arr.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerText = item;
        display.appendChild(div);
    });
    const qBox = document.createElement('div');
    qBox.className = 'item-card';
    qBox.innerText = '?';
    qBox.style.backgroundColor = '#011F3F';
    qBox.style.border = '2px dashed #85C1E9';
    qBox.style.color = '#85C1E9';
    display.appendChild(qBox);
}

function handleLogicCorrect(nextFunc) {
    logicScore += 10;
    document.getElementById('logic-score').innerText = logicScore;
    const fb = document.getElementById('logic-feedback');
    fb.innerText = "Correct!";
    fb.className = "feedback correct-text";
    playTone(tones.correct, 'sine');
    
    setTimeout(nextFunc, 800);
}

function handleLogicWrong() {
    triggerGameOver(logicScore);
}

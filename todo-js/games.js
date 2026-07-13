const typingWords = [
  'mathematics','physics','chemistry','biology','history','geography','literature','language','science','university',
  'student','teacher','classroom','homework','examination','textbook','lecture','knowledge','learning','education',
  'recipe','kitchen','cooking','baking','ingredient','boiling','frying','grilling','seasoning','flavor','spoon',
  'knife','stove','oven','restaurant','chef','delicious','nutrition','breakfast','dinner','happiness','family',
  'friendship','love','dreams','adventure','travel','journey','exercise','health','success','motivation','inspiration',
  'kindness','patience','wisdom','courage','strength','growth','balance','company','business','marketing','sales',
  'profit','customer','product','service','quality','strategy','investment','manager','employee','contract','agreement',
  'meeting','presentation','deadline','budget','football','basketball','tennis','swimming','running','athlete',
  'championship','victory','training','coach','fitness','endurance','competition','teamwork','effort','achievement',
  'passion','computer','software','hardware','internet','website','email','password','security','database','network',
  'application','technology','digital','electronic','server','algorithm','programming','code','development','innovation',
  'forest','mountain','ocean','river','desert','weather','climate','sunrise','sunset','season','animal','plant',
  'flower','tree','garden','wind','rain','snow','storm','nature','movie','music','song','dance','art','painting',
  'drawing','theater','concert','festival','entertainment','comedy','drama','action','adventure',
];

let typingGameActive = false;
let typingGameScore = 0;
let typingGameTime = 60;
let typingGameStartTime = 60;
let typingGameCorrect = 0;
let typingGameTotal = 0;
let typingGameInterval = null;
let tapGameActive = false;
let tapGameScore = 0;
let tapGameTime = 15;
let tapGameInterval = null;

function renderNextWord() {
  const word = typingWords[Math.floor(Math.random() * typingWords.length)];
  getById('currentWord').textContent = word;
  let upcoming = '';
  for (let i = 0; i < 3; i += 1) {
    upcoming += `${typingWords[Math.floor(Math.random() * typingWords.length)]} • `;
  }
  getById('wordList').textContent = `Next: ${upcoming}`;
}

function startTypingGame() {
  if (typingGameInterval) {
    window.clearInterval(typingGameInterval);
  }
  typingGameActive = true;
  typingGameScore = 0;
  typingGameTime = 60;
  typingGameStartTime = 60;
  typingGameCorrect = 0;
  typingGameTotal = 0;
  getById('gameWPM').textContent = '0';
  getById('gameAccuracy').textContent = '0%';
  getById('gameTime').textContent = '60';
  getById('gameResult').textContent = '';
  getById('gameResult').className = 'game-result';
  const typingInput = getById('typingInput');
  const typingButton = getById('typingStartBtn');
  typingInput.disabled = false;
  typingInput.value = '';
  typingInput.focus();
  typingButton.disabled = true;
  typingButton.textContent = 'Game Running...';
  renderNextWord();
  typingGameInterval = window.setInterval(() => {
    typingGameTime -= 1;
    getById('gameTime').textContent = typingGameTime;
    const elapsed = typingGameStartTime - typingGameTime;
    const wpm = elapsed > 0 ? Math.round((typingGameScore / elapsed) * 60) : 0;
    getById('gameWPM').textContent = wpm;
    if (typingGameTime <= 0) {
      window.clearInterval(typingGameInterval);
      typingGameInterval = null;
      endTypingGame();
    }
  }, 1000);
}

function handleTyping(event) {
  if (!typingGameActive || event.key !== 'Enter') return;
  event.preventDefault();
  const typingInput = getById('typingInput');
  const userInput = typingInput.value.trim().toLowerCase();
  const currentWord = getById('currentWord').textContent.toLowerCase();
  typingGameTotal += currentWord.length;
  if (userInput === currentWord) {
    typingGameCorrect += currentWord.length;
    typingGameScore += 1;
  }
  const accuracy = typingGameTotal > 0 ? Math.round((typingGameCorrect / typingGameTotal) * 100) : 0;
  getById('gameAccuracy').textContent = `${accuracy}%`;
  typingInput.value = '';
  renderNextWord();
}

function endTypingGame() {
  typingGameActive = false;
  const typingInput = getById('typingInput');
  const typingButton = getById('typingStartBtn');
  typingInput.disabled = true;
  typingButton.disabled = false;
  typingButton.textContent = 'Start Typing Game';
  const elapsed = typingGameStartTime - typingGameTime;
  const wpm = elapsed > 0 ? Math.round((typingGameScore / elapsed) * 60) : 0;
  const accuracy = typingGameTotal > 0 ? Math.round((typingGameCorrect / typingGameTotal) * 100) : 0;
  let message = '';
  let resultClass = '';
  if (wpm > 80) {
    message = `🚀 Excellent! WPM: ${wpm} | Accuracy: ${accuracy}% - You're on fire!`;
    resultClass = 'win';
  } else if (wpm > 60) {
    message = `🙌 Great! WPM: ${wpm} | Accuracy: ${accuracy}% - Strong performance!`;
    resultClass = 'win';
  } else if (wpm > 40) {
    message = `👍 Nice! WPM: ${wpm} | Accuracy: ${accuracy}% - Keep going!`;
    resultClass = 'win';
  } else {
    message = `😅 WPM: ${wpm} | Accuracy: ${accuracy}% - Try again for a better score.`;
    resultClass = 'lose';
  }
  const resultDiv = getById('gameResult');
  resultDiv.textContent = message;
  resultDiv.className = `game-result ${resultClass}`;
  state.gameStats.typingSessions += 1;
  state.gameStats.bestWpm = Math.max(state.gameStats.bestWpm, wpm);
  saveGameStats();
  updateDashboard();
}

function setGameMode(mode) {
  const typingPanel = getById('typingMode');
  const tappingPanel = getById('tappingMode');
  const typingButton = getById('typingModeBtn');
  const tapButton = getById('tapModeBtn');
  if (!typingPanel || !tappingPanel || !typingButton || !tapButton) return;
  if (mode === 'typing') {
    typingPanel.classList.remove('hidden');
    tappingPanel.classList.add('hidden');
    typingButton.classList.add('active');
    tapButton.classList.remove('active');
  } else {
    typingPanel.classList.add('hidden');
    tappingPanel.classList.remove('hidden');
    typingButton.classList.remove('active');
    tapButton.classList.add('active');
  }
}

function startTapGame() {
  if (tapGameInterval) {
    window.clearInterval(tapGameInterval);
  }
  tapGameActive = true;
  tapGameScore = 0;
  tapGameTime = 15;
  getById('tapScore').textContent = '0';
  getById('tapTime').textContent = '15';
  getById('tapResult').textContent = '';
  getById('tapResult').className = 'game-result';
  const tapTarget = getById('tapTarget');
  const tapStartButton = getById('tapStartBtn');
  tapTarget.disabled = false;
  tapTarget.textContent = 'Tap me!';
  tapStartButton.disabled = true;
  tapGameInterval = window.setInterval(() => {
    tapGameTime -= 1;
    getById('tapTime').textContent = tapGameTime;
    if (tapGameTime <= 0) {
      window.clearInterval(tapGameInterval);
      tapGameInterval = null;
      endTapGame();
    }
  }, 1000);
}

function endTapGame() {
  tapGameActive = false;
  const tapTarget = getById('tapTarget');
  const tapStartButton = getById('tapStartBtn');
  tapTarget.disabled = true;
  tapStartButton.disabled = false;
  getById('tapResult').textContent = `Your score is ${tapGameScore}. ${tapGameScore >= 25 ? 'Awesome tapping speed!' : 'Keep practicing to increase your score.'}`;
  state.gameStats.tappingSessions += 1;
  state.gameStats.bestTap = Math.max(state.gameStats.bestTap, tapGameScore);
  saveGameStats();
  updateDashboard();
}

function handleTap() {
  if (!tapGameActive) return;
  tapGameScore += 1;
  getById('tapScore').textContent = tapGameScore;
}

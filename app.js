// LOADING PAGE TIMEOUT
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
  }, 2500);
});

// TAB SWITCHING
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + 'Tab').classList.add('active');
  event.target.classList.add('active');
}

// ===== TODO APP CODE =====
const todoList = JSON.parse(localStorage.getItem('task')) || [];

function enter(event) {
  if (event.key === 'Enter') {
    addFun();
  }
}

function returnTodo() {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sorted = [...todoList].sort((a, b) => 
    priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']
  );

  let todoListHTML = '';
  
  if (todoList.length === 0) {
    todoListHTML = '<div class="empty-message">No tasks yet 📝 Add one above!</div>';
  } else {
    sorted.forEach((todoObject, index) => {
      const { name, dueDate, priority = 'low' } = todoObject;
      const actualIndex = todoList.findIndex(item => item.name === name && item.dueDate === dueDate);
      const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' }[priority];
      
      const todoDiv = `
        <div class="todo-item priority-${priority}">
          <div>
            <span class="priority-badge ${priority}">${priorityIcon} ${priority.toUpperCase()}</span>
            <div class="todo-name">${name}</div>
            <div class="todo-date">${dueDate || 'No date'}</div>
          </div>
          <button class="delete-btn" data-index="${actualIndex}">Delete</button>
        </div>
      `;
      todoListHTML += todoDiv;
    });
  }

  document.querySelector('.todo-sec').innerHTML = todoListHTML;
  localStorage.setItem('task', JSON.stringify(todoList));

  document.querySelectorAll('.delete-btn').forEach((deleteBtn) => {
    deleteBtn.addEventListener('click', () => {
      const index = parseInt(deleteBtn.dataset.index);
      todoList.splice(index, 1);
      returnTodo();
    });
  });
}

const add = document.querySelector('.add');

const addFun = () => {
  const todoInputElement = document.querySelector('.todo-task');
  const dateInputElement = document.querySelector('.date');
  const priorityInputElement = document.querySelector('.priority');
  
  const name = todoInputElement.value.trim();
  const dueDate = dateInputElement.value.trim();
  const priority = priorityInputElement.value;

  if (name === '' || dueDate === '') {
    alert('Please fill in both fields');
    return;
  }

  todoList.push({ name, dueDate, priority });
  
  todoInputElement.value = '';
  dateInputElement.value = '';
  priorityInputElement.value = 'medium';
  
  returnTodo();
};

returnTodo();
add.addEventListener('click', addFun);
// ===== TYPING GAME CODE =====
const typingWords = [
  // EDUCATION
  'mathematics', 'physics', 'chemistry', 'biology', 'history',
  'geography', 'literature', 'language', 'science', 'university',
  'student', 'teacher', 'classroom', 'homework', 'examination',
  'textbook', 'lecture', 'knowledge', 'learning', 'education',
  
  // COOKING
  'recipe', 'kitchen', 'cooking', 'baking', 'ingredient',
  'boiling', 'frying', 'grilling', 'seasoning', 'flavor',
  'spoon', 'knife', 'stove', 'oven', 'restaurant',
  'chef', 'delicious', 'nutrition', 'breakfast', 'dinner',
  
  // LIFE
  'happiness', 'family', 'friendship', 'love', 'dreams',
  'adventure', 'travel', 'journey', 'exercise', 'health',
  'success', 'motivation', 'inspiration', 'kindness', 'patience',
  'wisdom', 'courage', 'strength', 'growth', 'balance',
  
  // BUSINESS
  'company', 'business', 'marketing', 'sales', 'profit',
  'customer', 'product', 'service', 'quality', 'strategy',
  'investment', 'manager', 'employee', 'contract', 'agreement',
  'meeting', 'presentation', 'deadline', 'budget', 'growth',
  
  // SPORTS
  'football', 'basketball', 'tennis', 'swimming', 'running',
  'athlete', 'championship', 'victory', 'training', 'coach',
  'exercise', 'fitness', 'strength', 'endurance', 'competition',
  'strategy', 'teamwork', 'effort', 'achievement', 'passion',
  
  // TECHNOLOGY
  'computer', 'software', 'hardware', 'internet', 'website',
  'email', 'password', 'security', 'database', 'network',
  'application', 'technology', 'digital', 'electronic', 'server',
  'algorithm', 'programming', 'code', 'development', 'innovation',
  
  // NATURE
  'forest', 'mountain', 'ocean', 'river', 'desert',
  'weather', 'climate', 'sunrise', 'sunset', 'season',
  'animal', 'plant', 'flower', 'tree', 'garden',
  'wind', 'rain', 'snow', 'storm', 'nature',
  
  // ENTERTAINMENT
  'movie', 'music', 'song', 'dance', 'art',
  'painting', 'drawing', 'theater', 'concert', 'festival',
  'entertainment', 'comedy', 'drama', 'action', 'adventure'
];

let typingGameActive = false;
let typingGameScore = 0;
let typingGameStartTime = 60;
let typingGameTime = 60;
let typingGameCorrect = 0;
let typingGameTotal = 0;
let currentWordIndex = 0;
let typingGameInterval = null;

function startTypingGame() {
  typingGameActive = true;
  typingGameScore = 0;
  typingGameStartTime = 60;
  typingGameTime = 60;
  typingGameCorrect = 0;
  typingGameTotal = 0;
  currentWordIndex = 0;

  document.getElementById('gameWPM').textContent = '0';
  document.getElementById('gameAccuracy').textContent = '0%';
  document.getElementById('gameTime').textContent = '60';
  document.getElementById('gameResult').textContent = '';
  document.querySelector('.game-btn').disabled = true;
  document.querySelector('.game-btn').textContent = 'Game Running...';
  
  const typingInput = document.getElementById('typingInput');
  typingInput.disabled = false;
  typingInput.focus();
  typingInput.value = '';

  displayNextWord();

  typingGameInterval = setInterval(() => {
    typingGameTime--;
    document.getElementById('gameTime').textContent = typingGameTime;

    // Calculate WPM based on time elapsed
    const timeElapsed = typingGameStartTime - typingGameTime;
    const wpm = timeElapsed > 0 ? Math.round((typingGameScore / timeElapsed) * 60) : 0;
    document.getElementById('gameWPM').textContent = wpm;

    if (typingGameTime <= 0) {
      clearInterval(typingGameInterval);
      endTypingGame();
    }
  }, 1000);

  typingInput.addEventListener('keypress', handleTyping);
}

function displayNextWord() {
  const word = typingWords[Math.floor(Math.random() * typingWords.length)];
  document.getElementById('currentWord').textContent = word;
  
  // Show upcoming words
  let upcoming = '';
  for (let i = 0; i < 3; i++) {
    upcoming += typingWords[Math.floor(Math.random() * typingWords.length)] + ' • ';
  }
  document.getElementById('wordList').textContent = 'Next: ' + upcoming;
}

function handleTyping(event) {
  if (!typingGameActive) return;
  if (event.key !== 'Enter') return;

  const typingInput = document.getElementById('typingInput');
  const userInput = typingInput.value.trim().toLowerCase();
  const currentWord = document.getElementById('currentWord').textContent.toLowerCase();

  typingGameTotal += currentWord.length;

  if (userInput === currentWord) {
    typingGameCorrect += currentWord.length;
    typingGameScore++;
  }

  const accuracy = typingGameTotal > 0 ? Math.round((typingGameCorrect / typingGameTotal) * 100) : 0;
  document.getElementById('gameAccuracy').textContent = accuracy + '%';

  typingInput.value = '';
  displayNextWord();
}

function endTypingGame() {
  typingGameActive = false;
  document.getElementById('typingInput').disabled = true;
  document.querySelector('.game-btn').disabled = false;
  document.querySelector('.game-btn').textContent = 'Start Game';

  // Final WPM calculation
  const timeElapsed = typingGameStartTime - typingGameTime;
  const wpm = timeElapsed > 0 ? Math.round((typingGameScore / timeElapsed) * 60) : 0;
  const accuracy = typingGameTotal > 0 ? Math.round((typingGameCorrect / typingGameTotal) * 100) : 0;

  let message = '';
  let resultClass = '';

  if (wpm > 80) {
    message = `🚀 Excellent! WPM: ${wpm} | Accuracy: ${accuracy}% - You're a typing master!`;
    resultClass = 'win';
  } else if (wpm > 60) {
    message = `🙌 Great! WPM: ${wpm} | Accuracy: ${accuracy}% - Very good!`;
    resultClass = 'win';
  } else if (wpm > 40) {
    message = `👍 Good! WPM: ${wpm} | Accuracy: ${accuracy}% - Keep practicing!`;
    resultClass = 'win';
  } else {
    message = `😅 WPM: ${wpm} | Accuracy: ${accuracy}% - Try again!`;
    resultClass = 'lose';
  }

  const resultDiv = document.getElementById('gameResult');
  resultDiv.textContent = message;
  resultDiv.className = `game-result ${resultClass}`;

  document.getElementById('typingInput').removeEventListener('keypress', handleTyping);
}
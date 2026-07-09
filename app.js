// LOADING PAGE TIMEOUT
let appShown = false;

function showMainApp() {
  if (appShown) return;
  appShown = true;

  const loadingPage = document.getElementById('loadingPage');
  const mainApp = document.getElementById('mainApp');

  if (loadingPage) {
    loadingPage.classList.add('hidden');
  }
  if (mainApp) {
    mainApp.classList.remove('hidden');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(showMainApp, 2500);
  });
} else {
  window.setTimeout(showMainApp, 2500);
}

window.addEventListener('load', () => {
  window.setTimeout(showMainApp, 2500);
});

// TAB SWITCHING
function switchTab(tabName, event) {
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
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

// ===== TODO APP CODE =====
const todoList = JSON.parse(localStorage.getItem('task')) || [];
const todoHistory = JSON.parse(localStorage.getItem('taskHistory')) || [];
const reminderTimers = {};
const gameStats = JSON.parse(localStorage.getItem('gameStats')) || {
  typingSessions: 0,
  bestWpm: 0,
  tappingSessions: 0,
  bestTap: 0,
};

function enter(event) {
  if (event.key === 'Enter') {
    addFun();
  }
}

function saveTodos() {
  localStorage.setItem('task', JSON.stringify(todoList));
}

function saveHistory() {
  localStorage.setItem('taskHistory', JSON.stringify(todoHistory));
}

function saveGameStats() {
  localStorage.setItem('gameStats', JSON.stringify(gameStats));
}

function updateDashboard() {
  const activeTasks = todoList.length;
  const deletedTasks = todoHistory.filter((item) => item.action === 'Deleted').length;
  const remindersSet = todoList.filter((item) => item.reminderSet).length;

  document.getElementById('statActiveTasks')?.textContent = activeTasks;
  document.getElementById('statDeletedTasks')?.textContent = deletedTasks;
  document.getElementById('statRemindersSet')?.textContent = remindersSet;
  document.getElementById('statTypingSessions')?.textContent = gameStats.typingSessions;
  document.getElementById('statBestWpm')?.textContent = gameStats.bestWpm;
  document.getElementById('statTappingSessions')?.textContent = gameStats.tappingSessions;
  document.getElementById('statBestTap')?.textContent = gameStats.bestTap;
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleString();
}

function timeAgo(timestamp) {
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return 'unknown time';
  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function updateHistoryControls() {
  const clearHistoryBtn = document.querySelector('.clear-history');
  if (!clearHistoryBtn) return;
  clearHistoryBtn.classList.toggle('hidden', todoHistory.length === 0);
}

function requestNotificationPermission() {
  return new Promise((resolve) => {
    if (!('Notification' in window)) {
      resolve('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      resolve('granted');
      return;
    }
    Notification.requestPermission().then(resolve);
  });
}

function notifyUser(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else {
    alert(`${title}\n${body}`);
  }
}

function normalizeExistingTodos() {
  let updated = false;
  todoList.forEach((task) => {
    if (!task.id) {
      task.id = `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      updated = true;
    }
    if (typeof task.reminderSet !== 'boolean') {
      task.reminderSet = false;
      updated = true;
    }
    if (typeof task.reminderNotified !== 'boolean') {
      task.reminderNotified = false;
      updated = true;
    }
  });
  if (updated) saveTodos();
}

function clearReminder(id) {
  if (reminderTimers[id]) {
    clearTimeout(reminderTimers[id]);
    delete reminderTimers[id];
  }
}

function triggerReminder(task) {
  if (task.reminderNotified) return;
  task.reminderNotified = true;
  saveTodos();
  returnTodo();
  notifyUser(`Reminder due: ${task.name}`, `Task is due at ${formatDisplayDate(task.dueDate)}.`);
}

function scheduleReminder(task) {
  clearReminder(task.id);
  if (!task.reminderSet || task.reminderNotified || !task.dueDate) return;

  const due = new Date(task.dueDate).getTime();
  if (isNaN(due)) return;

  const now = Date.now();
  if (due <= now) {
    triggerReminder(task);
    return;
  }

  const delay = due - now;
  reminderTimers[task.id] = setTimeout(() => triggerReminder(task), delay);
}

function scheduleAllReminders() {
  todoList.forEach(scheduleReminder);
}

function setReminder(taskId) {
  const task = todoList.find((item) => item.id === taskId);
  if (!task) return;
  if (!task.dueDate) {
    alert('Please choose a due date for this task before setting a reminder.');
    return;
  }

  requestNotificationPermission().then((permission) => {
    if (permission === 'denied') {
      alert('Notifications are denied. You will receive a browser alert instead.');
    }
    task.reminderSet = true;
    task.reminderNotified = false;
    saveTodos();
    scheduleReminder(task);
    returnTodo();
    updateDashboard();
    if (permission !== 'denied' && permission !== 'unsupported') {
      notifyUser('Reminder scheduled', `You will be alerted when "${task.name}" is due.`);
    }
  });
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
    sorted.forEach((todoObject) => {
      const { id, name, dueDate, priority = 'low', reminderSet, reminderNotified } = todoObject;
      const actualIndex = todoList.findIndex((item) => item.id === id);
      const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' }[priority];
      const reminderLabel = reminderSet
        ? reminderNotified
          ? 'Reminder Sent'
          : 'Reminder On'
        : 'Set Reminder';
      const reminderClass = reminderSet
        ? reminderNotified
          ? 'sent'
          : 'active'
        : '';
      
      const todoDiv = `
        <div class="todo-item priority-${priority}">
          <div>
            <span class="priority-badge ${priority}">${priorityIcon} ${priority.toUpperCase()}</span>
            <div class="todo-name">${name}</div>
            <div class="todo-date">${formatDisplayDate(dueDate) || 'No date'}</div>
          </div>
          <div class="todo-actions-row">
            <button class="reminder-btn ${reminderClass}" data-id="${id}">${reminderLabel}</button>
            <button class="delete-btn" data-index="${actualIndex}">Delete</button>
          </div>
        </div>
      `;
      todoListHTML += todoDiv;
    });
  }

  document.querySelector('.todo-sec').innerHTML = todoListHTML;
  saveTodos();
  updateHistoryControls();
  updateDashboard();
  
  document.querySelectorAll('.delete-btn').forEach((deleteBtn) => {
    deleteBtn.addEventListener('click', () => {
      const index = parseInt(deleteBtn.dataset.index, 10);
      const removed = todoList.splice(index, 1)[0];
      if (removed) {
        todoHistory.unshift({
          ...removed,
          action: 'Deleted',
          archivedAt: new Date().toISOString(),
        });
        saveHistory();
        clearReminder(removed.id);
      }
      returnTodo();
      returnHistory();
    });
  });

  document.querySelectorAll('.reminder-btn').forEach((reminderBtn) => {
    reminderBtn.addEventListener('click', () => {
      setReminder(reminderBtn.dataset.id);
    });
  });
}

function returnHistory() {
  const historySection = document.querySelector('.history-sec');
  if (!historySection) return;

  if (todoHistory.length === 0) {
    historySection.innerHTML = '<div class="empty-message">No task history yet.</div>';
    return;
  }

  let historyHTML = '<div class="history-title">Task History</div>';
  todoHistory.slice(0, 20).forEach((historyItem) => {
    historyHTML += `
      <div class="history-item">
        <div class="history-details">
          <strong>${historyItem.name}</strong>
          <span class="history-meta">Due ${formatDisplayDate(historyItem.dueDate)} • ${historyItem.priority.toUpperCase()} • ${historyItem.action} ${timeAgo(historyItem.archivedAt)}</span>
        </div>
      </div>
    `;
  });

  historySection.innerHTML = historyHTML;
}

function toggleHistory() {
  const historySection = document.querySelector('.history-sec');
  const historyToggle = document.querySelector('.history-toggle');
  if (!historySection || !historyToggle) return;

  const isHidden = historySection.classList.toggle('hidden');
  historyToggle.textContent = isHidden ? 'Show History' : 'Hide History';
  if (!isHidden) {
    returnHistory();
  }
}

function clearHistory() {
  if (!confirm('Clear all task history?')) return;
  todoHistory.length = 0;
  saveHistory();
  returnHistory();
  updateHistoryControls();
  updateDashboard();
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

  const newTask = {
    id: `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    dueDate,
    priority,
    reminderSet: false,
    reminderNotified: false,
  };

  todoList.push(newTask);
  
  todoInputElement.value = '';
  dateInputElement.value = '';
  priorityInputElement.value = 'medium';
  
  returnTodo();
  scheduleReminder(newTask);
};

normalizeExistingTodos();
returnTodo();
returnHistory();
updateHistoryControls();
scheduleAllReminders();
updateDashboard();

if (add) add.addEventListener('click', addFun);
document.querySelector('.history-toggle')?.addEventListener('click', toggleHistory);
document.querySelector('.clear-history')?.addEventListener('click', clearHistory);
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
let tapGameActive = false;
let tapGameScore = 0;
let tapGameTime = 15;
let tapGameInterval = null;

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
  const typingButton = document.getElementById('typingStartBtn');
  typingButton.disabled = true;
  typingButton.textContent = 'Game Running...';
  
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
  const typingButton = document.getElementById('typingStartBtn');
  if (typingButton) {
    typingButton.disabled = false;
    typingButton.textContent = 'Start Typing Game';
  }

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
  const typingButton = document.getElementById('typingStartBtn');
  if (typingButton) {
    typingButton.disabled = false;
    typingButton.textContent = 'Start Typing Game';
  }

  gameStats.typingSessions += 1;
  if (wpm > gameStats.bestWpm) {
    gameStats.bestWpm = wpm;
  }
  saveGameStats();
  updateDashboard();
}

function setGameMode(mode) {
  const typingPanel = document.getElementById('typingMode');
  const tappingPanel = document.getElementById('tappingMode');
  const typingButton = document.getElementById('typingModeBtn');
  const tapButton = document.getElementById('tapModeBtn');

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
  tapGameActive = true;
  tapGameScore = 0;
  tapGameTime = 15;

  document.getElementById('tapScore').textContent = '0';
  document.getElementById('tapTime').textContent = tapGameTime;
  document.getElementById('tapResult').textContent = '';
  const tapTarget = document.getElementById('tapTarget');
  const tapStartButton = document.getElementById('tapStartBtn');

  if (tapTarget) {
    tapTarget.disabled = false;
    tapTarget.textContent = 'Tap me!';
  }
  if (tapStartButton) {
    tapStartButton.disabled = true;
  }

  tapGameInterval = setInterval(() => {
    tapGameTime -= 1;
    document.getElementById('tapTime').textContent = tapGameTime;

    if (tapGameTime <= 0) {
      clearInterval(tapGameInterval);
      endTapGame();
    }
  }, 1000);
}

function endTapGame() {
  tapGameActive = false;
  const tapTarget = document.getElementById('tapTarget');
  const tapStartButton = document.getElementById('tapStartBtn');

  if (tapTarget) {
    tapTarget.disabled = true;
  }
  if (tapStartButton) {
    tapStartButton.disabled = false;
  }

  document.getElementById('tapResult').textContent = `Your score is ${tapGameScore}. ${tapGameScore >= 25 ? 'Awesome tapping speed!' : 'Keep practicing to increase your score.'}`;

  gameStats.tappingSessions += 1;
  if (tapGameScore > gameStats.bestTap) {
    gameStats.bestTap = tapGameScore;
  }
  saveGameStats();
  updateDashboard();
}

function handleTap() {
  if (!tapGameActive) return;
  tapGameScore += 1;
  document.getElementById('tapScore').textContent = tapGameScore;
}

document.getElementById('tapTarget')?.addEventListener('click', handleTap);

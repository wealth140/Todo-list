const STORAGE_KEYS = {
  todos: 'task',
  history: 'taskHistory',
  gameStats: 'gameStats',
  theme: 'appTheme',
};

const state = {
  todos: JSON.parse(localStorage.getItem(STORAGE_KEYS.todos)) || [],
  history: JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [],
  reminderTimers: {},
  gameStats: JSON.parse(localStorage.getItem(STORAGE_KEYS.gameStats)) || {
    typingSessions: 0,
    bestWpm: 0,
    tappingSessions: 0,
    bestTap: 0,
  },
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
};

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

const QUOTES = [
  'Small steps every day move you closer to a stronger tomorrow.',
  'Finish today’s task and let tomorrow reward your focus.',
  'A completed task is progress you can celebrate.',
  'Your momentum grows with every goal you complete.',
  'Stay focused, finish strong, and let your day shine.',
  'The best time to take action is now — one task at a time.',
  'Build your streak with one completed task after another.',
];

// -------------------- DOM HELPERS --------------------
function getEl(selector) {
  return document.querySelector(selector);
}

function getById(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// -------------------- STORAGE --------------------
function saveTodos() {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(state.todos));
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function saveGameStats() {
  localStorage.setItem(STORAGE_KEYS.gameStats, JSON.stringify(state.gameStats));
}

function saveThemePreference(theme) {
  state.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function formatDisplayDate(dateString) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleString();
}

function timeAgo(timestamp) {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return 'unknown time';
  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function normalizeTodos() {
  let updated = false;
  state.todos.forEach((task) => {
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

// -------------------- THEME --------------------
function applyTheme(theme) {
  const body = document.body;
  if (theme === 'light') {
    body.classList.add('light-theme');
    body.classList.remove('dark-theme');
    getById('themeToggleBtn').textContent = '🌙 Switch to Dark';
  } else {
    body.classList.add('dark-theme');
    body.classList.remove('light-theme');
    getById('themeToggleBtn').textContent = '☀️ Switch to Light';
  }
}

function loadThemePreference() {
  const theme = state.theme || 'dark';
  applyTheme(theme);
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  applyTheme(nextTheme);
  saveThemePreference(nextTheme);
}

// -------------------- NOTIFICATIONS & REMINDERS --------------------
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

function clearReminder(id) {
  if (state.reminderTimers[id]) {
    clearTimeout(state.reminderTimers[id]);
    delete state.reminderTimers[id];
  }
}

function triggerReminder(task) {
  if (task.reminderNotified) return;
  task.reminderNotified = true;
  saveTodos();
  renderTodos();
  renderHistory();
  updateDashboard();
  notifyUser(`Reminder due: ${task.name}`, `Task is due at ${formatDisplayDate(task.dueDate)}.`);
}

function scheduleReminder(task) {
  clearReminder(task.id);
  if (!task.reminderSet || task.reminderNotified || !task.dueDate) return;

  const due = new Date(task.dueDate).getTime();
  if (Number.isNaN(due)) return;

  if (due <= Date.now()) {
    triggerReminder(task);
    return;
  }

  const delay = due - Date.now();
  state.reminderTimers[task.id] = window.setTimeout(() => triggerReminder(task), delay);
}

function scheduleAllReminders() {
  state.todos.forEach(scheduleReminder);
}

// -------------------- DASHBOARD & METRICS --------------------
function countCompletedSince(days) {
  const since = Date.now() - days * 86400000;
  return state.history.filter((item) => item.action === 'Completed' && new Date(item.archivedAt).getTime() >= since).length;
}

function getWeeklyCompletionData() {
  const days = 7;
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const data = Array.from({ length: days }, (_, index) => {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() - (days - 1 - index));
    return {
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      iso: day.toISOString().slice(0, 10),
      count: 0,
    };
  });

  state.history.forEach((item) => {
    if (item.action !== 'Completed') return;
    const completedDate = new Date(item.archivedAt).toISOString().slice(0, 10);
    const match = data.find((row) => row.iso === completedDate);
    if (match) {
      match.count += 1;
    }
  });

  return data;
}

function renderCompletionGraph() {
  const chart = getById('completionGraph');
  if (!chart) return;

  const progress = getWeeklyCompletionData();
  const maxCount = Math.max(...progress.map((row) => row.count), 1);

  chart.innerHTML = progress
    .map((row) => {
      const height = Math.max(10, Math.round((row.count / maxCount) * 120));
      return `
        <div class="chart-column">
          <div class="chart-bar" style="height:${height}px">
            <span>${row.count}</span>
          </div>
          <div class="chart-label">${row.label}</div>
        </div>
      `;
    })
    .join('');
}

function updateDashboard() {
  const activeTasks = state.todos.length;
  const deletedTasks = state.history.filter((item) => item.action === 'Deleted').length;
  const remindersSet = state.todos.filter((item) => item.reminderSet).length;

  getById('statActiveTasks').textContent = activeTasks;
  getById('statDeletedTasks').textContent = deletedTasks;
  getById('statRemindersSet').textContent = remindersSet;
  getById('statTypingSessions').textContent = state.gameStats.typingSessions;
  getById('statBestWpm').textContent = state.gameStats.bestWpm;
  getById('statTappingSessions').textContent = state.gameStats.tappingSessions;
  getById('statBestTap').textContent = state.gameStats.bestTap;
  getById('statDailyCompleted').textContent = countCompletedSince(1);
  getById('statWeeklyCompleted').textContent = countCompletedSince(7);
  getById('statMonthlyCompleted').textContent = countCompletedSince(30);
  renderCompletionGraph();
}

function getQuoteOfDay() {
  const now = new Date();
  return QUOTES[now.getDate() % QUOTES.length];
}

function setWelcomeMessage() {
  const hour = new Date().getHours();
  const timePhrase = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  getById('welcomeGreeting').textContent = `${timePhrase}, welcome back!`;
  getById('dailyQuote').textContent = getQuoteOfDay();
}

function showCelebration(message) {
  const celebration = getById('celebrationToast');
  if (!celebration) return;
  celebration.textContent = message;
  celebration.classList.remove('hidden');
  celebration.classList.add('visible');

  window.clearTimeout(celebration._timeout);
  celebration._timeout = window.setTimeout(() => {
    celebration.classList.remove('visible');
    celebration.classList.add('hidden');
  }, 3200);
}

// -------------------- TODO LOGIC --------------------
function updateHistoryControls() {
  const clearHistoryBtn = getEl('.clear-history');
  if (!clearHistoryBtn) return;
  clearHistoryBtn.classList.toggle('hidden', state.history.length === 0);
}

function renderTodos() {
  const container = getEl('.todo-sec');
  if (!container) return;

  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sorted = [...state.todos].sort((a, b) => {
    const left = priorityOrder[a.priority || 'low'] || 3;
    const right = priorityOrder[b.priority || 'low'] || 3;
    return left - right;
  });

  if (!state.todos.length) {
    container.innerHTML = '<div class="empty-message">You have no tasks yet. Add one above to get started.</div>';
  } else {
    container.innerHTML = sorted
      .map((todoObject) => {
        const { id, name, dueDate, priority = 'low', reminderSet, reminderNotified } = todoObject;
        const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' }[priority] || '🟢';
        const reminderLabel = reminderSet ? (reminderNotified ? 'Reminder Sent' : 'Reminder On') : 'Set Reminder';
        const reminderClass = reminderSet ? (reminderNotified ? 'sent' : 'active') : '';

        return `
          <div class="todo-item">
            <div>
              <span class="priority-badge ${priority}">${priorityIcon} ${priority.toUpperCase()}</span>
              <div class="todo-name">${escapeHtml(name)}</div>
              <div class="todo-date">${escapeHtml(formatDisplayDate(dueDate))}</div>
            </div>
            <div class="todo-actions-row">
              <button class="complete-btn" data-id="${id}">Complete</button>
              <button class="reminder-btn ${reminderClass}" data-id="${id}">${reminderLabel}</button>
              <button class="delete-btn" data-id="${id}">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  saveTodos();
  updateHistoryControls();
  updateDashboard();

  container.querySelectorAll('.complete-btn').forEach((btn) => {
    btn.addEventListener('click', () => completeTask(btn.dataset.id));
  });

  container.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });

  container.querySelectorAll('.reminder-btn').forEach((btn) => {
    btn.addEventListener('click', () => setReminder(btn.dataset.id));
  });
}

function renderHistory() {
  const historySection = getEl('.history-sec');
  if (!historySection) return;

  if (!state.history.length) {
    historySection.innerHTML = '<div class="empty-message">No task history yet.</div>';
    return;
  }

  historySection.innerHTML = [
    '<div class="history-title">Task History</div>',
    ...state.history.slice(0, 20).map((historyItem) => `
      <div class="history-item">
        <div class="history-details">
          <strong>${escapeHtml(historyItem.name)}</strong>
          <span class="history-meta">Due ${escapeHtml(formatDisplayDate(historyItem.dueDate))} • ${escapeHtml((historyItem.priority || 'medium').toUpperCase())} • ${escapeHtml(historyItem.action)} ${timeAgo(historyItem.archivedAt)}</span>
        </div>
      </div>
    `),
  ].join('');
}

function toggleHistory() {
  const historySection = getEl('.history-sec');
  const historyToggle = getEl('.history-toggle');
  if (!historySection || !historyToggle) return;

  const isHidden = historySection.classList.toggle('hidden');
  historyToggle.textContent = isHidden ? 'Show History' : 'Hide History';
  if (!isHidden) {
    renderHistory();
  }
}

function clearHistory() {
  if (!window.confirm('Clear all task history?')) return;
  state.history.length = 0;
  saveHistory();
  renderHistory();
  updateHistoryControls();
  updateDashboard();
}

function addTask() {
  const todoInputElement = getEl('.todo-task');
  const dateInputElement = getEl('.date');
  const priorityInputElement = getEl('.priority');

  if (!todoInputElement || !dateInputElement || !priorityInputElement) return;

  const name = todoInputElement.value.trim();
  const dueDate = dateInputElement.value.trim();
  const priority = priorityInputElement.value;

  if (!name || !dueDate) {
    alert('Please fill in both fields.');
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

  state.todos.push(newTask);
  saveTodos();
  todoInputElement.value = '';
  dateInputElement.value = '';
  priorityInputElement.value = 'medium';
  renderTodos();
  scheduleReminder(newTask);
  todoInputElement.focus();
}

function enter(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTask();
  }
}

function completeTask(taskId) {
  const taskIndex = state.todos.findIndex((item) => item.id === taskId);
  if (taskIndex === -1) return;
  const task = state.todos.splice(taskIndex, 1)[0];
  if (task) {
    state.history.unshift({
      ...task,
      action: 'Completed',
      archivedAt: new Date().toISOString(),
    });
    saveHistory();
    clearReminder(task.id);
    renderTodos();
    renderHistory();
    updateDashboard();
    showCelebration(`🎉 Nice work! '${task.name}' is complete.`);
  }
}

function deleteTask(taskId) {
  const taskIndex = state.todos.findIndex((item) => item.id === taskId);
  if (taskIndex === -1) return;
  const removed = state.todos.splice(taskIndex, 1)[0];
  if (removed) {
    state.history.unshift({
      ...removed,
      action: 'Deleted',
      archivedAt: new Date().toISOString(),
    });
    saveHistory();
    clearReminder(removed.id);
    renderTodos();
    renderHistory();
  }
}

function setReminder(taskId) {
  const task = state.todos.find((item) => item.id === taskId);
  if (!task) return;
  if (!task.dueDate) {
    alert('Please choose a due date before setting a reminder.');
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
    renderTodos();
    updateDashboard();

    if (permission !== 'denied' && permission !== 'unsupported') {
      notifyUser('Reminder scheduled', `You will be alerted when "${task.name}" is due.`);
    }
  });
}

function switchTab(tabName, event) {
  document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));

  const selectedTab = getById(`${tabName}Tab`);
  if (!selectedTab) return;

  selectedTab.classList.add('active');
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

// -------------------- GAME LOGIC --------------------
const typingWords = [
  'mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography', 'literature', 'language', 'science', 'university',
  'student', 'teacher', 'classroom', 'homework', 'examination', 'textbook', 'lecture', 'knowledge', 'learning', 'education',
  'recipe', 'kitchen', 'cooking', 'baking', 'ingredient', 'boiling', 'frying', 'grilling', 'seasoning', 'flavor', 'spoon',
  'knife', 'stove', 'oven', 'restaurant', 'chef', 'delicious', 'nutrition', 'breakfast', 'dinner', 'happiness', 'family',
  'friendship', 'love', 'dreams', 'adventure', 'travel', 'journey', 'exercise', 'health', 'success', 'motivation', 'inspiration',
  'kindness', 'patience', 'wisdom', 'courage', 'strength', 'growth', 'balance', 'company', 'business', 'marketing', 'sales',
  'profit', 'customer', 'product', 'service', 'quality', 'strategy', 'investment', 'manager', 'employee', 'contract', 'agreement',
  'meeting', 'presentation', 'deadline', 'budget', 'football', 'basketball', 'tennis', 'swimming', 'running', 'athlete',
  'championship', 'victory', 'training', 'coach', 'fitness', 'endurance', 'competition', 'teamwork', 'effort', 'achievement',
  'passion', 'computer', 'software', 'hardware', 'internet', 'website', 'email', 'password', 'security', 'database', 'network',
  'application', 'technology', 'digital', 'electronic', 'server', 'algorithm', 'programming', 'code', 'development', 'innovation',
  'forest', 'mountain', 'ocean', 'river', 'desert', 'weather', 'climate', 'sunrise', 'sunset', 'season', 'animal', 'plant',
  'flower', 'tree', 'garden', 'wind', 'rain', 'snow', 'storm', 'nature', 'movie', 'music', 'song', 'dance', 'art', 'painting',
  'drawing', 'theater', 'concert', 'festival', 'entertainment', 'comedy', 'drama', 'action', 'adventure',
];

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
    message = `🚀 Excellent! WPM: ${wpm} | Accuracy: ${accuracy}% - You are a typing master!`;
    resultClass = 'win';
  } else if (wpm > 60) {
    message = `🙌 Great! WPM: ${wpm} | Accuracy: ${accuracy}% - Very strong!`;
    resultClass = 'win';
  } else if (wpm > 40) {
    message = `👍 Nice! WPM: ${wpm} | Accuracy: ${accuracy}% - Keep practicing!`;
    resultClass = 'win';
  } else {
    message = `😅 WPM: ${wpm} | Accuracy: ${accuracy}% - Try again!`;
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

// -------------------- INITIALIZATION --------------------
document.addEventListener('DOMContentLoaded', () => {
  normalizeTodos();
  renderTodos();
  renderHistory();
  updateHistoryControls();
  updateDashboard();
  scheduleAllReminders();
  setGameMode('typing');
  setWelcomeMessage();
  loadThemePreference();

  getEl('.add')?.addEventListener('click', addTask);
  getEl('.todo-task')?.addEventListener('keydown', enter);
  getEl('.history-toggle')?.addEventListener('click', toggleHistory);
  getEl('.clear-history')?.addEventListener('click', clearHistory);
  getById('typingStartBtn')?.addEventListener('click', startTypingGame);
  getById('tapStartBtn')?.addEventListener('click', startTapGame);
  getById('tapTarget')?.addEventListener('click', handleTap);
  getById('typingInput')?.addEventListener('keydown', handleTyping);
  getById('refreshDashboardBtn')?.addEventListener('click', updateDashboard);
  getById('themeToggleBtn')?.addEventListener('click', toggleTheme);
});

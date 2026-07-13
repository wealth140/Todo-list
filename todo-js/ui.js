function getEl(selector) {
  return document.querySelector(selector);
}

function getById(id) {
  return document.getElementById(id);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const QUOTES = [
  'Small steps every day move you closer to a stronger tomorrow.',
  'Finish today’s task and let tomorrow reward your focus.',
  'A completed task is progress you can celebrate.',
  'Your momentum grows with every goal you complete.',
  'Stay focused, finish strong, and let your day shine.',
  'The best time to take action is now — one task at a time.',
  'Build your streak with one completed task after another.',
];

function setWelcomeMessage() {
  const hour = new Date().getHours();
  const timePhrase = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = state.userName || 'Friend';
  getById('welcomeGreeting').textContent = `${timePhrase}, ${name}`;
  getById('dailyQuote').textContent = QUOTES[new Date().getDate() % QUOTES.length];
  getById('hubTitle').textContent = `${name}'s Productivity Hub`;
}

function updateHubSummary() {
  getById('statHubTasks').textContent = `${state.todos.length} tasks`;
  getById('statHubReminders').textContent = `${state.todos.filter((item) => item.reminderSet).length} reminders`;
  getById('statHubStreak').textContent = `${countCompletedSince(7)} days`;
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    getById('themeToggleBtn').textContent = '🌙 Dark mode';
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    getById('themeToggleBtn').textContent = '☀️ Light mode';
  }
}

function loadThemePreference() {
  applyTheme(state.theme || 'dark');
}

function showLoadingOverlay() {
  getById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
  getById('loadingOverlay').classList.add('hidden');
  getById('appShell').classList.remove('hidden');
}

function setActiveTab(tabName) {
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.toggle('active', tab.id === `${tabName}Tab`);
  });

  document.querySelectorAll('.app-nav .nav-btn, .mobile-nav .nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
}

function showCelebration(message) {
  let celebration = getById('celebrationToast');
  if (!celebration) {
    celebration = document.createElement('div');
    celebration.id = 'celebrationToast';
    celebration.className = 'celebration-toast hidden';
    document.body.appendChild(celebration);
  }
  celebration.textContent = message;
  celebration.classList.remove('hidden');
  celebration.classList.add('visible');

  window.clearTimeout(celebration._timeout);
  celebration._timeout = window.setTimeout(() => {
    celebration.classList.remove('visible');
    celebration.classList.add('hidden');
  }, 3200);
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

function playAlarmTone() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
    oscillator.onended = () => audioCtx.close();
  } catch (error) {
    // Ignore audio failure and continue gracefully.
  }
}

function notifyUser(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, renotify: true });
  } else {
    alert(`${title}\n${body}`);
  }
}

function triggerAlarmEffect() {
  playAlarmTone();
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

function updateReminderConfigUI() {
  const alarmBtn = getById('alarmModeToggle');
  const status = getById('statAlarmMode');
  if (alarmBtn && status) {
    alarmBtn.textContent = state.alarmMode ? 'Disable Alarm Mode' : 'Enable Alarm Mode';
    status.textContent = state.alarmMode ? 'On' : 'Off';
  }
}

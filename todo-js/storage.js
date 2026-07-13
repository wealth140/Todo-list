const STORAGE_KEYS = {
  todos: 'task',
  history: 'taskHistory',
  gameStats: 'gameStats',
  theme: 'appTheme',
  userName: 'userName',
  alarmMode: 'alarmMode',
};

const state = {
  todos: JSON.parse(localStorage.getItem(STORAGE_KEYS.todos)) || [],
  history: JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [],
  gameStats: JSON.parse(localStorage.getItem(STORAGE_KEYS.gameStats)) || {
    typingSessions: 0,
    bestWpm: 0,
    tappingSessions: 0,
    bestTap: 0,
  },
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'dark',
  userName: localStorage.getItem(STORAGE_KEYS.userName) || '',
  alarmMode: localStorage.getItem(STORAGE_KEYS.alarmMode) === 'true',
  reminderTimers: {},
};

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

function saveUserName(name) {
  state.userName = name;
  localStorage.setItem(STORAGE_KEYS.userName, name);
}

function saveAlarmMode(isEnabled) {
  state.alarmMode = isEnabled;
  localStorage.setItem(STORAGE_KEYS.alarmMode, String(isEnabled));
}

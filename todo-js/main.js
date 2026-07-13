function showAppWithName(name) {
  saveUserName(name);
  setWelcomeMessage();
  hideLoadingOverlay();
  renderTodos();
  renderHistory();
  renderRemindersList();
  updateDashboard();
  updateHubSummary();
}

function populateUserNameField() {
  const input = getById('userNameInput');
  if (!input) return;
  input.value = state.userName || '';
}

function attachNavListeners() {
  const buttons = document.querySelectorAll('.app-nav .nav-btn, .mobile-nav .nav-btn');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

function attachAppListeners() {
  getById('startAppBtn')?.addEventListener('click', () => {
    const nameField = getById('userNameInput');
    const name = nameField?.value.trim();
    if (!name) {
      alert('Please enter your name to continue.');
      return;
    }
    showAppWithName(name);
  });

  getById('themeToggleBtn')?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(nextTheme);
    saveThemePreference(nextTheme);
  });

  getById('addTaskBtn')?.addEventListener('click', addTask);
  getById('taskNameInput')?.addEventListener('keydown', enterKey);
  getById('historyToggleBtn')?.addEventListener('click', toggleHistory);
  getById('clearHistoryBtn')?.addEventListener('click', clearHistory);
  getById('typingStartBtn')?.addEventListener('click', startTypingGame);
  getById('tapStartBtn')?.addEventListener('click', startTapGame);
  getById('tapTarget')?.addEventListener('click', handleTap);
  getById('typingInput')?.addEventListener('keydown', handleTyping);
  getById('alarmModeToggle')?.addEventListener('click', () => {
    saveAlarmMode(!state.alarmMode);
    updateDashboard();
    updateReminderConfigUI();
  });
  getById('requestNotificationBtn')?.addEventListener('click', () => {
    requestNotificationPermission().then((permission) => {
      if (permission === 'granted') {
        alert('Notifications enabled! Reminders will now be delivered to your device.');
      } else {
        alert('Unable to enable notifications. Please allow them in your browser settings.');
      }
    });
  });
  document.querySelectorAll('.mode-btn')?.forEach((button) => {
    button.addEventListener('click', () => {
      setGameMode(button.dataset.game);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  normalizeTodos();
  populateUserNameField();
  loadThemePreference();
  setWelcomeMessage();
  attachNavListeners();
  attachAppListeners();
  scheduleAllReminders();
  if (state.userName) {
    hideLoadingOverlay();
    renderTodos();
    renderHistory();
    renderRemindersList();
    updateDashboard();
    updateHubSummary();
  }
});

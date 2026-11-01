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
  const input = getById('userNameInputField');
  if (!input) return;
  input.value = state.userName || '';
}

function closeMobileNav() {
  const appShell = getById('appShell');
  const toggle = getById('mobileNavToggle');
  appShell?.classList.remove('nav-open');
  document.body.classList.remove('nav-open');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
  }
}

function attachNavListeners() {
  const buttons = document.querySelectorAll('.app-nav .nav-btn');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.tab);
    });
  });
  getById('mobileNavToggle')?.addEventListener('click', () => {
    const appShell = getById('appShell');
    const isOpen = appShell?.classList.toggle('nav-open') || false;
    document.body.classList.toggle('nav-open', isOpen);
    getById('mobileNavToggle')?.setAttribute('aria-expanded', String(isOpen));
    getById('mobileNavToggle')?.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });
  getById('navBackdrop')?.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileNav();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) closeMobileNav();
  });
  window.addEventListener('popstate', () => {
    const tabName = window.location.hash.slice(1).replace(/Tab$/, '');
    setActiveTab(tabName || 'tasks', { updateHistory: false });
  });
}

function attachAppListeners() {
  getById('startHubBtn')?.addEventListener('click', () => {
    const nameField = getById('userNameInputField');
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
  document.querySelectorAll('.sound-toggle-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('soundEnabled', String(state.soundEnabled));
      updateSoundControls();
    });
  });
  getById('requestNotificationBtn')?.addEventListener('click', () => {
    requestNotificationPermission().then((permission) => {
      if (permission === 'granted') {
        alert('Notifications enabled! Reminders will now be delivered to your device.');
      } else if (permission === 'unsupported') {
        alert('This browser does not support device notifications.');
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
  updateSoundControls();
  attachNavListeners();
  attachAppListeners();
  attachAssistantListeners();
  const initialTab = window.location.hash.slice(1).replace(/Tab$/, '');
  setActiveTab(initialTab || 'tasks', { scroll: false, updateHistory: false });
  scheduleAllReminders();
  if (state.userName) {
    hideLoadingOverlay();
    renderTodos();
    renderHistory();
    renderRemindersList();
    updateDashboard();
    updateHubSummary();
  } else {
    hideLoadingScreen();
    getById('nameInputPage')?.classList.remove('hidden');
  }
});

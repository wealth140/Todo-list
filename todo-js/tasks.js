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

function updateHistoryControls() {
  const clearHistoryBtn = getById('clearHistoryBtn');
  if (!clearHistoryBtn) return;
  clearHistoryBtn.classList.toggle('hidden', state.history.length === 0);
}

function renderRemindersList() {
  const container = getById('upcomingReminders');
  if (!container) return;
  const reminders = state.todos.filter((task) => task.reminderSet);
  if (!reminders.length) {
    container.innerHTML = '<div class="empty-message">No reminders are scheduled yet.</div>';
    return;
  }
  const items = reminders
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map((task) => `
      <div class="reminder-list-item">
        <div>
          <h4>${escapeHtml(task.name)}</h4>
          <span>${escapeHtml(formatDisplayDate(task.dueDate))}</span>
        </div>
        <button class="settings-btn secondary" data-id="${task.id}" type="button">Cancel</button>
      </div>
    `)
    .join('');
  container.innerHTML = items;
  container.querySelectorAll('.settings-btn.secondary').forEach((btn) => {
    btn.addEventListener('click', () => {
      const task = state.todos.find((item) => item.id === btn.dataset.id);
      if (task) {
        task.reminderSet = false;
        task.reminderNotified = false;
        saveTodos();
        renderTodos();
        renderRemindersList();
        updateDashboard();
      }
    });
  });
}

function renderTodos() {
  const container = getById('todoSection');
  if (!container) return;

  const priorities = { high: 1, medium: 2, low: 3 };
  const sorted = [...state.todos].sort((a, b) => (priorities[a.priority] || 3) - (priorities[b.priority] || 3));

  if (!sorted.length) {
    container.innerHTML = '<div class="empty-message">Your task board is empty. Add a task to begin your day.</div>';
  } else {
    container.innerHTML = sorted
      .map((task) => {
        const reminderLabel = task.reminderSet
          ? task.reminderNotified
            ? 'Reminder Sent'
            : 'Reminder On'
          : 'Set Reminder';
        const reminderClass = task.reminderSet ? (task.reminderNotified ? 'sent' : 'active') : '';
        return `
          <div class="todo-item">
            <div>
              <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
              <div class="todo-name">${escapeHtml(task.name)}</div>
              <div class="todo-date">${escapeHtml(formatDisplayDate(task.dueDate))}</div>
            </div>
            <div class="todo-actions-row">
              <button class="complete-btn" data-id="${task.id}" type="button">Complete</button>
              <button class="reminder-btn ${reminderClass}" data-id="${task.id}" type="button">${reminderLabel}</button>
              <button class="delete-btn" data-id="${task.id}" type="button">Delete</button>
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
  const historySection = getById('historySection');
  if (!historySection) return;
  if (!state.history.length) {
    historySection.innerHTML = '<div class="empty-message">No task history yet.</div>';
    return;
  }
  historySection.innerHTML = [
    '<div class="history-title">Task History</div>',
    ...state.history.slice(0, 20).map((item) => `
      <div class="history-item">
        <div class="history-details">
          <strong>${escapeHtml(item.name)}</strong>
          <span>Due ${escapeHtml(formatDisplayDate(item.dueDate))} • ${escapeHtml(item.priority.toUpperCase())} • ${escapeHtml(item.action)} ${timeAgo(item.archivedAt)}</span>
        </div>
      </div>
    `),
  ].join('');
}

function toggleHistory() {
  const historySection = getById('historySection');
  const historyToggle = getById('historyToggleBtn');
  if (!historySection || !historyToggle) return;
  const hidden = historySection.classList.toggle('hidden');
  historyToggle.textContent = hidden ? 'Show History' : 'Hide History';
  if (!hidden) renderHistory();
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
  const nameInput = getById('taskNameInput');
  const dateInput = getById('taskDateInput');
  const priorityInput = getById('taskPriorityInput');
  if (!nameInput || !dateInput || !priorityInput) return;

  const name = nameInput.value.trim();
  const dueDate = dateInput.value.trim();
  const priority = priorityInput.value;
  if (!name || !dueDate) {
    alert('Please enter a task title and due date.');
    return;
  }

  const task = {
    id: `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    dueDate,
    priority,
    reminderSet: false,
    reminderNotified: false,
  };
  state.todos.push(task);
  saveTodos();
  nameInput.value = '';
  dateInput.value = '';
  priorityInput.value = 'medium';
  renderTodos();
  scheduleReminder(task);
  updateHubSummary();
}

function enterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTask();
  }
}

function completeTask(taskId) {
  const index = state.todos.findIndex((item) => item.id === taskId);
  if (index === -1) return;
  const [task] = state.todos.splice(index, 1);
  state.history.unshift({ ...task, action: 'Completed', archivedAt: new Date().toISOString() });
  saveTodos();
  saveHistory();
  renderTodos();
  renderHistory();
  updateDashboard();
  updateHubSummary();
  showCelebration(`🎉 Nice work! '${task.name}' is complete.`);
}

function deleteTask(taskId) {
  const index = state.todos.findIndex((item) => item.id === taskId);
  if (index === -1) return;
  const [task] = state.todos.splice(index, 1);
  state.history.unshift({ ...task, action: 'Deleted', archivedAt: new Date().toISOString() });
  saveTodos();
  saveHistory();
  clearReminder(task.id);
  renderTodos();
  renderHistory();
  renderRemindersList();
  updateHubSummary();
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
      alert('Notifications are denied. You will receive an on-screen alert instead.');
    }
    task.reminderSet = true;
    task.reminderNotified = false;
    saveTodos();
    scheduleReminder(task);
    renderTodos();
    renderRemindersList();
    updateDashboard();
    updateHubSummary();
    if (permission === 'granted') {
      notifyUser('Reminder scheduled', `Your task '${task.name}' will alert you when it is due.`);
    }
  });
}

function clearReminder(taskId) {
  if (state.reminderTimers[taskId]) {
    clearTimeout(state.reminderTimers[taskId]);
    delete state.reminderTimers[taskId];
  }
}

function triggerReminder(task) {
  if (task.reminderNotified) return;
  task.reminderNotified = true;
  saveTodos();
  renderTodos();
  renderHistory();
  renderRemindersList();
  updateDashboard();
  if (state.alarmMode) {
    triggerAlarmEffect();
  }
  notifyUser(`Reminder due: ${task.name}`, `Your task is due at ${formatDisplayDate(task.dueDate)}.`);
}

function scheduleReminder(task) {
  clearReminder(task.id);
  if (!task.reminderSet || task.reminderNotified || !task.dueDate) return;
  const dueTime = new Date(task.dueDate).getTime();
  if (Number.isNaN(dueTime)) return;
  const delay = dueTime - Date.now();
  if (delay <= 0) {
    triggerReminder(task);
    return;
  }
  state.reminderTimers[task.id] = window.setTimeout(() => triggerReminder(task), delay);
}

function scheduleAllReminders() {
  state.todos.forEach(scheduleReminder);
}

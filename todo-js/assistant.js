let lastAssistantReply = '';

function getAssistantReply(message) {
  const prompt = message.toLowerCase();
  const tasks = [...state.todos].sort((a, b) => {
    const priority = { high: 1, medium: 2, low: 3 };
    const difference = (priority[a.priority] || 3) - (priority[b.priority] || 3);
    return difference || new Date(a.dueDate) - new Date(b.dueDate);
  });

  if (prompt.includes('task') || prompt.includes('todo') || prompt.includes('list')) {
    if (!tasks.length) return 'Your task list is clear. Add one small, specific task to get started.';
    const nextTasks = tasks.slice(0, 3).map((task) => `${task.name} (${task.priority} priority)`);
    return `You have ${tasks.length} active task${tasks.length === 1 ? '' : 's'}. Start with: ${nextTasks.join('; ')}.`;
  }

  if (prompt.includes('what should') || prompt.includes('next') || prompt.includes('priorit')) {
    if (!tasks.length) return 'You have no active tasks right now. Add a task with a clear next action.';
    return `Try "${tasks[0].name}" first; it is your highest-priority task${tasks[0].dueDate ? `, due ${formatDisplayDate(tasks[0].dueDate)}` : ''}.`;
  }

  if (prompt.includes('progress') || prompt.includes('completed') || prompt.includes('streak')) {
    const completed = state.history.filter((item) => item.action === 'Completed').length;
    return `You have completed ${completed} task${completed === 1 ? '' : 's'} in total and have ${tasks.length} active. Keep the next step manageable.`;
  }

  if (prompt.includes('remind')) {
    const reminderCount = tasks.filter((task) => task.reminderSet).length;
    return `${reminderCount} active task${reminderCount === 1 ? ' has' : 's have'} a reminder. Use the Reminders tab to manage alerts.`;
  }

  return 'Try asking what to work on next, how many tasks you have, or how your progress is going.';
}

function appendAssistantMessage(message, role) {
  const conversation = getById('aiConversation');
  if (!conversation) return;
  const bubble = document.createElement('p');
  bubble.className = `assistant-message ${role}`;
  bubble.textContent = message;
  conversation.appendChild(bubble);
  conversation.scrollTop = conversation.scrollHeight;
}

function sendAssistantMessage() {
  const input = getById('aiUserInput');
  const message = input?.value.trim();
  if (!message) return;

  appendAssistantMessage(message, 'user');
  lastAssistantReply = getAssistantReply(message);
  appendAssistantMessage(lastAssistantReply, 'assistant');
  input.value = '';
  input.focus();
}

function attachAssistantListeners() {
  const panel = getById('aiAssistantPanel');
  const input = getById('aiUserInput');
  if (!panel || !input) return;

  document.querySelectorAll('#aiAssistantToggleMobile, #aiAssistantToggleSidebar').forEach((button) => {
    button.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) input.focus();
    });
  });
  getById('closeAiPanel')?.addEventListener('click', () => panel.classList.add('hidden'));
  getById('aiSendBtn')?.addEventListener('click', sendAssistantMessage);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendAssistantMessage();
    }
  });
  getById('aiSpeakBtn')?.addEventListener('click', () => {
    if (!lastAssistantReply) return;
    if (!('speechSynthesis' in window)) {
      alert('Speech playback is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(lastAssistantReply));
  });
  appendAssistantMessage('Hi! I can summarize your tasks and help you choose a next step.', 'assistant');
}

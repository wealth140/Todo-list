function countCompletedSince(days) {
  const cutoff = Date.now() - days * 86400000;
  return state.history.filter((item) => item.action === 'Completed' && new Date(item.archivedAt).getTime() >= cutoff).length;
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
    const dayIso = new Date(item.archivedAt).toISOString().slice(0, 10);
    const bucket = data.find((row) => row.iso === dayIso);
    if (bucket) bucket.count += 1;
  });
  return data;
}

function renderCompletionGraph() {
  const graph = getById('completionGraph');
  if (!graph) return;
  const data = getWeeklyCompletionData();
  const maxCount = Math.max(...data.map((row) => row.count), 1);
  graph.innerHTML = data
    .map((row) => {
      const height = Math.max(16, Math.round((row.count / maxCount) * 140));
      return `
        <div class="chart-column">
          <div class="chart-bar" style="height: ${height}px"><span>${row.count}</span></div>
          <div class="chart-label">${row.label}</div>
        </div>
      `;
    })
    .join('');
}

function updateDashboard() {
  getById('statActiveTasks').textContent = state.todos.length;
  getById('statDailyCompleted').textContent = countCompletedSince(1);
  getById('statWeeklyCompleted').textContent = countCompletedSince(7);
  getById('statRemindersSet').textContent = state.todos.filter((task) => task.reminderSet).length;
  getById('statTypingSessions').textContent = state.gameStats.typingSessions;
  getById('statBestWpm').textContent = state.gameStats.bestWpm;
  getById('statBestTap').textContent = state.gameStats.bestTap;
  getById('statAlarmMode').textContent = state.alarmMode ? 'On' : 'Off';
  updateHubSummary();
  renderCompletionGraph();
  updateReminderConfigUI();
  renderRemindersList();
}

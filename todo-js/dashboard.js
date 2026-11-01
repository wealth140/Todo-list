function countCompletedSince(days) {
  const cutoff = Date.now() - days * 86400000;
  return state.history.filter((item) => item.action === 'Completed' && new Date(item.archivedAt).getTime() >= cutoff).length;
}

function getCompletionStreak() {
  const completedDays = new Set(
    state.history
      .filter((item) => item.action === 'Completed')
      .map((item) => {
        const date = new Date(item.archivedAt);
        if (Number.isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
      .filter(Boolean),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (!completedDays.has(todayKey)) today.setDate(today.getDate() - 1);

  let streak = 0;
  while (true) {
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!completedDays.has(key)) return streak;
    streak += 1;
    today.setDate(today.getDate() - 1);
  }
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
      iso: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
      count: 0,
    };
  });
  state.history.forEach((item) => {
    if (item.action !== 'Completed') return;
    const completedAt = new Date(item.archivedAt);
    if (Number.isNaN(completedAt.getTime())) return;
    const dayIso = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')}`;
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
  const weeklyData = getWeeklyCompletionData();
  const completedToday = weeklyData[weeklyData.length - 1].count;
  const completedThisWeek = weeklyData.reduce((total, day) => total + day.count, 0);
  const todayTotal = state.todos.length + completedToday;
  const dailyRate = todayTotal ? Math.round((completedToday / todayTotal) * 100) : 0;
  const bestDay = weeklyData.reduce((best, day) => day.count > best.count ? day : best, { label: '--', count: 0 });

  getById('statActiveTasks').textContent = state.todos.length;
  getById('statDailyCompleted').textContent = completedToday;
  getById('statDailyRate').textContent = `${dailyRate}%`;
  getById('statWeeklyCompleted').textContent = completedThisWeek;
  getById('statWeeklyAvg').textContent = (completedThisWeek / 7).toFixed(1);
  getById('statBestDay').textContent = bestDay.count ? `${bestDay.label} (${bestDay.count})` : '--';
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

const dayData = [
  { name: "Mon", full: "Monday", orders: [10, 9, 12, 16, 23, 35, 48, 62, 79, 88, 72, 54, 41, 49, 67, 89, 98, 94, 83, 67, 48, 31, 19, 12] },
  { name: "Tue", full: "Tuesday", orders: [9, 8, 11, 14, 20, 32, 45, 59, 74, 81, 68, 51, 39, 46, 64, 84, 93, 88, 77, 61, 43, 28, 17, 10] },
  { name: "Wed", full: "Wednesday", orders: [8, 8, 10, 15, 22, 34, 47, 61, 77, 86, 70, 53, 40, 48, 66, 87, 96, 91, 80, 64, 46, 29, 18, 11] },
  { name: "Thu", full: "Thursday", orders: [10, 9, 12, 17, 25, 38, 52, 69, 84, 91, 75, 57, 43, 52, 73, 94, 100, 96, 86, 70, 51, 34, 21, 13] },
  { name: "Fri", full: "Friday", orders: [12, 10, 14, 19, 28, 42, 57, 73, 86, 91, 76, 60, 48, 59, 79, 96, 100, 98, 91, 79, 63, 46, 31, 20] },
  { name: "Sat", full: "Saturday", orders: [16, 14, 17, 23, 33, 47, 62, 77, 88, 94, 89, 76, 65, 70, 83, 97, 100, 99, 93, 82, 69, 53, 38, 25] },
  { name: "Sun", full: "Sunday", orders: [13, 11, 13, 18, 27, 40, 55, 70, 83, 89, 81, 67, 53, 57, 72, 89, 96, 92, 81, 66, 50, 36, 24, 16] }
];

const today = new Date();
const todayIndex = (today.getDay() + 6) % 7;
const firstDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayIndex);
const state = { selectedDay: todayIndex, shifts: [], goal: 180, view: "forecast" };
const weekStrip = document.getElementById("week-strip");
const chartWrap = document.getElementById("chart-wrap");
const toast = document.getElementById("toast");
let toastTimeout;

function dateForDay(index) {
  const date = new Date(firstDate);
  date.setDate(date.getDate() + index);
  return date;
}

function dateLabel(date, options) {
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

function buildWeek() {
  weekStrip.innerHTML = "";
  dayData.forEach((day, index) => {
    const date = dateForDay(index);
    const button = document.createElement("button");
    button.className = `day-button${index === state.selectedDay ? " is-selected" : ""}`;
    button.type = "button";
    button.setAttribute("aria-pressed", String(index === state.selectedDay));
    button.setAttribute("aria-label", `${day.full}, ${dateLabel(date, { day: "numeric", month: "long" })}`);
    button.innerHTML = `<span class="day-name">${day.name}</span><span class="day-number">${date.getDate()}</span><span class="day-indicator"></span>`;
    button.addEventListener("click", () => {
      state.selectedDay = index;
      buildWeek();
      renderForecast();
    });
    weekStrip.append(button);
  });
}

function estimate(hour, demand) {
  return Math.round((7.5 + demand * 0.065) * 2) / 2;
}

function renderChart() {
  const data = dayData[state.selectedDay].orders;
  const width = 760;
  const height = 218;
  const left = 38;
  const right = 12;
  const top = 14;
  const bottom = 30;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;
  const slot = chartWidth / data.length;
  const barWidth = Math.max(7, slot * 0.52);
  const earnings = data.map((value, hour) => estimate(hour, value));
  const maxEarnings = Math.max(...earnings) + 3;
  const points = earnings.map((value, hour) => ({
    x: left + hour * slot + slot / 2,
    y: top + chartHeight - (value / maxEarnings) * chartHeight
  }));
  const peak = data.indexOf(Math.max(...data));
  const highlighted = data.findIndex((value, hour) => hour >= 16 && value > 70);
  const highlightStart = highlighted < 0 ? peak - 1 : highlighted;
  const highlightEnd = Math.min(highlightStart + 4, 23);
  const blocks = Array.from({ length: 5 }, (_, level) => {
    const y = top + level * chartHeight / 4;
    const label = Math.round((4 - level) * 25);
    return `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text class="chart-label" x="0" y="${y + 3}">${label}</text>`;
  }).join("");
  const bars = data.map((value, hour) => {
    const barHeight = value / 100 * chartHeight;
    const x = left + hour * slot + (slot - barWidth) / 2;
    const y = top + chartHeight - barHeight;
    const kind = value < 25 ? "quiet" : value > 82 ? "busy" : "";
    return `<rect class="chart-bar ${kind}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3"><title>${hourLabel(hour)} · ${value}% expected demand</title></rect>`;
  }).join("");
  const line = points.map((point, i) => `${i ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const xLabels = [0, 4, 8, 12, 16, 20, 23].map(hour =>
    `<text class="chart-label" text-anchor="middle" x="${left + hour * slot + slot / 2}" y="${height - 6}">${hourLabel(hour)}</text>`
  ).join("");
  const areaLeft = left + highlightStart * slot;
  const areaRight = left + (highlightEnd + 1) * slot;
  const peakPoint = points[peak];
  chartWrap.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Expected order demand and estimated hourly earnings for ${dayData[state.selectedDay].full}">
    <rect class="chart-highlight" x="${areaLeft}" y="${top}" width="${areaRight - areaLeft}" height="${chartHeight}" rx="4"></rect>
    ${blocks}${bars}<path class="chart-line" d="${line}"></path>
    <circle class="chart-point" cx="${peakPoint.x}" cy="${peakPoint.y}" r="4"></circle>${xLabels}
  </svg>`;
}

function hourLabel(hour) {
  const suffix = hour < 12 ? "am" : "pm";
  const display = hour % 12 || 12;
  return `${display}${suffix}`;
}

function bestWindow() {
  const orders = dayData[state.selectedDay].orders;
  let bestStart = 16;
  let bestTotal = -1;
  for (let start = 11; start <= 19; start++) {
    const total = orders.slice(start, start + 3).reduce((sum, value) => sum + value, 0);
    if (total > bestTotal) {
      bestTotal = total;
      bestStart = start;
    }
  }
  const average = orders.slice(bestStart, bestStart + 3).reduce((sum, value) => sum + estimate(bestStart, value), 0);
  return { start: bestStart, end: bestStart + 3, low: Math.round(average * 0.85), high: Math.round(average * 1.08) };
}

function renderForecast() {
  const day = dayData[state.selectedDay];
  const date = dateForDay(state.selectedDay);
  const window = bestWindow();
  const orderWord = window.start >= 17 ? "Dinner rush" : window.start >= 11 ? "Afternoon peak" : "Early shift";
  document.getElementById("today-label").textContent = `${dateLabel(date, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}`;
  document.getElementById("chart-description").textContent = `A typical ${day.full} in your patch`;
  document.getElementById("period-button").textContent = state.selectedDay === todayIndex ? "Today" : day.name;
  document.getElementById("recommend-time").textContent = `${hourLabel(window.start)} – ${hourLabel(window.end)}`;
  document.getElementById("recommend-detail").textContent = `${orderWord} · demand is usually high`;
  document.getElementById("recommend-earnings").textContent = `£${window.low}–£${window.high}`;
  const difference = Math.round((day.orders.slice(17, 20).reduce((a, b) => a + b, 0) / day.orders.slice(12, 15).reduce((a, b) => a + b, 0) - 1) * 100);
  document.getElementById("insight-text").innerHTML = `${orderWord} demand is usually <strong>${difference}% higher</strong> than the afternoon lull around your patch.`;
  renderChart();
  renderShiftSummary();
}

function renderShiftSummary() {
  const totalHours = state.shifts.length * 3;
  const totalEarnings = state.shifts.reduce((sum, shift) => sum + shift.low, 0);
  document.getElementById("nav-count").textContent = state.shifts.length;
  document.getElementById("planned-hours").textContent = `${totalHours} hrs`;
  document.getElementById("planned-earnings").textContent = `£${totalEarnings}`;
  document.getElementById("goal-progress").innerHTML = `£${totalEarnings} <i>/ £${state.goal}</i>`;
  document.getElementById("progress-fill").style.width = `${Math.min(100, totalEarnings / state.goal * 100)}%`;
  document.getElementById("shift-count").textContent = `${state.shifts.length} ${state.shifts.length === 1 ? "shift" : "shifts"}`;
  const list = document.getElementById("shift-list");
  list.innerHTML = "";
  state.shifts.forEach((shift, index) => {
    const date = dateForDay(shift.day);
    const row = document.createElement("article");
    row.className = "shift-row";
    row.innerHTML = `<div class="shift-date"><strong>${date.getDate()}</strong><span>${dateLabel(date, { month: "short" })}</span></div><div class="shift-info"><strong>${dayData[shift.day].full} · ${hourLabel(shift.start)} – ${hourLabel(shift.end)}</strong><span>Manchester City Centre · 3 hours</span></div><div class="shift-money"><strong>£${shift.low}–£${shift.high}</strong><span>estimated</span></div><button class="remove-shift" aria-label="Remove ${dayData[shift.day].full} shift">×</button>`;
    row.querySelector(".remove-shift").addEventListener("click", () => {
      state.shifts.splice(index, 1);
      renderShiftSummary();
      showToast("Shift removed from your plan");
    });
    list.append(row);
  });
  document.getElementById("empty-state").classList.toggle("is-visible", state.shifts.length === 0);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function showView(view) {
  state.view = view;
  document.getElementById("forecast-view").classList.toggle("is-hidden", view !== "forecast");
  document.getElementById("shifts-view").classList.toggle("is-hidden", view !== "shifts");
  document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("is-active", link.dataset.view === view));
  if (view === "shifts") renderShiftSummary();
}

document.querySelectorAll(".nav-link").forEach(link => link.addEventListener("click", () => showView(link.dataset.view)));
document.getElementById("add-shift").addEventListener("click", () => {
  const window = bestWindow();
  const exists = state.shifts.some(shift => shift.day === state.selectedDay);
  if (exists) {
    showToast("You already have a shift planned for this day");
    return;
  }
  state.shifts.push({ day: state.selectedDay, start: window.start, end: window.end, low: window.low, high: window.high });
  renderShiftSummary();
  showToast(`${dayData[state.selectedDay].full} shift added to your plan`);
});
document.getElementById("back-to-forecast").addEventListener("click", () => showView("forecast"));
document.getElementById("empty-forecast").addEventListener("click", () => showView("forecast"));
document.getElementById("edit-goal").addEventListener("click", () => {
  const nextGoal = window.prompt("Set your weekly earnings goal (£)", String(state.goal));
  if (nextGoal === null) return;
  const amount = Number(nextGoal);
  if (!Number.isFinite(amount) || amount < 1 || amount > 9999) {
    showToast("Enter a goal between £1 and £9,999");
    return;
  }
  state.goal = Math.round(amount);
  document.getElementById("goal-display").textContent = state.goal;
  renderShiftSummary();
});

buildWeek();
renderForecast();

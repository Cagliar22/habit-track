let view = "today";
const today = new Date();
const todayKey = today.toISOString().slice(0, 10);

document.getElementById("date").innerText = today.toDateString();

let habits = JSON.parse(localStorage.getItem("habits")) || [];

/* ---------- UTILS ---------- */

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function setView(v) {
  view = v;
  render();
}

function barColor(pct) {
  if (pct >= 75) return "var(--green)";
  if (pct >= 50) return "var(--yellow)";
  return "var(--red)";
}

/* ---------- HABITS ---------- */

function addHabit() {
  habits.push({
    id: crypto.randomUUID(),
    name: "New Habit",
    history: {},
    archived: false,
    order: habits.length
  });
  save();
  render();
}

function toggleHabit(id) {
  const h = habits.find(h => h.id === id);
  h.history[todayKey] = !h.history[todayKey];
  save();
  render();
}

function archiveHabit(id) {
  habits.find(h => h.id === id).archived = true;
  save();
  render();
}

function deleteHabit(id) {
  if (!confirm("Delete this habit?")) return;
  habits = habits.filter(h => h.id !== id);
  save();
  render();
}

/* ---------- STREAK ---------- */

function getStreak(h) {
  let streak = 0;
  let d = new Date(today);
  while (h.history[d.toISOString().slice(0,10)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------- COMPLETION ---------- */

function overallCompletion() {
  const active = habits.filter(h => !h.archived);
  if (!active.length) return 0;
  const done = active.filter(h => h.history[todayKey]).length;
  return Math.round((done / active.length) * 100);
}

/* ---------- SWIPE ---------- */

function addSwipe(el, habit) {
  let startX = 0;

  el.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  el.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 80) toggleHabit(habit.id);
    if (diff < -80) deleteHabit(habit.id);
  });
}

/* ---------- TODAY ---------- */

function renderToday(app) {
  const pct = overallCompletion();
  const bar = document.getElementById("overallBar");

  bar.style.width = pct + "%";
  bar.style.background = barColor(pct);

  habits
    .filter(h => !h.archived)
    .sort((a,b) => a.order - b.order)
    .forEach(h => {
      const done = h.history[todayKey];
      const streak = getStreak(h);

      const card = document.createElement("div");
      card.className = "habit" + (done ? " done" : "");
      card.onclick = () => toggleHabit(h.id);

      addSwipe(card, h);

      card.innerHTML = `
        <div class="habit-top">
          <div class="habit-name">${h.name}</div>
          <div class="archive" onclick="event.stopPropagation(); archiveHabit('${h.id}')">archive</div>
        </div>
        <div class="streak">🔥 ${streak}</div>
        <div class="progress">
          <div class="progress-fill" style="width:${done ? 100 : 0}%; background:var(--green)"></div>
        </div>
      `;

      app.appendChild(card);
    });

  const add = document.createElement("button");
  add.className = "add-btn";
  add.innerText = "+ Add Habit";
  add.onclick = addHabit;
  app.appendChild(add);
}

/* ---------- WEEK (MATRIX) ---------- */

function renderWeek(app) {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  grid.innerHTML =
    "<div></div>" +
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
      .map(d => `<div class="cell">${d}</div>`).join("");

  habits.filter(h => !h.archived).forEach(h => {
    grid.innerHTML += `<div>${h.name}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      grid.innerHTML += `<div class="dot ${h.history[key] ? "done" : ""}"></div>`;
    }
  });

  app.appendChild(grid);
}

/* ---------- MONTH (CALENDAR) ---------- */

function renderMonth(app) {
  const y = today.getFullYear();
  const m = today.getMonth();

  const firstDay = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

  const cal = document.createElement("div");
  cal.className = "calendar";

  for (let i = 0; i < (firstDay + 6) % 7; i++) {
    cal.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= days; d++) {
    const key = new Date(y, m, d).toISOString().slice(0,10);
    const active = habits.filter(h => !h.archived);
    const done = active.filter(h => h.history[key]).length;
    const pct = active.length ? (done / active.length) * 100 : 0;

    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.background = barColor(pct);
    cell.innerText = d;

    cal.appendChild(cell);
  }

  app.appendChild(cal);
}

/* ---------- MAIN ---------- */

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (view === "today") renderToday(app);
  if (view === "week") renderWeek(app);
  if (view === "month") renderMonth(app);
}

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

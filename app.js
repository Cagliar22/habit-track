let view = "today";
const today = new Date();
const todayKey = today.toISOString().slice(0, 10);

document.getElementById("date").innerText = today.toDateString();

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function setView(v) {
  view = v;
  render();
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

function renameHabit(id, value) {
  habits.find(h => h.id === id).name = value;
  save();
}

function archiveHabit(id) {
  habits.find(h => h.id === id).archived = true;
  save();
  render();
}

function deleteHabit(id) {
  if (!confirm("Delete this habit permanently?")) return;
  habits = habits.filter(h => h.id !== id);
  save();
  render();
}

/* ---------- STREAK ---------- */

function getStreak(habit) {
  let streak = 0;
  let d = new Date(today);

  while (habit.history[d.toISOString().slice(0, 10)]) {
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

function barColor(pct) {
  if (pct >= 75) return "var(--green)";
  if (pct >= 50) return "var(--yellow)";
  return "var(--red)";
}

/* ---------- RENDER TODAY ---------- */

function renderToday(app) {
  const percent = overallCompletion();
  const bar = document.getElementById("overallBar");

  bar.style.width = percent + "%";
  bar.style.background = barColor(percent);

  habits
    .filter(h => !h.archived)
    .sort((a, b) => a.order - b.order)
    .forEach(habit => {
      const done = habit.history[todayKey];
      const streak = getStreak(habit);

      const card = document.createElement("div");
      card.className = "habit" + (done ? " done" : "");
      card.draggable = true;

      card.ondragstart = e => e.dataTransfer.setData("id", habit.id);
      card.ondragover = e => e.preventDefault();
      card.ondrop = e => reorder(e, habit.id);

      card.onclick = () => toggleHabit(habit.id);

      card.innerHTML = `
        <div class="habit-header">
          <input
            value="${habit.name}"
            onclick="event.stopPropagation()"
            oninput="renameHabit('${habit.id}', this.value)"
          >
          <div class="streak">🔥 ${streak}</div>
        </div>

        <div class="progress">
          <div class="progress-fill" 
               style="width:${done ? 100 : 0}%; background:var(--green)">
          </div>
        </div>

        <div class="actions">
          <span onclick="event.stopPropagation(); archiveHabit('${habit.id}')">Archive</span>
          <span onclick="event.stopPropagation(); deleteHabit('${habit.id}')">Delete</span>
        </div>
      `;

      app.appendChild(card);
    });

  const addBtn = document.createElement("button");
  addBtn.className = "add-btn";
  addBtn.innerText = "+ Add Habit";
  addBtn.onclick = addHabit;

  app.appendChild(addBtn);
}

/* ---------- REORDER ---------- */

function reorder(e, targetId) {
  const draggedId = e.dataTransfer.getData("id");
  if (draggedId === targetId) return;

  const dragged = habits.find(h => h.id === draggedId);
  const target = habits.find(h => h.id === targetId);

  const temp = dragged.order;
  dragged.order = target.order;
  target.order = temp;

  save();
  render();
}

/* ---------- WEEK ---------- */

function renderWeek(app) {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  grid.innerHTML =
    "<div></div>" +
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
      .map(d => `<div>${d}</div>`).join("");

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

/* ---------- MONTH ---------- */

function renderMonth(app) {
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  const cal = document.createElement("div");
  cal.className = "calendar";

  for (let i = 0; i < (firstDay + 6) % 7; i++) {
    cal.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= days; d++) {
    const key = new Date(year, month, d).toISOString().slice(0,10);
    const done = habits.filter(h => h.history[key] && !h.archived).length;
    const pct = habits.length ? done / habits.filter(h => !h.archived).length : 0;

    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.background = barColor(pct * 100);
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

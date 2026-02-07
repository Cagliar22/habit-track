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
    history: {}
  });
  save();
  render();
}

function toggleHabit(id) {
  const habit = habits.find(h => h.id === id);
  habit.history[todayKey] = !habit.history[todayKey];
  save();
  render();
}

function renameHabit(id, value) {
  const habit = habits.find(h => h.id === id);
  habit.name = value;
  save();
}

/* ---------- COMPLETION ---------- */

function overallCompletion() {
  if (habits.length === 0) return 0;
  const done = habits.filter(h => h.history[todayKey]).length;
  return Math.round((done / habits.length) * 100);
}

/* ---------- RENDER TODAY ---------- */

function renderToday(app) {
  const percent = overallCompletion();
  const bar = document.getElementById("overallBar");

  bar.style.width = percent + "%";
  bar.style.background = percent >= 75 ? "var(--green)" : "#777";

  habits.forEach(habit => {
    const done = habit.history[todayKey];

    const card = document.createElement("div");
    card.className = "habit" + (done ? " done" : "");
    card.onclick = () => toggleHabit(habit.id);

    card.innerHTML = `
      <input
        value="${habit.name}"
        onclick="event.stopPropagation()"
        oninput="renameHabit('${habit.id}', this.value)"
      >
      <div class="progress">
        <div class="progress-fill" style="width:${done ? 100 : 0}%"></div>
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

/* ---------- RENDER WEEK ---------- */

function renderWeek(app) {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  grid.innerHTML =
    "<div></div>" +
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map(d => `<div>${d}</div>`)
      .join("");

  habits.forEach(habit => {
    grid.innerHTML += `<div>${habit.name}</div>`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);

      grid.innerHTML += `
        <div class="dot ${habit.history[key] ? "done" : ""}"></div>
      `;
    }
  });

  app.appendChild(grid);
}

/* ---------- RENDER MONTH ---------- */

function renderMonth(app) {
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendar = document.createElement("div");
  calendar.className = "calendar";

  // Empty cells before month starts
  for (let i = 0; i < (firstDay + 6) % 7; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = new Date(year, month, day).toISOString().slice(0, 10);
    const completed = habits.filter(h => h.history[dateKey]).length;
    const pct = habits.length ? completed / habits.length : 0;

    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.background = pct >= 0.75 ? "var(--green)" : "#222";
    cell.innerText = day;

    calendar.appendChild(cell);
  }

  app.appendChild(calendar);
}

/* ---------- MAIN RENDER ---------- */

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (view === "today") renderToday(app);
  if (view === "week") renderWeek(app);
  if (view === "month") renderMonth(app);
}

render();

/* ---------- PWA ---------- */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

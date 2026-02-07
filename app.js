let view = "today";
const today = new Date();
const todayKey = today.toISOString().slice(0,10);

document.getElementById("date").innerText = today.toDateString();

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function setView(v) {
  view = v;
  render();
}

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
  const h = habits.find(h => h.id === id);
  h.history[todayKey] = !h.history[todayKey];
  save();
  render();
}

function renameHabit(id, name) {
  habits.find(h => h.id === id).name = name;
  save();
}

function overallCompletion() {
  if (!habits.length) return 0;
  let done = habits.filter(h => h.history[todayKey]).length;
  return Math.round((done / habits.length) * 100);
}

function renderToday(app) {
  const percent = overallCompletion();
  const bar = document.getElementById("overallBar");
  bar.style.width = percent + "%";
  bar.style.background = percent >= 75 ? "var(--green)" : "#777";

  habits.forEach(h => {
    const done = h.history[todayKey];
    const div = document.createElement("div");
    div.className = "habit" + (done ? " done" : "");
    div.onclick = () => toggleHabit(h.id);

    div.innerHTML = `
      <input value="${h.name}" oninput="renameHabit('${h.id}', this.value)">
      <div class="progress">
        <div class="progress-fill" style="width:${done ? 100 : 0}%"></div>
      </div>
    `;
    app.appendChild(div);
  });

  const add = document.createElement("button");
  add.className = "add-btn";
  add.innerText = "+ Add Habit";
  add.onclick = addHabit;
  app.appendChild(add);
}

function renderWeek(app) {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + 1);

  const grid = document.createElement("div");
  grid.className = "week-grid";

  grid.innerHTML = "<div></div>" + ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    .map(d => `<div>${d}</div>`).join("");

  habits.forEach(h => {
    grid.innerHTML += `<div>${h.name}</div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      const dot = `<div class="dot ${h.history[key] ? "done" : ""}"></div>`;
      grid.innerHTML += dot;
    }
  });

  app.appendChild(grid);
}

function renderMonth(app) {
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const days = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();

  const cal = document.createElement("div");
  cal.className = "calendar";

  for (let i = 1; i <= days; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i);
    const key = d.toISOString().slice(0,10);

    let done = habits.filter(h => h.history[key]).length;
    let pct = habits.length ? done / habits.length : 0;

    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.background = pct >= 0.75 ? "#3ddc84" : "#222";
    cell.innerText = i;
    cal.appendChild(cell);
  }

  app.appendChild(cal);
}

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

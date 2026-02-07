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

function renameHabit(id, value) {
  const h = habits.find(h => h.id === id);
  h.name = value;
  save();
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
  while (h.history[d.toISOString().slice(0, 10)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* Overall streak (all habits done consecutive days) */
function getOverallStreak() {
  let streak = 0;
  let d = new Date(today);
  while (habits.filter(h => !h.archived).every(h => h.history[d.toISOString().slice(0, 10)])) {
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

/* ---------- DRAG & DROP ---------- */

function addDragHandlers(el, habit) {
  el.setAttribute("draggable", true);

  el.addEventListener("dragstart", e => {
    el.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", habit.id);
  });

  el.addEventListener("dragend", () => {
    el.classList.remove("dragging");
    save();
    render();
  });
}

function handleDragOver(container, e) {
  e.preventDefault();
  const draggingEl = container.querySelector(".dragging");
  const siblings = [...container.querySelectorAll(".habit:not(.dragging)")];
  const afterElement = siblings.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = e.clientY - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;

  if (afterElement) {
    container.insertBefore(draggingEl, afterElement);
  } else {
    container.appendChild(draggingEl);
  }

  // update order
  [...container.querySelectorAll(".habit")].forEach((h, i) => {
    const id = h.dataset.id;
    habits.find(hb => hb.id === id).order = i;
  });
}

/* ---------- TODAY ---------- */

function renderToday(app) {
  const pct = overallCompletion();
  const bar = document.getElementById("overallBar");

  bar.style.width = pct + "%";
  bar.style.background = barColor(pct);

  const overall = document.createElement("div");
  overall.style.fontSize = "14px";
  overall.style.color = "var(--muted)";
  overall.style.marginBottom = "8px";
  overall.innerText = `🔥 Overall streak: ${getOverallStreak()} days`;
  app.appendChild(overall);

  const container = document.createElement("div");
  container.addEventListener("dragover", e => handleDragOver(container, e));

  habits
    .filter(h => !h.archived)
    .sort((a, b) => a.order - b.order)
    .forEach(h => {
      const done = h.history[todayKey];
      const streak = getStreak(h);

      const card = document.createElement("div");
      card.className = "habit" + (done ? " done" : "");
      card.dataset.id = h.id;
      card.onclick = () => toggleHabit(h.id);

      addSwipe(card, h);
      addDragHandlers(card, h);

      card.innerHTML = `
        <div class="habit-top">
          <input
            class="habit-name"
            value="${h.name}"
            onclick="event.stopPropagation()"
            oninput="renameHabit('${h.i

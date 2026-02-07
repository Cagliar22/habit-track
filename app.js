document.addEventListener("DOMContentLoaded", () => {
  const appEl = document.getElementById("app");
  const dateEl = document.getElementById("date");
  const overallBar = document.getElementById("overallBar");

  if (!appEl || !dateEl || !overallBar) {
    console.error("Missing essential elements (#app, #date, or #overallBar)");
    return;
  }

  let view = "today";
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  dateEl.innerText = today.toDateString();

  let habits = JSON.parse(localStorage.getItem("habits")) || [];

  // ---------- UTILS ----------
  function save() {
    localStorage.setItem("habits", JSON.stringify(habits));
  }

  function generateId() {
    return crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12);
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

  // ---------- HABITS ----------
  function addHabit() {
    habits.push({
      id: generateId(),
      name: "New Habit",
      history: {},
      archived: false,
      order: habits.length
    });
    save();
    render();
    focusNewHabit();
  }

  function toggleHabit(id) {
    const h = habits.find(h => h.id === id);
    if (!h) return;
    h.history[todayKey] = !h.history[todayKey];
    save();
    render();
  }

  function renameHabit(id, value) {
    const h = habits.find(h => h.id === id);
    if (!h) return;
    h.name = value;
    save();
  }

  function archiveHabit(id) {
    const h = habits.find(h => h.id === id);
    if (!h) return;
    h.archived = true;
    save();
    render();
  }

  function deleteHabit(id) {
    if (!confirm("Delete this habit?")) return;
    habits = habits.filter(h => h.id !== id);
    save();
    render();
  }

  // ---------- STREAK ----------
  function getStreak(h) {
    let streak = 0;
    let d = new Date(today);
    while (h.history[d.toISOString().slice(0, 10)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function getOverallStreak() {
    let streak = 0;
    let d = new Date(today);
    while (habits.filter(h => !h.archived).every(h => h.history[d.toISOString().slice(0, 10)])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  // ---------- COMPLETION ----------
  function overallCompletion() {
    const active = habits.filter(h => !h.archived);
    if (!active.length) return 0;
    const done = active.filter(h => h.history[todayKey]).length;
    return Math.round((done / active.length) * 100);
  }

  // ---------- SWIPE ----------
  function addSwipe(el, habit) {
    let startX = 0;
    el.addEventListener("touchstart", e => startX = e.touches[0].clientX);
    el.addEventListener("touchend", e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 80) toggleHabit(habit.id);
      if (diff < -80) deleteHabit(habit.id);
    });
  }

  // ---------- DRAG & DROP ----------
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
    if (!draggingEl) return;
    const siblings = [...container.querySelectorAll(".habit:not(.dragging)")];
    const afterElement = siblings.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = e.clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;

    if (afterElement) container.insertBefore(draggingEl, afterElement);
    else container.appendChild(draggingEl);

    [...container.querySelectorAll(".habit")].forEach((h, i) => {
      const habit = habits.find(hb => hb.id === h.dataset.id);
      if (habit) habit.order = i;
    });
  }

  // ---------- FOCUS ----------
  function focusNewHabit() {
    const last = appEl.querySelector(".habit-name:last-of-type");
    if (last) last.focus();
  }

  // ---------- RENDER TODAY ----------
  function renderToday(app) {
    const pct = overallCompletion();
    overallBar.style.width = pct + "%";
    overallBar.style.background = barColor(pct);

    const overall = document.createElement("div");
    overall.style.fontSize = "14px";
    overall.style.color = "var(--muted)";
    overall.style.marginBottom = "8px";
    overall.innerText = `🔥 Overall streak: ${getOverallStreak()} days`;
    app.appendChild(overall);

    const container = document.createElement("div");
    container.addEventListener("dragover", e => handleDragOver(container, e));

    habits.filter(h => !h.archived).sort((a, b) => a.order - b.order)
      .forEach(h => {
        const card = document.createElement("div");
        card.className = "habit" + (h.history[todayKey] ? " done" : "");
        card.dataset.id = h.id;
        card.onclick = () => toggleHabit(h.id);

        addSwipe(card, h);
        addDragHandlers(card, h);

        // Habit top
        const habitTop = document.createElement("div");
        habitTop.className = "habit-top";

        const input = document.createElement("input");
        input.className = "habit-name";
        input.value = h.name;
        input.addEventListener("click", e => e.stopPropagation());
        input.addEventListener("input", e => renameHabit(h.id, e.target.value));

        const archiveBtn = document.createElement("div");
        archiveBtn.className = "archive";
        archiveBtn.innerText = "archive";
        archiveBtn.addEventListener("click", e => {
          e.stopPropagation();
          archiveHabit(h.id);
        });

        habitTop.appendChild(input);
        habitTop.appendChild(archiveBtn);

        const streakDiv = document.createElement("div");
        streakDiv.className = "streak";
        streakDiv.innerText = `🔥 ${getStreak(h)}`;

        const progressDiv = document.createElement("div");
        progressDiv.className = "progress";
        const fill = document.createElement("div");
        fill.className = "progress-fill";
        fill.style.width = h.history[todayKey] ? "100%" : "0%";
        fill.style.background = "var(--green)";
        progressDiv.appendChild(fill);

        card.appendChild(habitTop);
        card.appendChild(streakDiv);
        card.appendChild(progressDiv);

        container.appendChild(card);
      });

    app.appendChild(container);

    const add = document.createElement("button");
    add.className = "add-btn";
    add.innerText = "+ Add Habit";
    add.onclick = addHabit;
    app.appendChild(add);
  }

  // ---------- RENDER WEEK ----------
  function renderWeek(app) {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1);

    const grid = document.createElement("div");
    grid.className = "week-grid";

    grid.appendChild(document.createElement("div")); // top-left empty
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(d => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.innerText = d;
      grid.appendChild(cell);
    });

    habits.filter(h => !h.archived).forEach(h => {
      const nameDiv = document.createElement("div");
      nameDiv.innerText = h.name;
      grid.appendChild(nameDiv);

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0,10);
        const dot = document.createElement("div");
        dot.className = "dot" + (h.history[key] ? " done" : "");
        grid.appendChild(dot);
      }
    });

    app.appendChild(grid);
  }

  // ---------- RENDER MONTH ----------
  function renderMonth(app) {
    const y = today.getFullYear();
    const m = today.getMonth();
    const firstDay = new Date(y,m,1).getDay();
    const days = new Date(y,m+1,0).getDate();

    const cal = document.createElement("div");
    cal.className = "calendar";

    for (let i=0; i<(firstDay+6)%7; i++) cal.appendChild(document.createElement("div"));

    for (let d=1; d<=days; d++) {
      const key = new Date(y,m,d).toISOString().slice(0,10);
      const active = habits.filter(h=>!h.archived);
      const done = active.filter(h=>h.history[key]).length;
      const pct = active.length ? (done/active.length)*100 : 0;

      const cell = document.createElement("div");
      cell.className = "day";
      cell.style.background = barColor(pct);
      cell.innerText = d;

      cell.onclick = ()=> {
        alert(
          `Habits for ${d}/${m+1}/${y}:\n` +
          active.map(h=>`${h.name}: ${h.history[key]?"✅":"❌"}`).join("\n")
        );
      };

      cal.appendChild(cell);
    }

    app.appendChild(cal);
  }

  // ---------- MAIN RENDER ----------
  function render() {
    appEl.innerHTML = "";
    if (view === "today") renderToday(appEl);
    else if (view === "week") renderWeek(appEl);
    else if (view === "month") renderMonth(appEl);
  }

  // Expose globally
  window.setView = setView;
  window.renameHabit = renameHabit;

  render();
});

document.addEventListener("DOMContentLoaded", () => {
  let view = "today";
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const dateEl = document.getElementById("date");
  const overallBar = document.getElementById("overallBar");
  const appEl = document.getElementById("app");

  dateEl.innerText = today.toDateString();

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
    focusNewHabit();
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

  /* ---------- TODAY ---------- */
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

    habits
      .filter(h => !h.archived)
      .sort((a, b) => a.order - b.order)
      .forEach(h => {
        const done = h.history[todayKey];
        const streak = getStreak(h);

        const card = document.createElement("div");
        card.className = "habit" + (done ? " done" : "");

        // Toggle completion on card click
        card.addEventListener("click", () => toggleHabit(h.id));

        // Top row: name + archive
        const topDiv = document.createElement("div");
        topDiv.className = "habit-top";

        const input = document.createElement("input");
        input.className = "habit-name";
        input.value = h.name;
        input.addEventListener("click", e => e.stopPropagation()); // prevent toggling
        input.addEventListener("input", e => renameHabit(h.id, e.target.value));

        const archiveBtn = document.createElement("div");
        archiveBtn.className = "archive";
        archiveBtn.innerText = "archive";
        archiveBtn.addEventListener("click", e => { e.stopPropagation(); archiveHabit(h.id); });

        topDiv.appendChild(input);
        topDiv.appendChild(archiveBtn);

        // Streak display
        const streakDiv = document.createElement("div");
        streakDiv.className = "streak";
        streakDiv.innerText = `🔥 ${streak}`;

        // Progress bar for individual habit
        const progressDiv = document.createElement("div");
        progressDiv.className = "progress";
        const fillDiv = document.createElement("div");
        fillDiv.className = "progress-fill";
        fillDiv.style.width = done ? "100%" : "0%";
        fillDiv.style.background = done ? "var(--green)" : "var(--red)";
        progressDiv.appendChild(fillDiv);

        card.appendChild(topDiv);
        card.appendChild(streakDiv);
        card.appendChild(progressDiv);

        app.appendChild(card);
      });

    const add = document.createElement("button");
    add.className = "add-btn";
    add.innerText = "+ Add Habit";
    add.onclick = addHabit;
    app.appendChild(add);
  }

  /* ---------- WEEK ---------- */
  function renderWeek(app) {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1); // Monday start

    const grid = document.createElement("div");
    grid.className = "week-grid";

    grid.innerHTML =
      "<div></div>" +
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        .map(d => `<div class="cell">${d}</div>`).join("");

    habits.filter(h => !h.archived).forEach(h => {
      grid.innerHTML += `<div>${h.name}</div>`;
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        grid.innerHTML += `<div class="dot ${h.history[key] ? "done" : ""}"></div>`;
      }
    });

    app.appendChild(grid);
  }

  /* ---------- MONTH ---------- */
  function renderMonth(app) {
    const y = today.getFullYear();
    const m = today.getMonth();

    const firstDay = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();

    const cal = document.createElement("div");
    cal.className = "calendar";

    for (let i = 0; i < (firstDay + 6) % 7; i++) cal.appendChild(document.createElement("div"));

    for (let d = 1; d <= days; d++) {
      const key = new Date(y, m, d).toISOString().slice(0, 10);
      const active = habits.filter(h => !h.archived);
      const done = active.filter(h => h.history[key]).length;
      const pct = active.length ? (done / active.length) * 100 : 0;

      const cell = document.createElement("div");
      cell.className = "day";
      cell.style.background = barColor(pct);
      cell.innerText = d;

      cell.onclick = () => {
        alert(
          `Habits for ${d}/${m+1}/${y}:\n` +
          active.map(h => `${h.name}: ${h.history[key] ? "✅" : "❌"}`).join("\n")
        );
      };

      cal.appendChild(cell);
    }

    app.appendChild(cal);
  }

  /* ---------- MAIN RENDER ---------- */
  function render() {
    appEl.innerHTML = "";
    if (view === "today") renderToday(appEl);
    if (view === "week") renderWeek(appEl);
    if (view === "month") renderMonth(appEl);
  }

  // Expose globally for buttons
  window.setView = setView;
  window.renameHabit = renameHabit;

  render();
});

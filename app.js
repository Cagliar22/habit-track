let view = "today";

const today = new Date().toISOString().slice(0, 10);
document.getElementById("date").innerText = new Date().toDateString();

let habits = JSON.parse(localStorage.getItem("habits")) || [
  { id: crypto.randomUUID(), name: "Exercise", history: {} },
  { id: crypto.randomUUID(), name: "Read", history: {} }
];

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function setView(v) {
  view = v;
  render();
}

function toggleHabit(id) {
  const habit = habits.find(h => h.id === id);
  habit.history[today] = !habit.history[today];
  save();
  render();
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (view === "today") {
    habits.forEach(h => {
      const done = h.history[today];
      const div = document.createElement("div");
      div.className = "habit" + (done ? " done" : "");
      div.onclick = () => toggleHabit(h.id);

      div.innerHTML = `
        <div>
          <input value="${h.name}" 
            oninput="renameHabit('${h.id}', this.value)" />
          <div class="progress">
            <div class="progress-fill" style="width:${done ? 100 : 0}%"></div>
          </div>
        </div>
      `;
      app.appendChild(div);
    });
  }

  if (view === "week") {
    habits.forEach(h => {
      let completed = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (h.history[d.toISOString().slice(0,10)]) completed++;
      }
      const div = document.createElement("div");
      div.className = "habit";
      div.innerText = `${h.name}: ${completed}/7`;
      app.appendChild(div);
    });
  }

  if (view === "month") {
    habits.forEach(h => {
      let count = Object.values(h.history).filter(Boolean).length;
      const div = document.createElement("div");
      div.className = "habit";
      div.innerText = `${h.name}: ${count} completions`;
      app.appendChild(div);
    });
  }
}

function renameHabit(id, name) {
  const habit = habits.find(h => h.id === id);
  habit.name = name;
  save();
}

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

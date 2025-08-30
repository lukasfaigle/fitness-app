// =====================
// 1) Stammdaten: Übungen & Muskelgruppen
// =====================
const exercisesDB = [
  { name: "Bankdrücken", muscle: "Brust" },
  { name: "Bankdrücken an der Maschine", muscle: "Brust" },
  { name: "Bankdrücken mit Kurzhanteln", muscle: "Brust" },
  { name: "Fliegende an der Maschine", muscle: "Brust" },
  { name: "Fliegende am Kabelturm", muscle: "Brust" },
  { name: "Squad", muscle: "Beine" },
  { name: "Leg Extension", muscle: "Beine" },
  { name: "Leg Curl", muscle: "Beine" },
  { name: "Waden", muscle: "Beine" },
  { name: "Adduktion", muscle: "Beine" },
  { name: "Abduktion", muscle: "Beine" },
  { name: "Bizepscurls mit Kurzhanteln", muscle: "Arme" },
  { name: "Bizepscurls am Kabelturm", muscle: "Arme" },
  { name: "Hammercurls", muscle: "Arme" },
  { name: "Trizepsdrücken mit Stange", muscle: "Arme" },
  { name: "Trizepsdrücken mit Seil", muscle: "Arme" },
  { name: "Trizepsdrücken Überkopf", muscle: "Arme" },
  { name: "Trizepsdrücken einarmig", muscle: "Arme" },
  { name: "Klimmzüge", muscle: "Rücken" },
  { name: "Latzug", muscle: "Rücken" },
  { name: "Breites Rudern", muscle: "Rücken" },
  { name: "Enges Rudern", muscle: "Rücken" },
  { name: "Schulterdrücken", muscle: "Schultern" },
  { name: "Seitheben an der Maschine", muscle: "Schultern" },
  { name: "Seitheben am Kabelturms", muscle: "Schultern" },
  { name: "Crunches", muscle: "Bauch" }
];
const muscles = [...new Set(exercisesDB.map(e => e.muscle))];

// =====================
// 2) DOM
// =====================
const editMode = document.getElementById("edit-mode");
const trainMode = document.getElementById("train-mode");
const editModeBtn = document.getElementById("edit-mode-btn");
const trainModeBtn = document.getElementById("train-mode-btn");

const planNameInput = document.getElementById("plan-name");
const createPlanBtn = document.getElementById("create-plan");
const muscleSelect = document.getElementById("muscle-group");
const exerciseList = document.getElementById("exercise-list");
const planList = document.getElementById("plan-list");
const savePlanBtn = document.getElementById("save-plan");

const timerDisplay = document.getElementById("timer");
const currentPlanNameDisplay = document.getElementById("current-plan-name");
const trainPlanList = document.getElementById("train-plan-list");
const endTrainingBtn = document.getElementById("end-training");

const historyList = document.getElementById("training-history");

const muscleSelectTrain = document.getElementById("muscle-group-train-select");
const exerciseListTrain = document.getElementById("exercise-list-train-list");

const savedPlansList = document.getElementById("saved-plans");

// =====================
// 3) State
// =====================
let allPlans = JSON.parse(localStorage.getItem("allPlans")) || [];
let currentPlan = { name: "Neues Workout", exercises: [] };
let currentWorkout = currentPlan.exercises;

let trainingTimer = null;
let trainingSeconds = 0;
let trainingHistory = JSON.parse(localStorage.getItem("trainingHistory")) || [];
const restTimers = new Map();
let unsavedChanges = false;

// =====================
// 4) Gespeicherte Trainings rendern
// =====================
function renderSavedPlans() {
  savedPlansList.innerHTML = "";

  if (currentWorkout.length > 0) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${currentPlan.name} (aktuell)</strong>
      <button class="btn small outline" data-start-current>Start</button>`;
    savedPlansList.appendChild(li);
  }

  allPlans.forEach((plan, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${plan.name}</strong>
      <button class="btn small outline" data-preview="${idx}">Vorschau</button>
      <button class="btn small outline" data-start="${idx}">Start</button>
      <button class="btn small outline" data-delete="${idx}">Löschen</button>
    `;
    savedPlansList.appendChild(li);
  });
}

savedPlansList.addEventListener("click", (ev) => {
  const previewBtn = ev.target.closest("[data-preview]");
  if (previewBtn) {
    const idx = parseInt(previewBtn.dataset.preview);
    currentPlan = JSON.parse(JSON.stringify(allPlans[idx]));
    currentWorkout = currentPlan.exercises;
    planNameInput.value = currentPlan.name;
    renderPlanList();
    editMode.style.display = "block";
    trainMode.style.display = "none";
    return;
  }

  const startBtn = ev.target.closest("[data-start]");
  if (startBtn) {
    const idx = parseInt(startBtn.dataset.start);
    currentPlan = JSON.parse(JSON.stringify(allPlans[idx]));
    currentWorkout = currentPlan.exercises;
    currentPlanNameDisplay.textContent = currentPlan.name;
    renderTrainList();
    startTrainingTimer();
    editMode.style.display = "none";
    trainMode.style.display = "block";
    return;
  }

  const delBtn = ev.target.closest("[data-delete]");
  if (delBtn) {
    const idx = parseInt(delBtn.dataset.delete);
    if (confirm("Plan wirklich löschen?")) {
      allPlans.splice(idx, 1);
      localStorage.setItem("allPlans", JSON.stringify(allPlans));
      renderSavedPlans();
    }
  }

  const startCurrent = ev.target.closest("[data-start-current]");
  if (startCurrent) {
    currentPlanNameDisplay.textContent = currentPlan.name;
    renderTrainList();
    startTrainingTimer();
    editMode.style.display = "none";
    trainMode.style.display = "block";
    return;
  }
});

// =====================
// 5) Init
// =====================
function init() {
  muscles.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    muscleSelect.appendChild(opt);
  });
  muscles.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    muscleSelectTrain.appendChild(opt);
  });

  muscleSelect.addEventListener("change", renderExercisePool);

  muscleSelectTrain.addEventListener("change", () => {
    exerciseListTrain.innerHTML = "";
    const muscle = muscleSelectTrain.value;
    const items = muscle ? exercisesDB.filter(e => e.muscle === muscle) : [];
    items.forEach(ex => {
      const li = document.createElement("li");
      li.className = "pool-line";
      li.innerHTML = `
        <div class="pool-left">
          <span class="item-title">${ex.name}</span>
          <span class="item-sub">(${ex.muscle})</span>
        </div>
        <div class="row gap">
          <label class="label">Sätze</label>
          <input type="number" min="1" value="3" class="sets-input"/>
          <button class="btn small add-btn">Hinzufügen</button>
        </div>
      `;
      exerciseListTrain.appendChild(li);

      li.querySelector(".add-btn").addEventListener("click", () => {
        const sets = clampInt(li.querySelector(".sets-input").value, 1, 50);
        addExerciseToPlanTrain(ex.name, sets);
        renderSavedPlans();
      });
    });
  });

  renderExercisePool();
  renderPlanList();
  renderHistory();
  renderSavedPlans();
}
init();

// =====================
// 6) Modus wechseln
// =====================
editModeBtn.addEventListener("click", () => {
  stopTrainingTimer();
  trainMode.style.display = "none";
  editMode.style.display = "block";
});

// =====================
// 7) Plan erstellen / speichern / löschen
// =====================
createPlanBtn.addEventListener("click", () => {
  const name = (planNameInput.value || "").trim();
  if (!name) return alert("Bitte einen Workout-Namen eingeben.");
  currentPlan = { name, exercises: [] };
  currentWorkout = currentPlan.exercises;
  planNameInput.value = "";
  renderPlanList();
  renderSavedPlans();
});

savePlanBtn.addEventListener("click", () => {
  const inputName = (planNameInput.value || "").trim();
  if (!inputName) return alert("Bitte einen Workout-Namen eingeben.");

  currentPlan.name = inputName;
  currentPlan.exercises = JSON.parse(JSON.stringify(currentWorkout));

  const idx = allPlans.findIndex(p => p.name === currentPlan.name);
  if (idx >= 0) {
    allPlans[idx] = currentPlan;
  } else {
    allPlans.push(currentPlan);
  }

  localStorage.setItem("allPlans", JSON.stringify(allPlans));
  renderSavedPlans();
  planNameInput.value = "";
  alert("Plan gespeichert!");
});

// =====================
// 8) Übungen Pool
// =====================
function renderExercisePool() {
  exerciseList.innerHTML = "";
  const muscle = muscleSelect.value;
  const items = muscle ? exercisesDB.filter(e => e.muscle === muscle) : [];
  items.forEach(ex => {
    const li = document.createElement("li");
    li.className = "pool-line";
    const left = document.createElement("div");
    left.className = "pool-left";
    left.innerHTML = `<span class="item-title">${ex.name}</span><span class="item-sub">(${ex.muscle})</span>`;
    const right = document.createElement("div");
    right.className = "row gap";
    right.innerHTML = `<label class="label">Sätze</label><input type="number" min="1" value="3" class="sets-input" /><button class="btn small add-btn">Hinzufügen</button>`;
    li.appendChild(left);
    li.appendChild(right);
    exerciseList.appendChild(li);
    right.querySelector(".add-btn").addEventListener("click", () => {
      const sets = clampInt(right.querySelector(".sets-input").value, 1, 50);
      addExerciseToPlan(ex.name, sets);
      renderSavedPlans();
    });
  });
}

// =====================
// 9) Plan Editor
// =====================
function addExerciseToPlan(name, sets = 3) {
  if (currentWorkout.find(e => e.name === name)) return;
  currentWorkout.push({
    name,
    muscle: exercisesDB.find(e => e.name === name)?.muscle || "",
    rest: 60,
    setDetails: Array.from({ length: sets }, () => ({ reps: 10, weight: 0, done: false }))
  });
  renderPlanList();
}

function addExerciseToPlanTrain(name, sets = 3) {
  if (currentWorkout.find(e => e.name === name)) return;
  currentWorkout.push({
    name,
    muscle: exercisesDB.find(e => e.name === name)?.muscle || "",
    rest: 60,
    setDetails: Array.from({ length: sets }, () => ({ reps: 10, weight: 0, done: false }))
  });
  renderTrainList();
}

// =====================
// 10) Plan Liste rendern
// =====================
function renderPlanList() {
  planList.innerHTML = "";
  currentWorkout.forEach((ex, idx) => {
    const li = document.createElement("li");
    const head = document.createElement("div");
    head.className = "item-head";
    head.innerHTML = `<div class="item-title">${ex.name}</div>
      <div class="row gap">
        <button class="btn small outline" data-action="remove" data-idx="${idx}">Entfernen</button>
      </div>`;
    const row = document.createElement("div");
    row.className = "plan-row";
    row.innerHTML = `<span class="item-sub">Muskel: ${ex.muscle}</span>
      <label class="label">Sätze</label><input type="number" min="1" value="${ex.setDetails.length}" data-action="sets" data-idx="${idx}">
      <label class="label">Reps</label><input type="number" min="1" value="${ex.setDetails[0]?.reps ?? 10}" data-action="reps-template" data-idx="${idx}">
      <label class="label">Gewicht</label><input type="number" min="0" value="${ex.setDetails[0]?.weight ?? 0}" data-action="weight-template" data-idx="${idx}">
      <label class="label">Pause</label><input type="number" min="0" value="${ex.rest}" data-action="rest" data-idx="${idx}">`;
    row.addEventListener("input", (ev) => {
      const t = ev.target;
      const index = parseInt(t.dataset.idx);
      if (t.dataset.action === "sets") resizeSets(currentWorkout[index], clampInt(t.value,1,50));
      else if (t.dataset.action==="reps-template") currentWorkout[index].setDetails.forEach(s=>s.reps=clampInt(t.value,1,999));
      else if (t.dataset.action==="weight-template") currentWorkout[index].setDetails.forEach(s=>s.weight=clampInt(t.value,0,9999));
      else if (t.dataset.action==="rest") currentWorkout[index].rest=clampInt(t.value,0,3600);
      renderPlanList();
    });
    li.appendChild(head);
    li.appendChild(row);
    planList.appendChild(li);
    head.querySelector('[data-action="remove"]').addEventListener("click",()=>{currentWorkout.splice(idx,1); renderPlanList(); renderSavedPlans();});
  });
}

function resizeSets(exercise,newLen){
  const cur=exercise.setDetails.length;
  if(newLen>cur){
    const last=exercise.setDetails[cur-1]||{reps:10,weight:0,done:false};
    while(exercise.setDetails.length<newLen)
      exercise.setDetails.push({reps:last.reps,weight:last.weight,done:false});
  } else if(newLen<cur) exercise.setDetails.length=newLen;
}

// =====================
// 11) Trainingsmodus rendern
// =====================
function renderTrainList() {
  // Alle alten Rest-Timer stoppen
  for (const [, obj] of restTimers) clearInterval(obj.interval);
  restTimers.clear();

  trainPlanList.innerHTML = "";

  currentWorkout.forEach((ex, exIdx) => {
    const li = document.createElement("li");
    li.className = "train-line";

    // Header mit Übungsname, Pause, Entfernen-Button
    const head = document.createElement("div");
    head.className = "train-head";
    head.innerHTML = `
      <div class="item-title">${ex.name}</div>
      <div class="train-controls">
        <span class="item-sub">Pause:</span>
        <input type="number" min="0" value="${ex.rest}" data-train-rest="${exIdx}">
        <button class="btn small outline" data-add-set="${exIdx}">+ Satz</button>
        <button class="btn small outline" data-rem-set="${exIdx}">– Satz</button>
        <button class="btn small outline danger" data-remove-ex="${exIdx}">✖ Entfernen</button>
        <span class="rest-badge" id="rest-badge-${exIdx}" style="display:none;">Rest: <span>0</span>s</span>
      </div>
    `;
    li.appendChild(head);

    // Sätze rendern
    const setsWrap = document.createElement("div");
    setsWrap.className = "sets-wrap";
    setsWrap.dataset.exIndex = exIdx;
    ex.setDetails.forEach((s, setIdx) => {
      const chip = document.createElement("div");
      chip.className = "set-chip" + (s.done ? " done" : "");
      chip.dataset.exIndex = exIdx;
      chip.dataset.setIndex = setIdx;
      chip.innerHTML = `
        <span class="dot"></span>
        <span class="meta">Satz ${setIdx+1}</span>
        <span class="meta">Reps <input type="number" min="1" value="${s.reps}" class="set-reps"/></span>
        <span class="meta">kg <input type="number" min="0" value="${s.weight}" class="set-weight"/></span>
        <button class="btn small chip ${s.done?"success":""}" data-toggle-done>✔</button>
      `;
      setsWrap.appendChild(chip);
    });
    li.appendChild(setsWrap);
    trainPlanList.appendChild(li);
  });
}

// =====================
// Klick-Events im Trainingsmodus
// =====================
trainPlanList.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button");
  if (!btn) return;

  // ✔ Satz erledigt
  if (btn.dataset.toggleDone !== undefined) {
    const chip = btn.closest(".set-chip");
    const exIdx = parseInt(chip.dataset.exIndex);
    const setIdx = parseInt(chip.dataset.setIndex);
    const s = currentWorkout[exIdx].setDetails[setIdx];
    s.done = !s.done;
    chip.classList.toggle("done", s.done);
    btn.classList.toggle("success", s.done);
    if (s.done) startRestTimer(exIdx);
    else if (restTimers.has(exIdx)) {
      clearInterval(restTimers.get(exIdx).interval);
      restTimers.delete(exIdx);
      document.getElementById(`rest-badge-${exIdx}`).style.display="none";
    }
    unsavedChanges = true;
    return;
  }

  // + Satz
  if (btn.dataset.addSet !== undefined) {
    const exIdx = parseInt(btn.dataset.addSet);
    const ex = currentWorkout[exIdx];
    const last = ex.setDetails[ex.setDetails.length-1] || {reps:10, weight:0, done:false};
    ex.setDetails.push({reps:last.reps, weight:last.weight, done:false});
    renderTrainList();
    unsavedChanges = true;
    return;
  }

  // – Satz
  if (btn.dataset.remSet !== undefined) {
    const exIdx = parseInt(btn.dataset.remSet);
    const ex = currentWorkout[exIdx];
    if (ex.setDetails.length>1) ex.setDetails.pop();
    renderTrainList();
    unsavedChanges = true;
    return;
  }

  // ✖ Übung entfernen
  if (btn.dataset.removeEx !== undefined) {
    const exIdx = parseInt(btn.dataset.removeEx);
    if (confirm(`Übung "${currentWorkout[exIdx].name}" wirklich entfernen?`)) {
      currentWorkout.splice(exIdx,1);
      unsavedChanges = true;
      renderTrainList();
      renderPlanList();
    }
    return;
  }
});

// =====================
// Eingaben im Trainingsmodus
// =====================
trainPlanList.addEventListener("input", (ev) => {
  const t = ev.target;
  const chip = t.closest(".set-chip");

  if (chip) {
    const exIdx = parseInt(chip.dataset.exIndex);
    const setIdx = parseInt(chip.dataset.setIndex);

    if (t.classList.contains("set-reps")) currentWorkout[exIdx].setDetails[setIdx].reps = clampInt(t.value,1,999);
    if (t.classList.contains("set-weight")) currentWorkout[exIdx].setDetails[setIdx].weight = clampInt(t.value,0,9999);

    unsavedChanges = true;
    return;
  }

  if (t.matches('[data-train-rest]')) {
    const exIdx = parseInt(t.getAttribute("data-train-rest"));
    currentWorkout[exIdx].rest = clampInt(t.value,0,3600);
    unsavedChanges = true;
  }
});

// =====================
// 12) Timer
// =====================
function startTrainingTimer() {
  stopTrainingTimer();
  trainingSeconds=0;
  trainingTimer = setInterval(()=>{trainingSeconds++; timerDisplay.textContent=formatHMS(trainingSeconds)},1000);
}
function stopTrainingTimer() {
  clearInterval(trainingTimer);
  trainingTimer=null;
}

// Trainingsende
endTrainingBtn.addEventListener("click",()=>{
  stopTrainingTimer();
  if(confirm("Aktuelles Training speichern?")) {
    const snapshot = JSON.parse(JSON.stringify(currentWorkout));
    trainingHistory.push({name:currentPlan.name,exercises:snapshot,timestamp:Date.now()});
    localStorage.setItem("trainingHistory",JSON.stringify(trainingHistory));
    renderHistory();
  }
  alert("Training beendet!");
});

// =====================
// 13) Rest-Timer
// =====================
function startRestTimer(exIdx){
  const rest = clampInt(currentWorkout[exIdx].rest,0,3600);
  if(rest<=0) return;
  if(restTimers.has(exIdx)) clearInterval(restTimers.get(exIdx).interval);
  const badge = document.getElementById(`rest-badge-${exIdx}`);
  badge.style.display="inline-flex";
  const span = badge.querySelector("span");
  let remaining = rest;
  span.textContent = remaining;
  const interval = setInterval(()=>{
    remaining--;
    span.textContent=remaining;
    if(remaining<=0){clearInterval(interval); badge.style.display="none"; restTimers.delete(exIdx);}
  },1000);
  restTimers.set(exIdx,{remaining,interval});
}

// =====================
// 14) Trainingshistorie rendern
// =====================
function renderHistory() {
  historyList.innerHTML = "";
  trainingHistory.forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${h.name}</strong> - ${new Date(h.timestamp).toLocaleString()}`;
    h.exercises.forEach(ex => {
      const details = ex.setDetails.map(s => `${s.reps}x${s.weight}kg`).join(", ");
      li.innerHTML += `<div>${ex.name}: ${details}</div>`;
    });
    historyList.appendChild(li);
  });
}

// =====================
// 15) Helpers
// =====================
function clampInt(v, min, max) {
  v = parseInt(v ?? 0);
  if (isNaN(v)) v = min;
  return Math.max(min, Math.min(max, v));
}

function formatHMS(total) {
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

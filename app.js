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

function checkAllSetsDone() {
  const sets = document.querySelectorAll(".set-chip");
  const doneSets = document.querySelectorAll(".set-chip.done");

  if (sets.length > 0 && sets.length === doneSets.length) {
    endTrainingBtn.disabled = false;   // alle erledigt → Button aktiv
  } else {
    endTrainingBtn.disabled = true;    // noch nicht alle → Button deaktiviert
  }
}

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

    resetWorkoutDoneFlags(); // ← neu hier

    originalPlanSnapshot = JSON.parse(JSON.stringify(currentWorkout));
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
    return;
  }

  const startCurrent = ev.target.closest("[data-start-current]");
  if (startCurrent) {
    // Alle Sätze als unerledigt markieren
    resetWorkoutDoneFlags();


    currentPlanNameDisplay.textContent = currentPlan.name;
    originalPlanSnapshot = JSON.parse(JSON.stringify(currentWorkout));
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

  // Einzelnes Training löschen
  historyList.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-delete-history]");
    if (!btn) return;
    const idx = parseInt(btn.dataset.deleteHistory);
    if (confirm(`Training "${trainingHistory[idx].name}" wirklich löschen?`)) {
      trainingHistory.splice(idx, 1);
      localStorage.setItem("trainingHistory", JSON.stringify(trainingHistory));
      renderHistory();
    }
  });

  // Alle Trainings löschen
  const clearHistoryBtn = document.getElementById("clear-history");
  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Alle abgeschlossenen Trainings wirklich löschen?")) {
      trainingHistory = [];
      localStorage.setItem("trainingHistory", JSON.stringify(trainingHistory));
      renderHistory();
    }
  });


  const toggleHistoryBtn = document.getElementById("toggle-history");
  toggleHistoryBtn.addEventListener("click", () => {
    const historyListEl = document.getElementById("training-history");
    if (historyListEl.style.display === "none") {
      historyListEl.style.display = "block";
      toggleHistoryBtn.textContent = "Abgeschlossene Trainings verbergen";
    } else {
      historyListEl.style.display = "none";
      toggleHistoryBtn.textContent = "Abgeschlossene Trainings anzeigen";
    }
  });

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
  prefillLastTraining(currentWorkout);
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
  // Timer für neue Elemente setzen
  initExerciseTimer();
  enableDragAndDrop();
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

    // Satz erledigen / zurücksetzen
    s.done = !s.done;
    chip.classList.toggle("done", s.done);
    btn.classList.toggle("success", s.done);

    // Timer nur starten, wenn Satz erledigt wird
    if (s.done) {
      startRestTimer(exIdx); // Badge-Timer
      startCentralRestTimer(currentWorkout[exIdx].rest); // zentraler Timer
    } else {
      // Satz wieder abgewählt → Timer stoppen
      if (restTimers.has(exIdx)) {
        clearInterval(restTimers.get(exIdx).interval);
        restTimers.delete(exIdx);
        document.getElementById(`rest-badge-${exIdx}`).style.display = "none";
      }
      clearInterval(centralTimerInterval);
      document.getElementById("central-rest-timer").style.display = "none";
    }

    checkAllSetsDone(); // Button EndTraining aktivieren
    unsavedChanges = true;
    return;
  }

  // + Satz
  else if (btn.dataset.addSet !== undefined) {
    const exIdx = parseInt(btn.dataset.addSet);
    const exercise = currentWorkout[exIdx];
    exercise.setDetails.push({ reps: 10, weight: 0, done: false });
    renderTrainList();
    unsavedChanges = true;
  }

  // – Satz
  else if (btn.dataset.remSet !== undefined) {
    const exIdx = parseInt(btn.dataset.remSet);
    const exercise = currentWorkout[exIdx];
    if (exercise.setDetails.length > 1) {
      exercise.setDetails.pop();
      renderTrainList();
      unsavedChanges = true;
    }
  }

  // ✖ Übung entfernen
  else if (btn.dataset.removeEx !== undefined) {
    const exIdx = parseInt(btn.dataset.removeEx);
    if (confirm(`Übung "${currentWorkout[exIdx].name}" wirklich löschen?`)) {
      currentWorkout.splice(exIdx, 1);
      renderTrainList();
      renderSavedPlans();
      unsavedChanges = true;
    }
  }

});

trainPlanList.addEventListener("input", (ev) => {
  const t = ev.target;

  if (t.matches('[data-train-rest]')) {
    const exIdx = parseInt(t.getAttribute("data-train-rest"));
    const newRest = clampInt(t.value, 0, 3600);
    currentWorkout[exIdx].rest = newRest;
    unsavedChanges = true;

    // Badge-Timer nur aktualisieren, wenn Timer läuft
    if (restTimers.has(exIdx)) {
      restTimers.get(exIdx).remaining = newRest;
      const span = document.querySelector(`#rest-badge-${exIdx} span`);
      if (span) span.textContent = newRest;
    }

    // Zentraler Timer nur anpassen, wenn er gerade läuft
    const centralBadge = document.getElementById("central-rest-timer");
    if (centralBadge.style.display !== "none") {
      startCentralRestTimer(newRest); // Fortschritt zurücksetzen auf neue Pause
    }
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
endTrainingBtn.addEventListener("click", (e) => {
  const allChips = document.querySelectorAll(".set-chip");
  const allDone = allChips.length > 0 && [...allChips].every(chip => chip.classList.contains("done"));

  if (!allDone) {
    alert("⚠️ Bitte schließe erst alle Sätze ab, bevor du das Training beenden kannst!");
    return; // Training nicht beenden
  }

  // ⬇️ Alle Timer stoppen
  stopTrainingTimer();
  clearInterval(centralTimerInterval);
  document.getElementById("central-rest-timer").style.display = "none";
  for (const [, obj] of restTimers) clearInterval(obj.interval);
  restTimers.clear();

  // ⬇️ Änderungen prüfen
  if (workoutHasChanges()) {
    if (confirm("Du hast Änderungen am Plan gemacht. Möchtest du diese Änderungen übernehmen?")) {
      // Änderungen im aktuellen Plan speichern
      currentPlan.exercises = JSON.parse(JSON.stringify(currentWorkout));

      // Plan in allPlans aktualisieren oder hinzufügen
      const idx = allPlans.findIndex(p => p.name === currentPlan.name);
      if (idx >= 0) {
        allPlans[idx] = JSON.parse(JSON.stringify(currentPlan));
      } else {
        allPlans.push(JSON.parse(JSON.stringify(currentPlan)));
      }
      localStorage.setItem("allPlans", JSON.stringify(allPlans));
      renderSavedPlans();
    } else {
      // Änderungen verwerfen → auf Original zurücksetzen
      currentWorkout = JSON.parse(JSON.stringify(originalPlanSnapshot));
    }
  }

  // ⬇️ Training speichern
  if (confirm("Aktuelles Training speichern?")) {
    const snapshot = JSON.parse(JSON.stringify(currentWorkout));
    trainingHistory.push({ name: currentPlan.name, exercises: snapshot, timestamp: Date.now() });
    localStorage.setItem("trainingHistory", JSON.stringify(trainingHistory));
    renderHistory();

  }

  showTrainingSummary(currentWorkout);
  alert("Training beendet!");
  originalPlanSnapshot = null;
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
  trainingHistory.forEach((h, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${h.name}</strong> - ${new Date(h.timestamp).toLocaleString()}
      <button class="btn small danger" data-delete-history="${idx}">Löschen</button>
    `;
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

function prefillLastTraining(workout) {
  workout.forEach(exercise => {
    for (let i = trainingHistory.length - 1; i >= 0; i--) {
      const lastWorkout = trainingHistory[i].exercises.find(e => e.name === exercise.name);
      if (lastWorkout) {
        while (exercise.setDetails.length < lastWorkout.setDetails.length) {
          exercise.setDetails.push({ reps: 10, weight: 0, done: false });
        }
        while (exercise.setDetails.length > lastWorkout.setDetails.length) {
          exercise.setDetails.pop();
        }

        exercise.setDetails.forEach((set, idx) => {
          set.reps = lastWorkout.setDetails[idx]?.reps ?? set.reps;
          set.weight = lastWorkout.setDetails[idx]?.weight ?? set.weight;
          set.done = false; // wichtig: Sätze sind zu Beginn unerledigt
        });

        exercise.rest = lastWorkout.rest ?? exercise.rest;
        break;
      }
    }
  });
}


document.getElementById("end-training").addEventListener("click", (e) => {
  const allChips = document.querySelectorAll(".set-chip");
  const allDone = allChips.length > 0 && [...allChips].every(chip => chip.classList.contains("done"));

  if (!allDone) {
    alert("⚠️ Bitte schließe erst alle Sätze ab, bevor du das Training beenden kannst!");
    return; // Training nicht beenden
  }

  // ✅ Alle Sätze erledigt → Training wirklich beenden
  console.log("Training erfolgreich beendet!");
  // hier dein Code z.B. Training speichern oder Ansicht wechseln
});

let timerInterval;
let currentTimer = null;

const pauseTimer = document.getElementById('pauseTimer');
const progressBar = document.getElementById('progress');

// Angenommen, deine Übungen im Trainingsmodus sind Listenelemente
function initExerciseTimer() {
  const exercises = document.querySelectorAll('#train-plan-list li');

  exercises.forEach(exercise => {
    exercise.removeEventListener('click', exercise._timerClick); // vorheriger Listener entfernen

    const handler = () => {
      const time = parseInt(exercise.dataset.time) || 5;

      if (currentTimer) {
        clearInterval(timerInterval);
        progressBar.style.width = '0%';
        pauseTimer.style.display = 'none';
      }

      pauseTimer.style.display = 'block';
      let elapsed = 0;
      currentTimer = exercise;

      timerInterval = setInterval(() => {
        elapsed += 0.1;
        const percent = (elapsed / time) * 100;
        progressBar.style.width = Math.min(percent, 100) + '%';

        if (elapsed >= time) {
          clearInterval(timerInterval);
          pauseTimer.style.display = 'none';
          currentTimer = null;
        }
      }, 100);
    };

    exercise.addEventListener('click', handler);
    exercise._timerClick = handler; // für zukünftiges Entfernen speichern
  });
}

// =====================
// Neuer zentraler Rest-Timer
// =====================
let centralTimerInterval = null;

function startCentralRestTimer(seconds) {
  clearInterval(centralTimerInterval);

  const timerContainer = document.getElementById("central-rest-timer");
  const progressBar = document.getElementById("central-progress");

  timerContainer.style.display = "block";
  progressBar.style.width = "0%";

  let elapsed = 0;
  const total = clampInt(seconds, 0, 3600);

  centralTimerInterval = setInterval(() => {
    elapsed += 0.1;
    const percent = (elapsed / total) * 100;
    progressBar.style.width = Math.min(percent, 100) + "%";

    if (elapsed >= total) {
      clearInterval(centralTimerInterval);
      progressBar.style.width = "100%";
      timerContainer.style.display = "none"; // Leiste ausblenden, wenn Timer fertig
    }
  }, 100);
}

function workoutHasChanges() {
  if (!originalPlanSnapshot) return false;

  if (currentWorkout.length !== originalPlanSnapshot.length) return true;

  for (let i = 0; i < currentWorkout.length; i++) {
    const origEx = originalPlanSnapshot[i];
    const currEx = currentWorkout[i];

    if (origEx.name !== currEx.name) return true;
    if (origEx.setDetails.length !== currEx.setDetails.length) return true;

    for (let j = 0; j < currEx.setDetails.length; j++) {
      const origSet = origEx.setDetails[j];
      const currSet = currEx.setDetails[j];
      if (origSet.reps !== currSet.reps) return true;
      if (origSet.weight !== currSet.weight) return true;
    }

    if (origEx.rest !== currEx.rest) return true;
  }

  return false;
}

function showTrainingSummary(workout) {
  // Overlay oder Modal erstellen
  const modal = document.createElement("div");
  modal.id = "training-summary";
  modal.style = `
    position: fixed;
    top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.8);
    color: white;
    display:flex;
    flex-direction: column;
    justify-content:center;
    align-items:center;
    z-index: 1000;
  `;

  const container = document.createElement("div");
  container.style = "background:#222; padding:20px; border-radius:10px; max-width:500px; width:90%; text-align:left;";

  let html = `<h2>Trainingszusammenfassung</h2>`;
  workout.forEach(ex => {
    const setsSummary = ex.setDetails.map(s => `${s.reps}x${s.weight}kg${s.done ? " ✔" : ""}`).join(", ");
    html += `<p><strong>${ex.name}</strong>: ${setsSummary}</p>`;
  });

  html += `<button id="close-summary" style="margin-top:10px; padding:5px 10px;">Zurück zum Hauptmenü</button>`;

  container.innerHTML = html;
  modal.appendChild(container);
  document.body.appendChild(modal);

  document.getElementById("close-summary").addEventListener("click", () => {
    modal.remove();
    // Automatisch ins Bearbeitungs-/Hauptmenü zurück
    stopTrainingTimer();
    trainMode.style.display = "none";
    editMode.style.display = "block";
  });
}

function resetWorkoutDoneFlags() {
  currentWorkout.forEach(exercise => {
    exercise.setDetails.forEach(set => set.done = false);
  });
}

function enableDragAndDrop() {
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.innerHTML);
    this.classList.add("dragging");
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  function handleDragEnter() {
    this.classList.add("over");
  }

  function handleDragLeave() {
    this.classList.remove("over");
  }

  function handleDrop(e) {
    e.stopPropagation();

    if (dragSrcEl !== this) {
      const fromIdx = parseInt(dragSrcEl.dataset.exIndex);
      const toIdx = parseInt(this.dataset.exIndex);

      const moved = currentWorkout.splice(fromIdx, 1)[0];
      currentWorkout.splice(toIdx, 0, moved);

      renderTrainList();  // UI neu rendern
      unsavedChanges = true;
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove("dragging");
    trainPlanList.querySelectorAll(".train-line").forEach(item => item.classList.remove("over"));
  }

  const items = trainPlanList.querySelectorAll(".train-line");
  items.forEach((item, idx) => {
    item.setAttribute("draggable", "true");
    item.dataset.exIndex = idx;

    // alte Listener entfernen
    item.replaceWith(item.cloneNode(true));
  });

  // Neu binden
  trainPlanList.querySelectorAll(".train-line").forEach(item => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  });
}



// ====== 16) Trainingsmodus/Bearbeitungsmodus: Übungen sortieren ======

const sortModal = document.getElementById("sort-modal");
const sortList = document.getElementById("sort-list");
const openSortBtnEdit = document.getElementById("open-sort-btn-edit");
const openSortBtnTrain = document.getElementById("open-sort-btn-train");
const sortSaveBtn = document.getElementById("sort-save-btn");
const sortCancelBtn = document.getElementById("sort-cancel-btn");

// Modal initial ausblenden
sortModal.style.display = "none";

// Funktion zum Öffnen des Modals
function openSortModal() {
  if (!currentWorkout || currentWorkout.length === 0) {
    alert("Keine Übungen zum Sortieren!");
    return;
  }

  sortList.innerHTML = "";

  currentWorkout.forEach((ex, idx) => {
    const li = document.createElement("li");
    li.textContent = ex.name;
    li.dataset.idx = idx;  // ← hier wichtig
    li.style.padding = "8px";
    li.style.border = "1px solid #ccc";
    li.style.marginBottom = "4px";
    li.style.cursor = "move";
    li.draggable = true;
    sortList.appendChild(li);
  });

  enableSortDragAndDrop();
  sortModal.style.display = "flex";
}

// EventListener für beide Buttons
document.addEventListener("DOMContentLoaded", () => {
  const openSortBtnEdit = document.getElementById("open-sort-btn-edit");
  const openSortBtnTrain = document.getElementById("open-sort-btn-train");

  openSortBtnEdit.addEventListener("click", openSortModal);
  openSortBtnTrain.addEventListener("click", openSortModal);
});


// Speichern
sortSaveBtn.addEventListener("click", () => {
  const newOrder = Array.from(sortList.children).map(li => currentWorkout[parseInt(li.dataset.idx)]);
  currentWorkout = newOrder;
  renderTrainList(); // Trainingsliste neu rendern
  sortModal.style.display = "none";
});

// Abbrechen
sortCancelBtn.addEventListener("click", () => {
  sortModal.style.display = "none";
});

// Drag&Drop für Modal
function enableSortDragAndDrop() {
  let dragSrc = null;
  let placeholder = document.createElement("li");
  placeholder.className = "placeholder";
  placeholder.style.height = "40px";
  placeholder.style.border = "2px dashed #aaa";
  placeholder.style.marginBottom = "4px";

  function handleDragStart(e) {
    dragSrc = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
    this.style.opacity = "0.5";
  }

  function handleDragOver(e) {
    e.preventDefault();
    const rect = this.getBoundingClientRect();
    const offset = e.clientY - rect.top;

    if (offset > rect.height / 2) {
      sortList.insertBefore(placeholder, this.nextSibling);
    } else {
      sortList.insertBefore(placeholder, this);
    }
    return false;
  }

  function handleDrop(e) {
    e.stopPropagation();
    if (dragSrc !== this) {
      sortList.insertBefore(dragSrc, placeholder);
      placeholder.remove();

      // Indizes aktualisieren
      Array.from(sortList.children).forEach((li, idx) => li.dataset.idx = idx);

      // WICHTIG: Events neu binden nach DOM-Update
      enableSortDragAndDrop();
    }
    return false;
  }

  function handleDragEnd() {
    this.style.opacity = "1";
    placeholder.remove();
  }

  Array.from(sortList.children).forEach(item => {
    item.draggable = true;
    item.removeEventListener("dragstart", handleDragStart);
    item.removeEventListener("dragover", handleDragOver);
    item.removeEventListener("drop", handleDrop);
    item.removeEventListener("dragend", handleDragEnd);

    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  });
}

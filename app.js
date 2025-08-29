const exercises = ["Push-Ups", "Squats", "Plank", "Burpees", "Lunges", "Sit-Ups"];

function generatePlan() {
  const plan = document.getElementById("plan");
  plan.innerHTML = "";
  
  for (let i = 0; i < 3; i++) {
    const ex = exercises[Math.floor(Math.random() * exercises.length)];
    const li = document.createElement("li");
    li.textContent = ex;
    plan.appendChild(li);
  }
}

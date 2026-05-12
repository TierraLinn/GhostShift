const player = document.getElementById("demoPlayer");
const skipButton = document.getElementById("ghostshift-demo-skip");
const status = document.getElementById("demoStatus");
const label = document.getElementById("demoLabel");
const time = document.getElementById("demoTime");
const progress = document.getElementById("demoProgress");
const restart = document.getElementById("restartDemo");

let seconds = 5;
let timer = null;

function completeSkip(source = "manual") {
  player.classList.remove("ghostshift-demo-ad");
  player.classList.add("skipped");
  label.textContent = "Main video playing";
  status.textContent = source === "extension" ? "GhostShift auto-skipped the ad." : "Ad skipped.";
  time.textContent = "Main video";
  progress.style.width = "100%";
  clearInterval(timer);
}

function startDemo() {
  seconds = 5;
  player.classList.add("ghostshift-demo-ad");
  player.classList.remove("skipped");
  label.textContent = "Sponsored break";
  status.textContent = "Ad running. GhostShift should click Skip Ad automatically.";
  skipButton.style.display = "";
  time.textContent = "Ad break: 5s";
  progress.style.width = "0%";
  clearInterval(timer);
  timer = setInterval(() => {
    seconds -= 1;
    time.textContent = `Ad break: ${Math.max(seconds, 0)}s`;
    progress.style.width = `${(5 - seconds) * 20}%`;
    if (seconds <= 0) completeSkip("timeout");
  }, 1000);
}

skipButton.addEventListener("click", () => completeSkip("extension"));
restart.addEventListener("click", startDemo);

startDemo();

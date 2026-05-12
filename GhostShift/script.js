const buttons = document.querySelectorAll(".icon-button");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

const mobileToggle = document.querySelector("[data-mobile-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

mobileToggle?.addEventListener("click", () => {
  mobileMenu?.classList.toggle("open");
});

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === tab);
    });
  });
});

function setupLandingDemo() {
  const demo = document.querySelector("[data-landing-demo]");
  if (!demo) return;

  const skipButton = demo.querySelector("[data-demo-skip]");
  const resetButton = demo.querySelector("[data-demo-reset]");
  const status = demo.querySelector("[data-demo-status]");
  const meter = demo.querySelector("[data-demo-meter]");
  const chip = demo.querySelector("[data-demo-chip]");
  let timer = null;
  let progress = 22;

  function setProgress(value) {
    progress = Math.min(100, Math.max(0, value));
    meter.style.width = `${progress}%`;
  }

  function startScan() {
    clearInterval(timer);
    demo.classList.remove("skipped");
    skipButton.classList.add("pulse-target");
    skipButton.textContent = "Skip Ad";
    chip.textContent = "Sponsored break detected";
    status.textContent = "Scanning for visible skip button...";
    meter.style.background = "var(--clean-blue)";
    setProgress(22);
    timer = setInterval(() => {
      setProgress(progress + 13);
      if (progress >= 78) completeSkip("GhostShift auto-clicked the visible skip button.");
    }, 700);
  }

  function completeSkip(message = "Ad skipped.") {
    clearInterval(timer);
    demo.classList.add("skipped");
    skipButton.classList.remove("pulse-target");
    skipButton.textContent = "Skipped";
    chip.textContent = "Main video playing";
    status.textContent = message;
    meter.style.background = "var(--clean-green)";
    setProgress(100);
  }

  skipButton.addEventListener("click", () => completeSkip("You clicked it manually. GhostShift would do this automatically."));
  resetButton.addEventListener("click", startScan);
  startScan();
}

function setupTiltCards() {
  const cards = document.querySelectorAll(".stats-grid article, .install-card, .feature-card, .platform-matrix article, .pricing-clean-grid article");

  cards.forEach((card) => {
    card.classList.add("tilting");
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-3px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

setupLandingDemo();
setupTiltCards();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The static file still works if service worker registration is unavailable.
    });
  });
}

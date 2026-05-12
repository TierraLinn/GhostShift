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

function setupInteractiveGhostDemo() {
  const demo = document.querySelector('.interactive-ghost-demo');
  if (!demo) return;

  const ghosts = document.querySelectorAll('.interactive-ghost');
  const portal = document.querySelector('.dimensional-portal');
  const banishableAd = document.querySelector('.banishable-ad');
  const ghostCursor = document.querySelector('.ghost-cursor');
  const adsBanishedEl = document.querySelector('[data-ads-banished]');
  const portalPowerEl = document.querySelector('[data-portal-power]');

  let adsBanished = 0;
  let portalPower = 87;
  let mouseX = 0;
  let mouseY = 0;

  // Track mouse movement for ghost cursor
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (ghostCursor) {
      ghostCursor.style.left = mouseX + 'px';
      ghostCursor.style.top = mouseY + 'px';
    }
  });

  // Interactive ghost behavior
  ghosts.forEach((ghost, index) => {
    let isFollowing = false;
    let followSpeed = 0.05 + (index * 0.01);

    ghost.addEventListener('click', () => {
      if (!isFollowing) {
        // Start following mouse
        isFollowing = true;
        ghost.style.animation = 'none';
        ghost.classList.add('following');

        // Create particle trail effect
        createParticleTrail(ghost);
      } else {
        // Stop following and resume floating
        isFollowing = false;
        ghost.classList.remove('following');
        ghost.style.animation = '';
      }
    });

    // Continuous following logic
    function updateGhostPosition() {
      if (isFollowing) {
        const ghostRect = ghost.getBoundingClientRect();
        const ghostCenterX = ghostRect.left + ghostRect.width / 2;
        const ghostCenterY = ghostRect.top + ghostRect.height / 2;

        const deltaX = mouseX - ghostCenterX;
        const deltaY = mouseY - ghostCenterY;

        const newX = ghostRect.left + deltaX * followSpeed;
        const newY = ghostRect.top + deltaY * followSpeed;

        ghost.style.left = newX + 'px';
        ghost.style.top = newY + 'px';
        ghost.style.transform = `rotate(${Math.atan2(deltaY, deltaX) * 180 / Math.PI}deg)`;
      }
      requestAnimationFrame(updateGhostPosition);
    }
    updateGhostPosition();
  });

  // Portal interaction
  if (portal) {
    portal.addEventListener('click', () => {
      portalPower = Math.min(100, portalPower + 10);
      updatePortalPower();

      // Create portal energy burst
      createPortalBurst(portal);
    });
  }

  // Banishable ad interaction
  if (banishableAd) {
    const skipBtn = banishableAd.querySelector('[data-skip-trigger]');

    skipBtn.addEventListener('click', () => {
      banishableAd.classList.add('banished');

      // Increase banished count
      adsBanished++;
      updateAdsBanished();

      // Boost portal power
      portalPower = Math.min(100, portalPower + 5);
      updatePortalPower();

      // Create banishment effect
      createBanishmentEffect(banishableAd);

      // Respawn ad after 5 seconds
      setTimeout(() => {
        banishableAd.classList.remove('banished');
      }, 5000);
    });
  }

  function updateAdsBanished() {
    if (adsBanishedEl) {
      adsBanishedEl.textContent = adsBanished;
    }
  }

  function updatePortalPower() {
    if (portalPowerEl) {
      portalPowerEl.textContent = portalPower;
    }
  }

  function createParticleTrail(ghost) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'ghost-trail-particle';
        particle.style.left = ghost.style.left;
        particle.style.top = ghost.style.top;
        particle.style.background = `rgba(${Math.random() * 255}, ${Math.random() * 255}, 255, 0.6)`;
        demo.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 1000);
      }, i * 100);
    }
  }

  function createPortalBurst(portal) {
    const burst = document.createElement('div');
    burst.className = 'portal-burst';
    burst.style.position = 'absolute';
    burst.style.left = '50%';
    burst.style.top = '50%';
    burst.style.transform = 'translate(-50%, -50%)';
    burst.style.width = '200px';
    burst.style.height = '200px';
    burst.style.border = '2px solid var(--portal-cyan)';
    burst.style.borderRadius = '50%';
    burst.style.animation = 'portal-burst 0.5s ease-out';
    portal.appendChild(burst);

    setTimeout(() => {
      burst.remove();
    }, 500);
  }

  function createBanishmentEffect(ad) {
    const effect = document.createElement('div');
    effect.className = 'banishment-effect';
    effect.style.position = 'absolute';
    effect.style.left = '50%';
    effect.style.top = '50%';
    effect.style.transform = 'translate(-50%, -50%)';
    effect.style.width = '300px';
    effect.style.height = '300px';
    effect.style.background = 'radial-gradient(circle, rgba(255, 0, 0, 0.3), transparent)';
    effect.style.borderRadius = '50%';
    effect.style.animation = 'banishment-wave 0.8s ease-out';
    ad.appendChild(effect);

    setTimeout(() => {
      effect.remove();
    }, 800);
  }

  // Add CSS for dynamic effects
  const style = document.createElement('style');
  style.textContent = `
    .ghost-trail-particle {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      pointer-events: none;
      animation: particle-fade 1s ease-out;
      z-index: 5;
    }

    @keyframes particle-fade {
      0% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.5); }
    }

    @keyframes portal-burst {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }

    @keyframes banishment-wave {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
    }

    .interactive-ghost.following {
      box-shadow: 0 0 30px var(--ghost-glow);
    }

    .interactive-ghost.following .ghost-body {
      animation: ghost-follow-glow 0.5s ease-in-out infinite alternate;
    }

    @keyframes ghost-follow-glow {
      0% { box-shadow: 0 0 20px rgba(221, 160, 221, 0.8); }
      100% { box-shadow: 0 0 40px rgba(221, 160, 221, 1); }
    }
  `;
  document.head.appendChild(style);
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
setupInteractiveGhostDemo();
setupGlobalPageMotion();
setupGhostClickRipples();

function setupGlobalPageMotion() {
  const root = document.documentElement;
  document.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 8;
    const y = (event.clientY / window.innerHeight - 0.5) * 8;
    root.style.setProperty("--pointer-x", `${x}`);
    root.style.setProperty("--pointer-y", `${y}`);
  });

  const hoverItems = document.querySelectorAll(
    ".hero-cta-row a, .ghost-button, .outline-ghost-button, .hero-chip, .status-pill, .install-card, .feature-card, .stats-grid article, .compat-row span"
  );

  hoverItems.forEach((item) => {
    item.addEventListener("pointerenter", () => {
      item.style.transform = "translateY(-2px) scale(1.01)";
      item.style.boxShadow = "0 20px 55px rgba(94, 234, 212, 0.2)";
    });
    item.addEventListener("pointerleave", () => {
      item.style.transform = "";
      item.style.boxShadow = "";
    });
  });
}

function setupGhostClickRipples() {
  document.body.addEventListener("click", (event) => {
    const target = event.target.closest("a, button, .ghost-button, .outline-ghost-button, .interactive-ghost, .status-pill, .hero-chip");
    if (!target) return;

    const ripple = document.createElement("div");
    ripple.className = "pointer-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 800);
  });
}

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The static file still works if service worker registration is unavailable.
    });
  });
}

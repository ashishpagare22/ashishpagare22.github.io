const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initScrollProgress();
  initScrollButtons();
  initRevealOnScroll();
  initCounters();
  initTabs();
  initProjectFilters();
  initCertificationFilters();
  initCopyButtons();
  initBackToTop();
});

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav-links");

  if (!toggle || !nav) {
    return;
  }

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
  });

  document.addEventListener("click", (event) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    if (isOpen && !event.target.closest(".nav-bar")) {
      closeMenu();
    }
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closeMenu();
    }
  });
}

function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress__bar");

  if (!bar) {
    return;
  }

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
    bar.style.width = `${Math.min(progress, 100)}%`;
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

function initScrollButtons() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });
}

function initRevealOnScroll() {
  const elements = document.querySelectorAll(
    ".panel, .card, .metric-card, .contact-card, .section-head, .timeline-card, .filter-panel"
  );

  if (!elements.length) {
    return;
  }

  elements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 240)}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");

  if (!counters.length) {
    return;
  }

  const animateCounter = (counter) => {
    if (counter.dataset.animated === "true") {
      return;
    }

    counter.dataset.animated = "true";

    const target = Number(counter.dataset.count);

    if (!Number.isFinite(target)) {
      return;
    }

    if (prefersReducedMotion) {
      counter.textContent = String(target);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.round(target * eased));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        counter.textContent = String(target);
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.7 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function initTabs() {
  document.querySelectorAll("[data-tab-scope]").forEach((scope) => {
    const buttons = scope.querySelectorAll("[data-tab-target]");
    const panels = scope.querySelectorAll(".tab-panel");

    if (!buttons.length || !panels.length) {
      return;
    }

    const activate = (button) => {
      const targetId = button.dataset.tabTarget;

      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
        item.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => activate(button));
      button.addEventListener("keydown", (event) => {
        const index = Array.from(buttons).indexOf(button);
        let nextIndex = index;

        if (event.key === "ArrowRight") {
          nextIndex = (index + 1) % buttons.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + buttons.length) % buttons.length;
        } else {
          return;
        }

        event.preventDefault();
        buttons[nextIndex].focus();
        activate(buttons[nextIndex]);
      });
    });

    activate(scope.querySelector(".tab-pill.is-active") || buttons[0]);
  });
}

function initProjectFilters() {
  const buttons = document.querySelectorAll("[data-project-filter]");
  const items = document.querySelectorAll("[data-project-item]");
  const status = document.querySelector("[data-project-status]");

  if (!buttons.length || !items.length || !status) {
    return;
  }

  const update = (filter) => {
    let visible = 0;

    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.projectFilter === filter);
    });

    items.forEach((item) => {
      const tags = item.dataset.projectItem.split(" ");
      const matches = filter === "all" || tags.includes(filter);
      item.hidden = !matches;

      if (matches) {
        visible += 1;
      }
    });

    status.textContent = `Showing ${visible} project${visible === 1 ? "" : "s"} ready for review.`;
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => update(button.dataset.projectFilter));
  });

  update(document.querySelector("[data-project-filter].is-active")?.dataset.projectFilter || "all");
}

function initCertificationFilters() {
  const search = document.querySelector("[data-cert-search]");
  const buttons = document.querySelectorAll("[data-cert-filter]");
  const cards = document.querySelectorAll("[data-cert-card]");
  const total = document.querySelector("[data-cert-count]");
  const emptyState = document.querySelector("[data-cert-empty]");

  if (!search || !buttons.length || !cards.length || !total || !emptyState) {
    return;
  }

  let activeFilter = "all";

  const update = () => {
    const query = search.value.trim().toLowerCase();
    let visibleItems = 0;

    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.certFilter === activeFilter);
    });

    cards.forEach((card) => {
      const categoryMatches = activeFilter === "all" || card.dataset.certCategory === activeFilter;
      const items = card.querySelectorAll("[data-cert-item]");
      let cardVisibleCount = 0;

      items.forEach((item) => {
        const matchesQuery = !query || item.textContent.toLowerCase().includes(query);
        const isVisible = categoryMatches && matchesQuery;
        item.hidden = !isVisible;

        if (isVisible) {
          cardVisibleCount += 1;
          visibleItems += 1;
        }
      });

      const countLabel = card.querySelector("[data-cert-card-count]");
      if (countLabel) {
        countLabel.textContent = `${cardVisibleCount} ${cardVisibleCount === 1 ? "item" : "items"}`;
      }

      card.hidden = cardVisibleCount === 0;
    });

    total.textContent = String(visibleItems);
    emptyState.hidden = visibleItems !== 0;
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.certFilter;
      update();
    });
  });

  search.addEventListener("input", update);
  update();
}

function initCopyButtons() {
  const note = document.querySelector(".floating-note");

  if (!note) {
    return;
  }

  document.querySelectorAll("[data-copy-value]").forEach((button) => {
    const originalText = button.textContent;

    button.addEventListener("click", async () => {
      const value = button.dataset.copyValue;
      const label = button.dataset.copyLabel || "Item";
      const success = await copyText(value);

      button.textContent = success ? "Copied" : "Try Again";
      showFloatingNote(note, success ? `${label} copied.` : `Could not copy ${label.toLowerCase()}.`);

      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1600);
    });
  });
}

async function copyText(value) {
  if (!value) {
    return false;
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      return fallbackCopy(value);
    }
  }

  return fallbackCopy(value);
}

function fallbackCopy(value) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();

  let success = false;

  try {
    success = document.execCommand("copy");
  } catch (error) {
    success = false;
  }

  document.body.removeChild(textArea);
  return success;
}

function showFloatingNote(note, message) {
  note.textContent = message;
  note.classList.add("is-visible");

  window.clearTimeout(showFloatingNote.timeoutId);
  showFloatingNote.timeoutId = window.setTimeout(() => {
    note.classList.remove("is-visible");
  }, 1800);
}

function initBackToTop() {
  const button = document.querySelector(".back-to-top");

  if (!button) {
    return;
  }

  const updateVisibility = () => {
    button.classList.toggle("is-visible", window.scrollY > 520);
  };

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
}

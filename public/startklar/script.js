const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const revealItems = document.querySelectorAll(".reveal");
const form = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const scrollProgress = document.querySelector("[data-scroll-progress]");
const magneticItems = document.querySelectorAll(".button");
const sectionNavLinks = Array.from(document.querySelectorAll('.nav-links a:not(.nav-cta)[href^="#"]'));
const linkedSections = sectionNavLinks
  .map((link) => ({ link, section: document.querySelector(link.hash) }))
  .filter(({ section }) => section);
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(pointer: fine)");

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};

const setScrollProgress = () => {
  if (!scrollProgress) return;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  scrollProgress.style.setProperty("--progress", String(progress));
};

const setActiveNavLink = () => {
  if (!linkedSections.length) return;

  const offset = window.scrollY + (header?.offsetHeight ?? 0) + 120;
  const current = [...linkedSections]
    .sort((a, b) => a.section.offsetTop - b.section.offsetTop)
    .reduce((active, item) => {
      return item.section.offsetTop <= offset ? item : active;
    }, null);

  sectionNavLinks.forEach((link) => {
    const isActive = Boolean(current && link === current.link);
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

setHeaderState();
setScrollProgress();
setActiveNavLink();
window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("scroll", setScrollProgress, { passive: true });
window.addEventListener("scroll", setActiveNavLink, { passive: true });
window.addEventListener("resize", () => {
  setScrollProgress();
  setActiveNavLink();
});

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Menü öffnen" : "Menü schließen");
  navLinks?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("nav-open", !isOpen);
});

navLinks?.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) return;
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Menü öffnen");
  navLinks.classList.remove("is-open");
  document.body.classList.remove("nav-open");
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min((index % 5) * 70, 280)}ms`);
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

magneticItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    if (reduceMotionQuery.matches || !finePointerQuery.matches) return;

    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    item.style.setProperty("--tx", `${((x / rect.width) - .5) * 8}px`);
    item.style.setProperty("--ty", `${((y / rect.height) - .5) * 8}px`);
  });

  item.addEventListener("pointerleave", () => {
    item.style.removeProperty("--tx");
    item.style.removeProperty("--ty");
  });
});

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbyt6U_ZzE9dmAhUXWUNK4QFxq01YywohyLyogG7Bb0kzT9sSR2PHVCjONyILhF5qqjEkw/exec";

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const payload = {
    name:         String(formData.get("name") || "").trim(),
    organisation: String(formData.get("organisation") || "").trim(),
    email:        String(formData.get("email") || "").trim(),
    phone:        String(formData.get("phone") || "").trim(),
    needs:        formData.getAll("need").map(String).join(", ") || "Nicht angegeben",
    message:      String(formData.get("message") || "").trim(),
  };

  const submitBtn = form.querySelector("button[type=submit]");
  if (submitBtn) submitBtn.disabled = true;
  if (formStatus) formStatus.textContent = "Wird gesendet…";

  try {
    await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (formStatus) formStatus.textContent = "Vielen Dank! Wir melden uns bald bei Ihnen.";
    form.reset();
  } catch {
    if (formStatus) formStatus.textContent = "Etwas hat nicht geklappt – schreiben Sie gerne direkt an info@atnovo.com.";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

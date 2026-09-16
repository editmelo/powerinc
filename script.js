(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  // Clean URLs (/about, /programs, ...) map to sections on this one page.
  // vercel.json rewrites these paths to index.html so direct visits and refreshes work.
  var SECTIONS = ["about", "programs", "board", "contact"];

  function sectionFromPath(path) {
    var slug = path.replace(/^\/+|\/+$/g, "").toLowerCase();
    return SECTIONS.indexOf(slug) !== -1 ? slug : null;
  }

  function scrollToSection(id, smooth) {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var behavior = smooth && !reduce ? "smooth" : "auto";
    if (!id) {
      window.scrollTo({ top: 0, behavior: behavior });
      return;
    }
    var target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: behavior, block: "start" });
  }

  // Mobile menu
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Intercept in-page links so they scroll instead of reloading
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.origin !== location.origin) return;

    var id = sectionFromPath(link.pathname);
    if (!id && link.pathname !== "/") return;

    e.preventDefault();
    setMenu(false);
    var url = id ? "/" + id : "/";
    if (location.pathname !== url) history.pushState({ section: id }, "", url);
    scrollToSection(id, true);
  });

  window.addEventListener("popstate", function () {
    scrollToSection(sectionFromPath(location.pathname), true);
  });

  // We handle scroll position ourselves so Back/Forward land on the right section
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  // Arriving directly on /programs etc. Keep the section aligned while fonts
  // and images finish loading, until the visitor starts scrolling on their own.
  var initial = sectionFromPath(location.pathname);
  if (initial) {
    var align = function () { scrollToSection(initial, false); };
    var stop = function () {
      if (resizeWatch) resizeWatch.disconnect();
      ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (evt) {
        window.removeEventListener(evt, stop);
      });
    };
    var resizeWatch = "ResizeObserver" in window ? new ResizeObserver(align) : null;

    align();
    if (resizeWatch) resizeWatch.observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
    window.addEventListener("load", function () {
      align();
      setTimeout(stop, 2500);
    });
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (evt) {
      window.addEventListener(evt, stop, { passive: true });
    });
  }

  // Header border once the page scrolls
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Highlight the nav link for the section in view
  if ("IntersectionObserver" in window) {
    var navLinks = nav.querySelectorAll("a[href]");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle("is-active", sectionFromPath(l.pathname) === entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    document.querySelectorAll("main section[id]").forEach(function (s) { observer.observe(s); });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();

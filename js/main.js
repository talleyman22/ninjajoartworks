document.querySelectorAll(".nav a").forEach((link) => {
  if (link.pathname === window.location.pathname) {
    link.classList.add("active");
  }
});
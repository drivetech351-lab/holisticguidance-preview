(function () {
  var fades = document.querySelectorAll('.fade');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    fades.forEach(function (el) { io.observe(el); });
  } else {
    fades.forEach(function (el) { el.classList.add('in'); });
  }

  var links = document.querySelectorAll('.nav ul a');
  var sections = Array.prototype.map.call(links, function (a) {
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return null;
    return document.querySelector(href);
  });
  function highlight() {
    var y = window.scrollY + 120, current = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) current = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }
  window.addEventListener('scroll', highlight, { passive: true });
  highlight();
})();

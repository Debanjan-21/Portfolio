// ----------------------------------------------------
// Translucent Loader Lifecycle Control Engine (2800ms)
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loading-screen");
  
  if (loadingScreen) {
    window.setTimeout(() => {
      loadingScreen.classList.add("loader-hidden");
      
      // Completely erase the component layout after transitions finish to free DOM resources
      window.setTimeout(() => {
        loadingScreen.remove();
      }, 1100);
      
    }, 2800);
  }
});

// ----------------------------------------------------
// Core Intersection Observer for Slide reveals
// ----------------------------------------------------
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// stagger children inside grids slightly
document.querySelectorAll('.skills-grid, .projects-grid').forEach(grid => {
  [...grid.children].forEach((child, i) => {
    child.style.transitionDelay = (i * 0.08) + 's';
  });
});

// Section header slide-up reveal
const headerObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    const inner = e.target.querySelector('.header-inner');
    if (!inner) return;
    if (e.isIntersecting) {
      inner.classList.add('in');
    } else {
      inner.classList.remove('in');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section-title').forEach(el => headerObserver.observe(el));



// ----------------------------------------------------
// 3D Tilt Effect on Profile Portrait Card
// ----------------------------------------------------
const profileCard = document.getElementById('profileCard');
const profileWrapper = document.querySelector('.profile-pic-wrapper');

if (profileCard && profileWrapper) {
  profileCard.addEventListener('mousemove', (e) => {
    const rect = profileCard.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;  

    const rotateX = ((y / rect.height) - 0.5) * -28; 
    const rotateY = ((x / rect.width) - 0.5) * 28;

    profileWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  });

  profileCard.addEventListener('mouseleave', () => {
    profileWrapper.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
  });
}


// ----------------------------------------------------
// Smooth Scroll Navigation
// ----------------------------------------------------
function smoothScrollTo(targetY, duration, callback) {
  const startY = window.scrollY;
  const difference = targetY - startY;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const percent = Math.min(progress / duration, 1);

    const easing = percent < 0.5 
      ? 4 * percent * percent * percent 
      : 1 - Math.pow(-2 * percent + 2, 3) / 2;

    window.scrollTo(0, startY + difference * easing);

    if (progress < duration) {
      window.requestAnimationFrame(step);
    } else if (callback) {
      callback();
    }
  }

  window.requestAnimationFrame(step);
}

const navLinks = document.querySelectorAll('.nav-stop-scroll');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      smoothScrollTo(targetEl.offsetTop, 2000);
    }
  });
});

const homeLogos = document.querySelectorAll(".home-logo");
homeLogos.forEach(logo => {
  logo.addEventListener("click", function(e) {
    e.preventDefault();
    smoothScrollTo(0, 2000);
  });
});


// ----------------------------------------------------
// Dynamic Morphing Capsule Nav Scroll Engine
// ----------------------------------------------------
const capsuleNav = document.querySelector(".floating-capsule-nav");
const SCROLL_THRESHOLD = 80;

if (capsuleNav) {
  window.addEventListener("scroll", function() {
    const currentScrollY = window.scrollY;

    if (currentScrollY < SCROLL_THRESHOLD) {
      // Near top: Full navbar is completely expanded
      capsuleNav.classList.remove("nav-collapsed");
    } else {
      // Scrolled down: Collapse to show only the active section name
      capsuleNav.classList.add("nav-collapsed");
    }
  }, { passive: true });
}


// ----------------------------------------------------
// Active Section Tracking Observer
// ----------------------------------------------------
// Match the selector to look for all major layout sections
const sections = document.querySelectorAll("section, header.hero");
const navItems = document.querySelectorAll(".floating-capsule-nav a.nav-stop-scroll");

const activeSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const activeId = entry.target.getAttribute("id") || "hero";
      
      // Reset active classes across all navigation links
      navItems.forEach(link => {
        link.classList.remove("active-nav-link");
        link.parentElement.classList.remove("active-li");
      });

      if (activeId === "hero") {
        return; // Home/Hero doesn't show any active capsule when near top
      }

      // Match the scrolled section id directly to its nav link href target
      const activeLink = document.querySelector(`.floating-capsule-nav a[href="#${activeId}"]`);
      if (activeLink) {
        activeLink.classList.add("active-nav-link");
        activeLink.parentElement.classList.add("active-li");
      }
    }
  });
}, {
  rootMargin: "-25% 0px -55% 0px", // Trigger center point sweep
  threshold: 0
});

sections.forEach(section => activeSectionObserver.observe(section));


// ----------------------------------------------------
// Custom Auto-Typing Code Animation (Sky-blue)
// ----------------------------------------------------
const codeLines = [
  "def init_developer():",
  "    name = 'Debanjan Majumder'",
  "    role = 'Software Developer'",
  "    skills = ['Python', 'C++', 'SQL']",
  "    status = 'Ready to Build'",
  "    print(f'{name} is online...')",
  "init_developer()"
];

let currentLineIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
const animationElement = document.getElementById("codingAnimation");

function typeCode() {
  if (!animationElement) return;

  const currentFullText = codeLines[currentLineIndex];

  if (!isDeleting) {
    animationElement.textContent = currentFullText.substring(0, currentCharIndex + 1);
    currentCharIndex++;

    if (currentCharIndex === currentFullText.length) {
      setTimeout(() => {
        isDeleting = true;
        typeCode();
      }, 2000);
      return;
    }
  } else {
    animationElement.textContent = currentFullText.substring(0, currentCharIndex - 1);
    currentCharIndex--;

    if (currentCharIndex === 0) {
      isDeleting = false;
      currentLineIndex = (currentLineIndex + 1) % codeLines.length;
      setTimeout(typeCode, 500);
      return;
    }
  }

  const speed = isDeleting ? 30 : 65;
  setTimeout(typeCode, speed);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(typeCode, 1500);
});

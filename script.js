/* ============================================
   ARYAN SENIOR SECONDARY SCHOOL - JAVASCRIPT
   Interactive features and animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ===== Preloader =====
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('loaded');
            setTimeout(() => {
                preloader.style.display = 'none';
                // Trigger hero animations after preloader
                document.body.classList.add('loaded');
            }, 600);
        }, 1800);
    });

    // ===== Navbar Scroll =====
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function handleScroll() {
        const scrollY = window.scrollY;

        // Navbar background
        if (scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Back to top button
        if (scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // Active nav link
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // ===== Mobile Nav Toggle =====
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile nav on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close mobile nav on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // ===== Hero Background Slider =====
    const heroSlides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;

    function changeHeroSlide() {
        heroSlides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % heroSlides.length;
        heroSlides[currentSlide].classList.add('active');
    }

    if (heroSlides.length > 1) {
        setInterval(changeHeroSlide, 6000);
    }

    // ===== Hero Particles =====
    const particlesContainer = document.getElementById('heroParticles');

    function createParticles() {
        if (!particlesContainer) return;
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (Math.random() * 10 + 8) + 's';
            particle.style.animationDelay = (Math.random() * 8) + 's';
            particle.style.opacity = Math.random() * 0.5 + 0.2;
            particlesContainer.appendChild(particle);
        }
    }
    createParticles();

    // ===== Counter Animation =====
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number, .counter-number');

        counters.forEach(counter => {
            if (counter.dataset.animated) return;

            const target = parseInt(counter.getAttribute('data-target'));
            if (!target) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !counter.dataset.animated) {
                        counter.dataset.animated = 'true';
                        let current = 0;
                        const increment = target / 60;
                        const duration = 2000;
                        const stepTime = duration / 60;

                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                current = target;
                                clearInterval(timer);
                            }
                            counter.textContent = Math.floor(current);
                        }, stepTime);
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(counter);
        });
    }
    animateCounters();

    // ===== Scroll Animations =====
    function initScrollAnimations() {
        const elements = document.querySelectorAll(
            '.feature-card, .vm-card, .academic-card, .achievement-card, ' +
            '.campus-card, .gallery-item, .contact-card, .counter-item, ' +
            '.about-grid, .achievement-highlight, .contact-form-wrapper'
        );

        elements.forEach(el => {
            el.classList.add('fade-in-up');
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => observer.observe(el));
    }
    initScrollAnimations();

    // ===== Gallery Lightbox =====
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    // ===== Contact Form =====
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Simple visual feedback
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.background = '';
                    contactForm.reset();
                }, 2500);
            }, 1500);
        });
    }

    // ===== Smooth Scroll for anchor links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== Duplicate Marquee Content for seamless loop =====
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) {
        marqueeContent.innerHTML += marqueeContent.innerHTML;
    }

    // ===== Navbar link click-through for .nav-btn =====
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(btn.getAttribute('href'));
            if (target) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                const navHeight = navbar.offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - navHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    console.log('🏫 Aryan Senior Secondary School Website Loaded Successfully!');
    console.log('📍 Dhani Bhakran, Jhumpa (Bhiwani), Haryana');
    console.log('🪔 तमसो मा ज्योतिर्गमय — Lead me from darkness to light');
});

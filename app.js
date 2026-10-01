document.addEventListener('DOMContentLoaded', async () => {
    // URL Parameter Parsing / Backend Token Verification Hook
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const greetingHeader = document.getElementById('guestGreeting');

    const API_BASE_URL = 'https://launchpad-core-api.onrender.com';

    if (token && greetingHeader) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/event-hq/invite/verify-token/${token}`);
            const result = await response.json();
            if (result.success && result.data.guestName) {
                greetingHeader.textContent = `Welcome, ${result.data.guestName}`;
            } else {
                greetingHeader.textContent = "Honored Guest";
            }
        } catch (err) {
            console.error("Token verification fault:", err);
            greetingHeader.textContent = "Honored Guest";
        }
    }

    // Initialize Modules
    if (typeof RSVPController !== 'undefined') new RSVPController(token, API_BASE_URL);
    if (typeof GalleryModule !== 'undefined') new GalleryModule();
    if (typeof PetalEngine !== 'undefined') new PetalEngine();

    // Preloader Dismissal
    const preloader = document.getElementById('appPreloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.remove(), 800);
            }, 600);
        });
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 900, once: true, offset: 40 });
    }

    // Unlock Passport Trigger
    const openBtn = document.getElementById('openInvitationBtn');
    const mainContent = document.getElementById('mainContent');
    if (openBtn && mainContent) {
        openBtn.addEventListener('click', () => {
            mainContent.style.display = 'block';
            if (typeof gsap !== 'undefined') {
                gsap.to(mainContent, { opacity: 1, duration: 0.8, ease: 'power2.out' });
            }
            
            setTimeout(() => {
                const target = document.getElementById('welcome');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        });
    }
});

class RSVPController {
    constructor(token, apiUrl) {
        this.token = token;
        this.apiUrl = apiUrl;
        this.form = document.getElementById('rsvpForm');
        this.successMask = document.getElementById('rsvpSuccessAlert');
        if (this.form) this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processSubmission();
        });
    }

    async processSubmission() {
        const payload = {
            rsvpStatus: document.getElementById('rsvpAttendance').value,
            plusOneCount: parseInt(document.getElementById('rsvpCount').value) || 0,
            dietaryRestrictions: document.getElementById('rsvpDiet').value.trim()
        };

        try {
            if (this.token) {
                const res = await fetch(`${this.apiUrl}/api/event-hq/invite/rsvp/${this.token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                await res.json();
            }
        } catch (err) {
            console.error("RSVP transmission sync error:", err);
        }

        localStorage.setItem('passport_rsvp_telemetry', JSON.stringify(payload));

        if (payload.rsvpStatus === 'attending' && typeof confetti === 'function') {
            confetti({
                particleCount: 140,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#D48C46', '#FAF6F0', '#5A6351', '#DCAE96']
            });
        }

        if (this.successMask) {
            this.successMask.classList.remove('d-none');
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(this.successMask, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
            }
        }
    }
}

class GalleryModule {
    constructor() {
        this.items = document.querySelectorAll('.vault-frame');
        if (this.items.length > 0) this.init();
    }

    init() {
        this.items.forEach(item => {
            const img = item.querySelector('img');
            if (img && typeof gsap !== 'undefined') {
                item.addEventListener('mouseenter', () => {
                    gsap.to(img, { scale: 1.05, duration: 0.4, ease: 'power1.out' });
                });
                item.addEventListener('mouseleave', () => {
                    gsap.to(img, { scale: 1, duration: 0.4, ease: 'power1.out' });
                });
            }
        });
    }
}

class PetalEngine {
    constructor() {
        this.canvas = document.getElementById('petalCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.petals = [];
        this.maxPetals = 20;
        
        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resize();
        for (let i = 0; i < this.maxPetals; i++) {
            this.petals.push(this.createPetal());
        }
    }

    createPetal() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * -this.canvas.height,
            size: Math.random() * 5 + 3,
            speedY: Math.random() * 0.8 + 0.4,
            speedX: Math.random() * 0.8 - 0.4,
            opacity: Math.random() * 0.4 + 0.2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 1.5 - 0.75
        };
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.petals.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            if (p.y > this.canvas.height) {
                p.y = -20;
                p.x = Math.random() * this.canvas.width;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = `rgba(212, 140, 70, ${p.opacity})`;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(p.size, -p.size, p.size * 2, 0);
            this.ctx.quadraticCurveTo(p.size, p.size, 0, 0);
            this.ctx.fill();
            this.ctx.restore();
        });

        requestAnimationFrame(() => this.animate());
    }
}
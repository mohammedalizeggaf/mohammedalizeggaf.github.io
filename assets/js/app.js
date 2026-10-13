/**
 * Progressive enhancements. The site is fully usable without this file;
 * each feature below only runs when its markup is on the page.
 */
(() => {
    'use strict';

    const root = document.documentElement;

    /* Header: hairline under the bar once the page is scrolled. */
    const header = document.querySelector('[data-header]');

    if (header) {
        const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    /* Mobile navigation. */
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');

    if (toggle && nav) {
        const setOpen = (open) => {
            root.classList.toggle('nav-open', open);
            toggle.setAttribute('aria-expanded', String(open));
        };

        toggle.addEventListener('click', () => setOpen(!root.classList.contains('nav-open')));
        nav.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                setOpen(false);
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && root.classList.contains('nav-open')) {
                setOpen(false);
                toggle.focus();
            }
        });
        window.matchMedia('(min-width: 961px)').addEventListener('change', () => setOpen(false));
    }

    /* Reveal elements as they scroll into view. */
    const revealItems = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });

        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    /* Project filters. */
    const filters = document.querySelector('[data-filters]');

    if (filters) {
        const sections = document.querySelectorAll('[data-filter-section]');
        const empty = document.querySelector('[data-filter-empty]');

        filters.hidden = false;

        filters.addEventListener('click', (event) => {
            const button = event.target.closest('[data-filter]');

            if (!button) {
                return;
            }

            const category = button.dataset.filter;
            let total = 0;

            filters.querySelectorAll('[data-filter]').forEach((other) => {
                const active = other === button;
                other.classList.toggle('is-active', active);
                other.setAttribute('aria-pressed', String(active));
            });

            sections.forEach((section) => {
                let visible = 0;

                section.querySelectorAll('[data-category]').forEach((card) => {
                    const match = category === 'all' || card.dataset.category === category;
                    card.hidden = !match;
                    card.classList.add('is-visible');
                    visible += match ? 1 : 0;
                });

                section.hidden = visible === 0;
                total += visible;
            });

            if (empty) {
                empty.hidden = total > 0;
            }
        });
    }

    /* Screenshot lightbox. */
    const gallery = document.querySelector('[data-gallery]');
    const lightbox = document.querySelector('[data-lightbox]');

    if (gallery && lightbox && typeof lightbox.showModal === 'function') {
        const items = Array.from(gallery.querySelectorAll('[data-gallery-item]'));
        const image = lightbox.querySelector('[data-lightbox-image]');
        let current = 0;

        const show = (index) => {
            current = (index + items.length) % items.length;
            image.src = items[current].href;
            image.alt = items[current].querySelector('img').alt;
        };

        items.forEach((item, index) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                show(index);
                lightbox.showModal();
            });
        });

        lightbox.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());
        lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(current - 1));
        lightbox.querySelector('[data-lightbox-next]').addEventListener('click', () => show(current + 1));

        // A click on the dark area around the image closes the viewer.
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                lightbox.close();
            }
        });

        lightbox.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                show(current - 1);
            } else if (event.key === 'ArrowRight') {
                show(current + 1);
            }
        });

        lightbox.addEventListener('close', () => items[current].focus());

        if (items.length < 2) {
            lightbox.querySelector('[data-lightbox-prev]').hidden = true;
            lightbox.querySelector('[data-lightbox-next]').hidden = true;
        }
    }

    /* Horizontal card rows: previous / next buttons. */
    document.querySelectorAll('[data-scroller]').forEach((scroller) => {
        const track = scroller.querySelector('[data-scroller-track]');
        const controls = scroller.querySelector('[data-scroller-controls]');
        const prev = scroller.querySelector('[data-scroller-prev]');
        const next = scroller.querySelector('[data-scroller-next]');

        const update = () => {
            const max = track.scrollWidth - track.clientWidth;
            controls.hidden = max <= 4;
            prev.disabled = track.scrollLeft <= 4;
            next.disabled = track.scrollLeft >= max - 4;
        };

        const move = (direction) => {
            const card = track.firstElementChild;
            const step = card ? card.getBoundingClientRect().width + 16 : track.clientWidth;
            track.scrollBy({ left: direction * step, behavior: 'smooth' });
        };

        prev.addEventListener('click', () => move(-1));
        next.addEventListener('click', () => move(1));
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    });

    /* Motion extras. Skipped entirely for visitors who asked for reduced motion. */
    const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!calmMotion) {
        /* Background words slide sideways as their section crosses the screen. */
        const ghosts = Array.from(document.querySelectorAll('[data-ghost]'));

        if (ghosts.length) {
            let queued = false;

            const slide = () => {
                queued = false;
                const middle = window.innerHeight / 2;

                ghosts.forEach((ghost) => {
                    const box = ghost.parentElement.getBoundingClientRect();

                    if (box.bottom < -200 || box.top > window.innerHeight + 200) {
                        return;
                    }

                    const offset = (box.top + box.height / 2 - middle) * Number(ghost.dataset.ghost);
                    ghost.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0)`;
                });
            };

            const request = () => {
                if (!queued) {
                    queued = true;
                    requestAnimationFrame(slide);
                }
            };

            window.addEventListener('scroll', request, { passive: true });
            window.addEventListener('resize', request);
            slide();
        }

        /* Hero portrait: tilts towards the pointer while its decorations shift in depth. */
        const tilt = document.querySelector('[data-tilt]');

        if (tilt && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            const photo = tilt.querySelector('.hero__photo');
            const layers = tilt.querySelectorAll('[data-depth]');

            const apply = (x, y) => {
                photo.style.transform = `perspective(900px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
                layers.forEach((layer) => {
                    const depth = Number(layer.dataset.depth);
                    layer.style.translate = `${(x * depth).toFixed(1)}px ${(y * depth).toFixed(1)}px`;
                });
            };

            tilt.addEventListener('pointermove', (event) => {
                const box = tilt.getBoundingClientRect();
                apply((event.clientX - box.left) / box.width - 0.5, (event.clientY - box.top) / box.height - 0.5);
            });
            tilt.addEventListener('pointerleave', () => apply(0, 0));
        }
    }

    /* Contact form: stop double submissions. */
    const form = document.querySelector('[data-contact-form]');

    if (form) {
        form.addEventListener('submit', () => {
            const button = form.querySelector('[type="submit"]');
            button.disabled = true;
            button.textContent = 'Sending...';
        });
    }
})();

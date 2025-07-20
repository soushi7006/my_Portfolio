document.addEventListener('DOMContentLoaded', function() {
    // Initialize 360 panorama functionality
    const panoramaManager = new PanoramaManager();
    panoramaManager.init();
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Gallery filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-content');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    let currentImageIndex = 0;
    let visibleImages = [];

    function updateVisibleImages() {
        visibleImages = Array.from(document.querySelectorAll('.gallery-item'))
            .filter(item => item.style.display !== 'none')
            .map(item => ({
                src: item.querySelector('img').src,
                title: item.querySelector('.overlay h3').textContent,
                description: item.querySelector('.overlay p').textContent
            }));
    }

    function showLightbox(index) {
        updateVisibleImages();
        currentImageIndex = index;
        const image = visibleImages[currentImageIndex];
        
        lightboxImg.src = image.src;
        lightboxCaption.innerHTML = `<h3>${image.title}</h3><p>${image.description}</p>`;
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function showPrevImage() {
        currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : visibleImages.length - 1;
        const image = visibleImages[currentImageIndex];
        lightboxImg.src = image.src;
        lightboxCaption.innerHTML = `<h3>${image.title}</h3><p>${image.description}</p>`;
    }

    function showNextImage() {
        currentImageIndex = currentImageIndex < visibleImages.length - 1 ? currentImageIndex + 1 : 0;
        const image = visibleImages[currentImageIndex];
        lightboxImg.src = image.src;
        lightboxCaption.innerHTML = `<h3>${image.title}</h3><p>${image.description}</p>`;
    }

    // Add click event to gallery images
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Check if this is a 360 panorama item
            const panoramaData = item.getAttribute('data-panorama');
            if (panoramaData) {
                // Show 360 panorama viewer
                show360Panorama(panoramaData);
            } else {
                // Show regular lightbox
                const visibleIndex = Array.from(document.querySelectorAll('.gallery-item'))
                    .filter(i => i.style.display !== 'none')
                    .indexOf(item);
                showLightbox(visibleIndex);
            }
        });
    });

    // Lightbox controls
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);

    // Close lightbox when clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'block') {
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    showPrevImage();
                    break;
                case 'ArrowRight':
                    showNextImage();
                    break;
            }
        }
    });

    // 360 Panorama viewer function
    function show360Panorama(imageUrl) {
        // Create fullscreen panorama viewer
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'panorama-fullscreen';
        fullscreenDiv.id = 'gallery-panorama-fullscreen';
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'fullscreen-controls';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen-btn';
        closeBtn.textContent = '✕ 閉じる';
        closeBtn.onclick = () => close360Panorama();
        
        controlsDiv.appendChild(closeBtn);
        fullscreenDiv.appendChild(controlsDiv);
        document.body.appendChild(fullscreenDiv);
        
        // Create 360 panorama viewer
        const viewer = new PanoramaViewer('gallery-panorama-fullscreen');
        viewer.loadPanorama(imageUrl);
        
        // Store viewer reference for cleanup
        fullscreenDiv.panoramaViewer = viewer;
        
        // ESC key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                close360Panorama();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    function close360Panorama() {
        const fullscreenDiv = document.getElementById('gallery-panorama-fullscreen');
        if (fullscreenDiv) {
            // Clean up panorama viewer
            if (fullscreenDiv.panoramaViewer) {
                fullscreenDiv.panoramaViewer.destroy();
            }
            document.body.removeChild(fullscreenDiv);
            document.body.style.overflow = 'auto';
        }
    }

    // Contact form handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        // Simple form validation
        const requiredFields = ['name', 'email', 'message'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = this.querySelector(`[name="${field}"]`);
            if (!formObject[field] || formObject[field].trim() === '') {
                input.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                input.style.borderColor = '#ddd';
            }
        });

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailInput = this.querySelector('[name="email"]');
        if (!emailRegex.test(formObject.email)) {
            emailInput.style.borderColor = '#e74c3c';
            isValid = false;
        }

        if (isValid) {
            // Here you would typically send the form data to a server
            // For now, we'll just show a success message
            alert('お問い合わせありがとうございます。後日ご連絡いたします。');
            this.reset();
        } else {
            alert('必須項目を正しく入力してください。');
        }
    });
    }

    // Lazy loading for images
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.onload = () => {
                    img.classList.add('loaded');
                };
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));


    // Modified parallax effect for hero section with panorama
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            // Only apply parallax to content, not the panorama background
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

    // Add scroll effect to navigation
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    
    // Pause hero panorama auto-rotation when user interacts
    const heroSection = document.querySelector('.hero');
    if (heroSection && panoramaManager.currentHeroPanorama) {
        heroSection.addEventListener('mouseenter', () => {
            panoramaManager.currentHeroPanorama.stopAutoRotation();
        });
        
        heroSection.addEventListener('mouseleave', () => {
            panoramaManager.currentHeroPanorama.startAutoRotation(0.05);
        });
    }

    // Add entrance animation for gallery items
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    }, observerOptions);

    galleryItems.forEach(item => {
        // Skip panorama items as they have their own initialization
        if (!item.closest('.gallery360')) {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            galleryObserver.observe(item);
        }
    });
    
    // Handle window resize for panorama viewers
    window.addEventListener('resize', () => {
        // Trigger resize for all active panorama viewers
        if (window.panoramaManager) {
            window.panoramaManager.viewers.forEach(viewer => {
                viewer.onWindowResize();
            });
        }
    });
    
    // Store panorama manager globally for access
    window.panoramaManager = panoramaManager;
});
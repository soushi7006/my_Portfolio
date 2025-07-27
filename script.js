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

    // === 新しいライトボックスと360°写真の処理 START ===

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-content');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const closeBtn = document.querySelector('.lightbox .close');
    const prevBtn = document.querySelector('.lightbox .prev');
    const nextBtn = document.querySelector('.lightbox .next');

    let currentVisibleItems = [];
    let currentIndex = 0;

    // 表示されているアイテム（フィルタリング後）のリストを更新する関数
    function updateVisibleItems() {
        currentVisibleItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
    }

    // ライトボックスを開く関数
    function openLightbox(item) {
        updateVisibleItems();
        currentIndex = currentVisibleItems.indexOf(item);
        
        const imgSrc = item.querySelector('img').src;
        const title = item.querySelector('.overlay h3')?.textContent || '';
        const description = item.querySelector('.overlay p')?.textContent || '';
        
        lightboxImg.src = imgSrc;
        lightboxCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
        
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // 360°ビューワーをフルスクリーンで開く関数
    function openPanorama(item) {
        const imageUrl = item.getAttribute('data-panorama');
        if (!imageUrl) return;

        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'panorama-fullscreen';
        fullscreenDiv.id = 'gallery-panorama-fullscreen';

        const closeButton = document.createElement('button');
        closeButton.className = 'close-fullscreen-btn';
        closeButton.textContent = '✕ 閉じる';
        closeButton.onclick = () => {
            document.body.removeChild(fullscreenDiv);
            document.body.style.overflow = 'auto';
        };

        fullscreenDiv.appendChild(closeButton);
        document.body.appendChild(fullscreenDiv);
        document.body.style.overflow = 'hidden';
        
        new PanoramaViewer('gallery-panorama-fullscreen', imageUrl);
    }

    // ライトボックスを閉じる関数
    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 次の画像を表示する関数
    function showNext() {
        currentIndex = (currentIndex + 1) % currentVisibleItems.length;
        const nextItem = currentVisibleItems[currentIndex];
        const imgSrc = nextItem.querySelector('img').src;
        const title = nextItem.querySelector('.overlay h3')?.textContent || '';
        const description = nextItem.querySelector('.overlay p')?.textContent || '';
        lightboxImg.src = imgSrc;
        lightboxCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    }

    // 前の画像を表示する関数
    function showPrev() {
        currentIndex = (currentIndex - 1 + currentVisibleItems.length) % currentVisibleItems.length;
        const prevItem = currentVisibleItems[currentIndex];
        const imgSrc = prevItem.querySelector('img').src;
        const title = prevItem.querySelector('.overlay h3')?.textContent || '';
        const description = prevItem.querySelector('.overlay p')?.textContent || '';
        lightboxImg.src = imgSrc;
        lightboxCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    }

    // 各ギャラリーアイテムにクリックイベントを設定
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.hasAttribute('data-panorama')) {
                openPanorama(item);
            } else {
                openLightbox(item);
            }
        });
    });

    // ライトボックスの操作イベント
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (nextBtn) nextBtn.addEventListener('click', showNext);
    if (prevBtn) prevBtn.addEventListener('click', showPrev);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'block') {
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'Escape') closeLightbox();
        }
    });

    // === 新しいライトボックスと360°写真の処理 END ===

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
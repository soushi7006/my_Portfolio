class PanoramaViewer {
    constructor(containerId, imageUrl = null) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.sphere = null;
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lon = 0;
        this.lat = 0;
        this.phi = 0;
        this.theta = 0;
        
        this.init();
        if (imageUrl) {
            this.loadPanorama(imageUrl);
        } else {
            this.createDefaultSkybox();
        }
    }

    init() {
        // Set up renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Set up camera
        this.camera.position.set(0, 0, 0);

        // Add event listeners
        this.setupEventListeners();

        // Start render loop
        this.animate();
    }

    createDefaultSkybox() {
        // Create a default gradient skybox
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;

        const skyGeo = new THREE.SphereGeometry(500, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            side: THREE.BackSide
        });

        this.sphere = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sphere);
    }

    loadPanorama(imageUrl) {
        const loader = new THREE.TextureLoader();
        loader.load(
            imageUrl,
            (texture) => {
                // Remove existing sphere if any
                if (this.sphere) {
                    this.scene.remove(this.sphere);
                }

                // Create sphere geometry
                const geometry = new THREE.SphereGeometry(500, 60, 40);
                // Flip the geometry inside out
                geometry.scale(-1, 1, 1);

                // Create material with the loaded texture
                const material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                this.sphere = new THREE.Mesh(geometry, material);
                this.scene.add(this.sphere);
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading panorama:', error);
                this.createDefaultSkybox();
            }
        );
    }

    loadCubemap(urls) {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load(urls);
        
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        
        const material = new THREE.MeshBasicMaterial({
            envMap: texture
        });

        if (this.sphere) {
            this.scene.remove(this.sphere);
        }

        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
    }

    setupEventListeners() {
        const canvas = this.renderer.domElement;

        // Mouse events
        canvas.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.isMouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });

        canvas.addEventListener('mousemove', (event) => {
            if (!this.isMouseDown) return;
            
            const deltaX = event.clientX - this.mouseX;
            const deltaY = event.clientY - this.mouseY;
            
            this.lon -= deltaX * 0.1;
            this.lat += deltaY * 0.1;
            
            this.lat = Math.max(-85, Math.min(85, this.lat));
            
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });

        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });

        // Touch events for mobile
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.touches.length === 1) {
                this.isMouseDown = true;
                this.mouseX = event.touches[0].clientX;
                this.mouseY = event.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (!this.isMouseDown || event.touches.length !== 1) return;
            
            const deltaX = event.touches[0].clientX - this.mouseX;
            const deltaY = event.touches[0].clientY - this.mouseY;
            
            this.lon -= deltaX * 0.1;
            this.lat += deltaY * 0.1;
            
            this.lat = Math.max(-85, Math.min(85, this.lat));
            
            this.mouseX = event.touches[0].clientX;
            this.mouseY = event.touches[0].clientY;
        });

        canvas.addEventListener('touchend', () => {
            this.isMouseDown = false;
        });

        // Wheel event for zoom (optional)
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            const fov = this.camera.fov + event.deltaY * 0.05;
            this.camera.fov = Math.max(30, Math.min(120, fov));
            this.camera.updateProjectionMatrix();
        });

        // Resize event
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update camera position based on mouse movement
        this.phi = THREE.MathUtils.degToRad(90 - this.lat);
        this.theta = THREE.MathUtils.degToRad(this.lon);

        this.camera.lookAt(
            Math.sin(this.phi) * Math.cos(this.theta),
            Math.cos(this.phi),
            Math.sin(this.phi) * Math.sin(this.theta)
        );

        this.renderer.render(this.scene, this.camera);
    }

    // Auto-rotation feature
    startAutoRotation(speed = 0.1) {
        this.autoRotationSpeed = speed;
        this.autoRotate = true;
        this.autoRotateAnimation();
    }

    stopAutoRotation() {
        this.autoRotate = false;
    }

    autoRotateAnimation() {
        if (!this.autoRotate) return;
        
        if (!this.isMouseDown) {
            this.lon += this.autoRotationSpeed;
        }
        
        requestAnimationFrame(() => this.autoRotateAnimation());
    }

    // Method to change panorama
    changePanorama(imageUrl) {
        this.loadPanorama(imageUrl);
    }

    // Method to reset view
    resetView() {
        this.lon = 0;
        this.lat = 0;
        this.camera.fov = 75;
        this.camera.updateProjectionMatrix();
    }

    // Clean up
    destroy() {
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        if (this.sphere && this.sphere.material) {
            this.sphere.material.dispose();
        }
        if (this.sphere && this.sphere.geometry) {
            this.sphere.geometry.dispose();
        }
    }
}

// Panorama Manager for handling multiple panorama viewers
class PanoramaManager {
    constructor() {
        this.viewers = new Map();
        this.currentHeroPanorama = null;
    }

    createViewer(containerId, imageUrl = null) {
        const viewer = new PanoramaViewer(containerId, imageUrl);
        this.viewers.set(containerId, viewer);
        return viewer;
    }

    destroyViewer(containerId) {
        const viewer = this.viewers.get(containerId);
        if (viewer) {
            viewer.destroy();
            this.viewers.delete(containerId);
        }
    }

    initHeroPanorama() {
        if (!document.getElementById('panorama-container')) return;

        this.currentHeroPanorama = this.createViewer('panorama-container');
        this.currentHeroPanorama.loadPanorama('images/IMG_20250607_210405_00_013-4【完成】.jpg');
        
        // 初期視点を180度回転（建物の正面から開始）
        this.currentHeroPanorama.lon = 180;
        
        this.currentHeroPanorama.startAutoRotation(0.05);
    }

    initGalleryPanoramas() {
        const panoramaItems = document.querySelectorAll('.panorama-item');
        
        panoramaItems.forEach((item, index) => {
            const viewerId = item.querySelector('.panorama-viewer').id;
            const panoramaData = item.getAttribute('data-panorama');
            
            if (viewerId && panoramaData) {
                // Create a mini panorama viewer for gallery
                const viewer = this.createViewer(viewerId);
                
                // Check if panoramaData is a single image file or cubemap URL
                if (this.isSingleImagePanorama(panoramaData)) {
                    // Load single panorama image
                    viewer.loadPanorama(panoramaData);
                    // ギャラリー用の初期角度を180度に設定
                    viewer.lon = 180;
                    viewer.startAutoRotation(0.02);
                    
                    // Add click event to view in fullscreen
                    item.addEventListener('click', () => {
                        this.showFullscreenPanoramaSingle(panoramaData);
                    });
                } else {
                    // Load different sample panoramas for each gallery item (cubemap)
                    const sampleUrls = this.getSampleCubemapUrls(index);
                    viewer.loadCubemap(sampleUrls);
                    // ギャラリー用の初期角度を180度に設定
                    viewer.lon = 180;
                    viewer.startAutoRotation(0.02);
                    
                    // Add click event to view in fullscreen
                    item.addEventListener('click', () => {
                        this.showFullscreenPanorama(sampleUrls);
                    });
                }
            }
        });
    }

    // Check if the panorama data is a single image file
    isSingleImagePanorama(panoramaData) {
        // Check if it's a single image file (jpg, jpeg, png, etc.)
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
        const lowerData = panoramaData.toLowerCase();
        return imageExtensions.some(ext => lowerData.includes(ext));
    }

    // Show fullscreen panorama for single image
    showFullscreenPanoramaSingle(imageUrl) {
        // Create fullscreen panorama viewer
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'panorama-fullscreen';
        fullscreenDiv.id = 'fullscreen-panorama';
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'fullscreen-controls';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen-btn';
        closeBtn.textContent = '✕ 閉じる';
        closeBtn.onclick = () => this.closeFullscreenPanorama();
        
        controlsDiv.appendChild(closeBtn);
        fullscreenDiv.appendChild(controlsDiv);
        document.body.appendChild(fullscreenDiv);
        
        const viewer = this.createViewer('fullscreen-panorama');
        viewer.loadPanorama(imageUrl);
        
        // ESC key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFullscreenPanorama();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    getSampleCubemapUrls(index) {
        // Return different sample cubemap URLs based on index
        const cubemaps = [
            [
                'https://threejs.org/examples/textures/cube/pisa/px.png',
                'https://threejs.org/examples/textures/cube/pisa/nx.png',
                'https://threejs.org/examples/textures/cube/pisa/py.png',
                'https://threejs.org/examples/textures/cube/pisa/ny.png',
                'https://threejs.org/examples/textures/cube/pisa/pz.png',
                'https://threejs.org/examples/textures/cube/pisa/nz.png'
            ],
            [
                'https://threejs.org/examples/textures/cube/bridge/px.jpg',
                'https://threejs.org/examples/textures/cube/bridge/nx.jpg',
                'https://threejs.org/examples/textures/cube/bridge/py.jpg',
                'https://threejs.org/examples/textures/cube/bridge/ny.jpg',
                'https://threejs.org/examples/textures/cube/bridge/pz.jpg',
                'https://threejs.org/examples/textures/cube/bridge/nz.jpg'
            ],
            [
                'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/px.jpg',
                'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/nx.jpg',
                'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/py.jpg',
                'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/ny.jpg',
                'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/pz.jpg',
                'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/nz.jpg'
            ]
        ];
        
        return cubemaps[index % cubemaps.length];
    }

    showFullscreenPanorama(cubemapUrls) {
        // Create fullscreen panorama viewer
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'panorama-fullscreen';
        fullscreenDiv.id = 'fullscreen-panorama';
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'fullscreen-controls';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen-btn';
        closeBtn.textContent = '✕ 閉じる';
        closeBtn.onclick = () => this.closeFullscreenPanorama();
        
        controlsDiv.appendChild(closeBtn);
        fullscreenDiv.appendChild(controlsDiv);
        document.body.appendChild(fullscreenDiv);
        
        const viewer = this.createViewer('fullscreen-panorama');
        viewer.loadCubemap(cubemapUrls);
        
        // ESC key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFullscreenPanorama();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    closeFullscreenPanorama() {
        const fullscreenDiv = document.getElementById('fullscreen-panorama');
        if (fullscreenDiv) {
            this.destroyViewer('fullscreen-panorama');
            document.body.removeChild(fullscreenDiv);
        }
    }

    // Navigation for gallery panoramas
    initPanoramaNavigation() {
        const navButtons = document.querySelectorAll('.panorama-nav-btn');
        
        navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                navButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Switch to corresponding panorama
                this.switchHeroPanorama(index);
            });
        });
        
        // Set first button as active
        if (navButtons.length > 0) {
            navButtons[0].classList.add('active');
        }
    }

    switchHeroPanorama(index) {
        if (this.currentHeroPanorama) {
            const panoramaItems = document.querySelectorAll('.panorama-item');
            if (panoramaItems[index]) {
                const panoramaData = panoramaItems[index].getAttribute('data-panorama');
                
                if (this.isSingleImagePanorama(panoramaData)) {
                    // Load single panorama image
                    this.currentHeroPanorama.loadPanorama(panoramaData);
                } else {
                    // Load cubemap
                    const cubemapUrls = this.getSampleCubemapUrls(index);
                    this.currentHeroPanorama.loadCubemap(cubemapUrls);
                }
            }
        }
    }

    // Initialize all panoramas
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initHeroPanorama();
                this.initGalleryPanoramas();
                this.initPanoramaNavigation();
            });
        } else {
            this.initHeroPanorama();
            this.initGalleryPanoramas();
            this.initPanoramaNavigation();
        }
    }
}

// Export for global use
window.PanoramaManager = PanoramaManager;
window.PanoramaViewer = PanoramaViewer;
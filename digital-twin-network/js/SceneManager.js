import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export default class SceneManager {
  constructor(container) {
    this.container = container;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(25, 18, 25);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI / 2.1;

    // Composer
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.4, 0.5, 0.8);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    this.setupLighting();
    this.createGrid();
    this.createStarfield();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x1a1a3e, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x0044ff, 0x002211, 0.3);
    this.scene.add(hemiLight);

    const createPointLight = (color, x, y, z) => {
      const light = new THREE.PointLight(color, 0.3, 50);
      light.position.set(x, y, z);
      this.scene.add(light);
    };

    createPointLight(0x00f0ff, -20, 10, -20);
    createPointLight(0x00ff88, 20, 10, -20);
    createPointLight(0xaa44ff, -20, 10, 20);
    createPointLight(0xff8800, 20, 10, 20);
  }
  
  createGrid() {
    const gridHelper = new THREE.GridHelper(60, 60, 0x00f0ff, 0x0a1628);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    const planeGeometry = new THREE.PlaneGeometry(60, 60);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a2e,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }
  
  createStarfield() {
    const createStars = (count, size, dim = false) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i < count; i++) {
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 100 * Math.cbrt(Math.random());
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        vertices.push(x, y, z);
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      
      const material = new THREE.PointsMaterial({
        size: size,
        color: 0xffffff,
        transparent: true,
        opacity: dim ? 0.4 : 0.8
      });
      
      return new THREE.Points(geometry, material);
    };

    this.stars1 = createStars(2000, 0.15, false);
    this.scene.add(this.stars1);

    this.stars2 = createStars(500, 0.3, true);
    this.scene.add(this.stars2);
  }
  
  update(deltaTime) {
    this.controls.update();
    if (this.stars1) this.stars1.rotation.y += 0.0001;
    if (this.stars2) this.stars2.rotation.y += 0.0001;
    this.composer.render();
  }
  
  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }
}

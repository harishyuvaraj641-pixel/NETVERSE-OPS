import SceneManager from './SceneManager.js';
import NetworkManager from './NetworkManager.js';
import PacketAnimator from './PacketAnimator.js';
import SimulationEngine from './SimulationEngine.js';
import InteractionManager from './InteractionManager.js';
import UIManager from './UIManager.js';

class App {
  constructor() {
    this.clock = null;
    this.sceneManager = null;
    this.networkManager = null;
    this.packetAnimator = null;
    this.simulationEngine = null;
    this.interactionManager = null;
    this.uiManager = null;
    this.fpsFrames = 0;
    this.fpsTime = 0;
  }
  
  async init() {
    // Show loading screen
    const loadingScreen = document.getElementById('loading-screen');
    
    // Initialize Three.js scene
    const container = document.getElementById('canvas-container');
    this.sceneManager = new SceneManager(container);
    
    // Initialize network manager
    this.networkManager = new NetworkManager(this.sceneManager.scene);
    
    // Initialize packet animator
    this.packetAnimator = new PacketAnimator(this.sceneManager.scene, this.networkManager);
    
    // Initialize simulation engine
    this.simulationEngine = new SimulationEngine(this.networkManager, this.packetAnimator);
    
    // Initialize interaction manager
    this.interactionManager = new InteractionManager(
      this.sceneManager.camera,
      this.sceneManager.renderer,
      this.networkManager
    );
    
    // Initialize UI manager
    this.uiManager = new UIManager(
      this.networkManager,
      this.simulationEngine,
      this.interactionManager
    );
    
    // Load default topology
    this.networkManager.loadTopology('enterprise');
    this.uiManager.updateDeviceList();
    this.uiManager.updateCounts();
    
    // Start simulation
    this.simulationEngine.start();
    document.getElementById('btn-toggle-sim').textContent = '⏸';
    
    // Use THREE.Clock for deltaTime
    this.clock = new (await import('three')).Clock();
    
    // Window resize
    window.addEventListener('resize', () => this.sceneManager.onWindowResize());
    
    // Hide loading screen after a brief delay
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.8s ease';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 800);
    }, 1500);
    
    // Start animation loop
    this.animate();
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    const clampedDelta = Math.min(deltaTime, 0.1); // Prevent large jumps
    
    // Update all systems
    this.sceneManager.update(clampedDelta);
    this.networkManager.update(clampedDelta);
    this.packetAnimator.update(clampedDelta);
    this.simulationEngine.update(clampedDelta);
    this.interactionManager.update(clampedDelta);
    this.uiManager.update(clampedDelta);
    
    // FPS counter
    this.fpsFrames++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1.0) {
      document.getElementById('fps-counter').textContent = this.fpsFrames + ' FPS';
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
  }
}

// Start the application
const app = new App();
app.init().catch(err => {
  console.error('Failed to initialize:', err);
  document.getElementById('loading-screen').innerHTML = 
    '<div style="color:#ff3344;font-size:16px;text-align:center;padding:40px;">Failed to initialize: ' + err.message + '</div>';
});

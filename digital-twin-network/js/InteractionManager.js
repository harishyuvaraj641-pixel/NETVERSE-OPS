import * as THREE from 'three';

export default class InteractionManager {
  constructor(camera, renderer, networkManager) {
    this.camera = camera;
    this.renderer = renderer;
    this.networkManager = networkManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedDevice = null;
    this.hoveredDevice = null;
    this.onSelectCallback = null;
    this.onHoverCallback = null;
    this.selectionRing = null; // Highlight ring for selected device
    this.isDragging = false;
    this.mouseDownPos = new THREE.Vector2();
    
    // Create selection indicator
    this.createSelectionRing();
    
    // Event listeners
    renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    renderer.domElement.addEventListener('mousedown', (e) => {
      this.mouseDownPos.set(e.clientX, e.clientY);
      this.isDragging = false;
    });
    renderer.domElement.addEventListener('mousemove', () => {
      this.isDragging = true;
    });
  }
  
  createSelectionRing() {
    // Create a rotating, glowing ring that appears around selected device
    // RingGeometry(1.3, 1.6, 32)
    // MeshBasicMaterial, color 0x00f0ff, transparent, opacity 0.5, side DoubleSide
    // Rotate flat, initially not in scene
    const geo = new THREE.RingGeometry(1.3, 1.6, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.selectionRing = new THREE.Mesh(geo, mat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.visible = false;
  }
  
  onClick(event) {
    // Only handle if mouse didn't drag (click vs drag threshold)
    const dx = event.clientX - this.mouseDownPos.x;
    const dy = event.clientY - this.mouseDownPos.y;
    if (Math.sqrt(dx*dx + dy*dy) > 5) return; // Was a drag, not a click
    
    // Update mouse coordinates (-1 to 1 range)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all device meshes
    const deviceMeshes = [];
    this.networkManager.getAllDevices().forEach(d => {
      d.mesh.traverse(child => {
        if (child.isMesh) deviceMeshes.push(child);
      });
    });
    
    const intersects = this.raycaster.intersectObjects(deviceMeshes, false);
    
    if (intersects.length > 0) {
      // Find the parent group (device)
      let deviceMesh = intersects[0].object;
      while (deviceMesh.parent && !deviceMesh.userData.id) {
        deviceMesh = deviceMesh.parent;
      }
      
      if (deviceMesh.userData.id) {
        this.selectDevice(deviceMesh);
      }
    } else {
      this.deselectDevice();
    }
  }
  
  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycast for hover
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const deviceMeshes = [];
    this.networkManager.getAllDevices().forEach(d => {
      d.mesh.traverse(child => {
        if (child.isMesh) deviceMeshes.push(child);
      });
    });
    
    const intersects = this.raycaster.intersectObjects(deviceMeshes, false);
    
    const tooltip = document.getElementById('tooltip');
    
    if (intersects.length > 0) {
      let deviceMesh = intersects[0].object;
      while (deviceMesh.parent && !deviceMesh.userData.id) {
        deviceMesh = deviceMesh.parent;
      }
      
      if (deviceMesh.userData.id && deviceMesh !== this.hoveredDevice) {
        this.hoveredDevice = deviceMesh;
        this.renderer.domElement.style.cursor = 'pointer';
        if (this.onHoverCallback) this.onHoverCallback(deviceMesh.userData);
        
        // Show tooltip
        tooltip.classList.remove('hidden');
        tooltip.innerHTML = `<strong>${deviceMesh.userData.name}</strong><br>${deviceMesh.userData.type} | ${deviceMesh.userData.ip}<br>Status: ${deviceMesh.userData.status}`;
      }
      
      // Position tooltip near cursor
      if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY + 15) + 'px';
      }
    } else {
      if (this.hoveredDevice) {
        this.hoveredDevice = null;
        this.renderer.domElement.style.cursor = 'default';
        tooltip.classList.add('hidden');
        if (this.onHoverCallback) this.onHoverCallback(null);
      }
    }
  }
  
  selectDevice(mesh) {
    this.selectedDevice = mesh;
    
    // Show and position selection ring
    if (!this.selectionRing.parent) {
      this.networkManager.scene.add(this.selectionRing);
    }
    this.selectionRing.visible = true;
    this.selectionRing.position.copy(mesh.position);
    this.selectionRing.position.y = 0.05;
    
    if (this.onSelectCallback) {
      this.onSelectCallback(mesh.userData);
    }
  }
  
  deselectDevice() {
    this.selectedDevice = null;
    if (this.selectionRing) {
      this.selectionRing.visible = false;
    }
    if (this.onSelectCallback) {
      this.onSelectCallback(null);
    }
  }
  
  update(deltaTime) {
    // Rotate selection ring slowly
    if (this.selectionRing && this.selectionRing.visible) {
      this.selectionRing.rotation.z += deltaTime * 1.5;
      this.selectionRing.material.opacity = 0.3 + Math.sin(performance.now() * 0.003) * 0.2;
      
      // Track selected device position
      if (this.selectedDevice) {
        this.selectionRing.position.x = this.selectedDevice.position.x;
        this.selectionRing.position.z = this.selectedDevice.position.z;
      }
    }
  }
}

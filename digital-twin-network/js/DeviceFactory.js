import * as THREE from 'three';

export default class DeviceFactory {
  static DEVICE_COLORS = {
    router: 0x00aaff,
    switch: 0x00ff88,
    server: 0x8899aa,
    firewall: 0xff8800,
    workstation: 0xccddee,
    cloud: 0x44ccff,
    database: 0xaa44ff,
    loadbalancer: 0xffcc00
  };
  
  static createDevice(type, config = {}) {
    let deviceGroup;
    let height = 1;
    
    switch(type) {
      case 'router': deviceGroup = this.createRouter(); height = 1.5; break;
      case 'switch': deviceGroup = this.createSwitch(); height = 0.5; break;
      case 'server': deviceGroup = this.createServer(); height = 2.2; break;
      case 'firewall': deviceGroup = this.createFirewall(); height = 1.7; break;
      case 'workstation': deviceGroup = this.createWorkstation(); height = 1.4; break;
      case 'cloud': deviceGroup = this.createCloud(); height = 1.2; break;
      case 'database': deviceGroup = this.createDatabase(); height = 1.5; break;
      case 'loadbalancer': deviceGroup = this.createLoadBalancer(); height = 1.8; break;
      default: deviceGroup = new THREE.Group(); break;
    }
    
    deviceGroup.userData = {
      id: config.id || `dev-${Math.random().toString(36).substr(2, 9)}`,
      name: config.name || `${type} device`,
      type: type,
      ip: config.ip || '0.0.0.0',
      status: 'online',
      cpu: 0,
      memory: 0,
      bandwidth: 0,
      uptime: 0,
      mac: this.generateMAC()
    };
    
    if (config.position) {
      deviceGroup.position.set(config.position.x, config.position.y, config.position.z);
    }
    
    const color = this.getDeviceColor(type);
    
    const glowBase = this.createGlowBase(color);
    deviceGroup.add(glowBase);
    deviceGroup.userData.glowBase = glowBase;
    
    const statusLight = this.createStatusIndicator(height);
    deviceGroup.add(statusLight);
    deviceGroup.userData.statusLight = statusLight;
    
    const label = this.createLabel(deviceGroup.userData.name, height + 0.3);
    deviceGroup.add(label);
    deviceGroup.userData.label = label;
    
    return deviceGroup;
  }
  
  static createRouter() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('router');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.6, roughness: 0.3, emissive: color, emissiveIntensity: 0.15 
    });
    
    const bodyGeom = new THREE.CylinderGeometry(0.8, 1, 0.6, 8);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const topGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.15);
    const top = new THREE.Mesh(topGeom, material);
    top.position.y = 0.675;
    top.castShadow = true;
    group.add(top);
    
    const antGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
    const ant1 = new THREE.Mesh(antGeom, material);
    ant1.position.set(0.6, 0.7, 0);
    ant1.rotation.z = -0.2;
    ant1.castShadow = true;
    group.add(ant1);
    
    const ant2 = new THREE.Mesh(antGeom, material);
    ant2.position.set(-0.6, 0.7, 0);
    ant2.rotation.z = 0.2;
    ant2.castShadow = true;
    group.add(ant2);
    
    return group;
  }
  
  static createSwitch() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('switch');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.5, roughness: 0.4 
    });
    
    const bodyGeom = new THREE.BoxGeometry(2, 0.3, 1);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = 0.15;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    for(let i=0; i<8; i++) {
      const portColor = i % 2 === 0 ? 0x00ff88 : 0xff8800;
      const portMat = new THREE.MeshStandardMaterial({ color: portColor, emissive: portColor, emissiveIntensity: 0.5 });
      const portGeom = new THREE.BoxGeometry(0.12, 0.08, 0.01);
      const port = new THREE.Mesh(portGeom, portMat);
      port.position.set(-0.7 + i * 0.2, 0.15, 0.505);
      group.add(port);
    }
    
    return group;
  }
  
  static createServer() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('server');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.7, roughness: 0.2 
    });
    
    const bodyGeom = new THREE.BoxGeometry(0.8, 2, 0.6);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = 1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.3 });
    for(let i=0; i<5; i++) {
      const lineGeom = new THREE.BoxGeometry(0.82, 0.02, 0.01);
      const line = new THREE.Mesh(lineGeom, rackMat);
      line.position.set(0, 0.4 + i * 0.3, 0.305);
      group.add(line);
    }
    
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
    const ledGeom = new THREE.BoxGeometry(0.05, 0.05, 0.01);
    const led = new THREE.Mesh(ledGeom, ledMat);
    led.position.set(0.25, 1.8, 0.305);
    group.add(led);
    
    return group;
  }
  
  static createFirewall() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('firewall');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.4, roughness: 0.3 
    });
    
    const bodyGeom = new THREE.BoxGeometry(1.5, 1.5, 0.3);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const emblemMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
    const emblemGeom = new THREE.BoxGeometry(1.0, 1.0, 0.32);
    const emblem = new THREE.Mesh(emblemGeom, emblemMat);
    emblem.position.y = 0.75;
    group.add(emblem);
    
    const sideGeom = new THREE.BoxGeometry(0.2, 1.2, 0.4);
    const side1 = new THREE.Mesh(sideGeom, material);
    side1.position.set(-0.85, 0.75, 0);
    side1.castShadow = true;
    group.add(side1);
    
    const side2 = new THREE.Mesh(sideGeom, material);
    side2.position.set(0.85, 0.75, 0);
    side2.castShadow = true;
    group.add(side2);
    
    return group;
  }
  
  static createWorkstation() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('workstation');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.3, roughness: 0.7 
    });
    
    const baseGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.05);
    const base = new THREE.Mesh(baseGeom, material);
    base.position.y = 0.025;
    base.castShadow = true;
    group.add(base);
    
    const standGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
    const stand = new THREE.Mesh(standGeom, material);
    stand.position.y = 0.25;
    stand.castShadow = true;
    group.add(stand);
    
    const monitorGeom = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    const monitor = new THREE.Mesh(monitorGeom, material);
    monitor.position.y = 0.85;
    monitor.castShadow = true;
    group.add(monitor);
    
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.4 });
    const screenGeom = new THREE.BoxGeometry(1.0, 0.6, 0.02);
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(0, 0.85, 0.025);
    group.add(screen);
    
    return group;
  }
  
  static createCloud() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('cloud');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, emissive: color, emissiveIntensity: 0.1, transparent: true, opacity: 0.85
    });
    
    const centerGeom = new THREE.SphereGeometry(0.7);
    const center = new THREE.Mesh(centerGeom, material);
    center.position.y = 0.7;
    center.castShadow = true;
    group.add(center);
    
    const leftGeom = new THREE.SphereGeometry(0.5);
    const left = new THREE.Mesh(leftGeom, material);
    left.position.set(-0.6, 0.6, 0);
    left.castShadow = true;
    group.add(left);
    
    const rightGeom = new THREE.SphereGeometry(0.5);
    const right = new THREE.Mesh(rightGeom, material);
    right.position.set(0.6, 0.6, 0);
    right.castShadow = true;
    group.add(right);
    
    return group;
  }
  
  static createDatabase() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('database');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.6, roughness: 0.4 
    });
    
    for(let i=0; i<3; i++) {
      const cylGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4);
      const cyl = new THREE.Mesh(cylGeom, material);
      cyl.position.y = 0.2 + (i * 0.45);
      cyl.castShadow = true;
      cyl.receiveShadow = true;
      group.add(cyl);
    }
    
    return group;
  }
  
  static createLoadBalancer() {
    const group = new THREE.Group();
    const color = this.getDeviceColor('loadbalancer');
    const material = new THREE.MeshStandardMaterial({ 
      color: color, metalness: 0.7, roughness: 0.2, emissive: color, emissiveIntensity: 0.15 
    });
    
    const bodyGeom = new THREE.OctahedronGeometry(0.8);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);
    
    return group;
  }
  
  static createGlowBase(color) {
    const ringGeom = new THREE.RingGeometry(0.8, 1.2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    return ring;
  }
  
  static createStatusIndicator(height) {
    const geom = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const sphere = new THREE.Mesh(geom, material);
    sphere.position.y = height + 0.1;
    return sphere;
  }
  
  static createLabel(text, height) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, 256, 64);
    
    context.font = 'bold 24px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
    context.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = height + 0.4;
    
    return sprite;
  }
  
  static generateMAC() {
    return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => 
      '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
    );
  }
  
  static getDeviceColor(type) {
    return DeviceFactory.DEVICE_COLORS[type] || 0xffffff;
  }
}

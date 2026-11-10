import * as THREE from 'three';

export default class PacketAnimator {
  constructor(scene, networkManager) {
    this.scene = scene;
    this.networkManager = networkManager;
    this.packets = []; 
    this.speedMultiplier = 1;
    this.packetPool = []; 
    this.maxPackets = 200; 
  }
  
  sendPacket(fromId, toId, options = {}) {
    if (this.packets.length >= this.maxPackets) return;

    const fromDevice = this.networkManager.getDevice(fromId);
    const toDevice = this.networkManager.getDevice(toId);
    
    if (!fromDevice || !toDevice) return;

    const color = options.color || 0x00f0ff;
    const speed = options.speed || 3;
    const size = options.size || 0.12;

    const packet = this.getPacketFromPool(color, size);
    
    const p1 = fromDevice.mesh.position;
    const p2 = toDevice.mesh.position;
    
    const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    midPoint.y += Math.min(1.5, p1.distanceTo(p2) * 0.2);
    
    packet.curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      midPoint,
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );
    
    packet.progress = 0;
    packet.speed = speed;
    
    this.packets.push(packet);
    this.scene.add(packet.mesh);
  }
  
  getPacketFromPool(color, size) {
    let packet;
    if (this.packetPool.length > 0) {
      packet = this.packetPool.pop();
      packet.mesh.material.color.setHex(color);
      packet.mesh.children[0].color.setHex(color);
      packet.mesh.scale.setScalar(size / 0.12);
    } else {
      const geometry = new THREE.SphereGeometry(0.12, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const light = new THREE.PointLight(color, 0.5, 3);
      mesh.add(light);
      
      packet = { mesh };
      if (size !== 0.12) {
        packet.mesh.scale.setScalar(size / 0.12);
      }
    }
    return packet;
  }
  
  returnToPool(packet) {
    this.scene.remove(packet.mesh);
    this.packetPool.push(packet);
  }
  
  update(deltaTime) {
    const activePackets = [];
    
    for (let i = 0; i < this.packets.length; i++) {
      const packet = this.packets[i];
      packet.progress += packet.speed * deltaTime * this.speedMultiplier * 0.5;
      
      if (packet.progress >= 1) {
        this.returnToPool(packet);
      } else {
        const point = packet.curve.getPoint(packet.progress);
        packet.mesh.position.copy(point);
        
        // Pulse effect
        const pulse = 1 + Math.sin(packet.progress * Math.PI * 4) * 0.2;
        packet.mesh.scale.setScalar(pulse);
        packet.mesh.material.opacity = 0.7 + pulse * 0.2;
        
        activePackets.push(packet);
      }
    }
    
    this.packets = activePackets;
  }
  
  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
  }
  
  clear() {
    this.packets.forEach(p => { 
      this.scene.remove(p.mesh); 
      this.packetPool.push(p);
    });
    this.packets = [];
  }
  
  getActiveCount() {
    return this.packets.length;
  }
}

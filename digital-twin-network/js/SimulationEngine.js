export default class SimulationEngine {
  constructor(networkManager, packetAnimator) {
    this.networkManager = networkManager;
    this.packetAnimator = packetAnimator;
    this.running = false;
    this.speed = 1;
    this.stats = {
      totalPackets: 0,
      packetsPerSecond: 0,
      avgLatency: 0,
      packetLoss: 0,
      networkHealth: 100,
      totalBandwidth: 0
    };
    this.alerts = [];
    this.nextAlertId = 1;
    this.packetTimer = 0;
    this.statsTimer = 0;
    this.alertTimer = 0;
    this.deviceUpdateTimer = 0;
    this.packetsSentThisSecond = 0;
    this.lastSecondPackets = 0;
    this.callbacks = {};
  }
  
  start() {
    this.running = true;
  }
  
  stop() {
    this.running = false;
  }
  
  toggle() {
    this.running = !this.running;
    return this.running;
  }
  
  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(5, speed));
    this.packetAnimator.setSpeed(this.speed);
  }
  
  on(event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
  }
  
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }
  
  update(deltaTime) {
    if (!this.running) return;
    
    const dt = deltaTime * this.speed;
    
    // 1. Generate network traffic (send packets)
    this.packetTimer += dt;
    if (this.packetTimer > 0.15) { // Send packets every ~150ms
      this.packetTimer = 0;
      this.generateTraffic();
    }
    
    // 2. Update device stats (CPU, memory, bandwidth) every 0.5s
    this.deviceUpdateTimer += dt;
    if (this.deviceUpdateTimer > 0.5) {
      this.deviceUpdateTimer = 0;
      this.updateDeviceStats();
    }
    
    // 3. Update network stats every 1s
    this.statsTimer += dt;
    if (this.statsTimer > 1.0) {
      this.statsTimer = 0;
      this.updateNetworkStats();
    }
    
    // 4. Random alerts every 5-10s
    this.alertTimer += dt;
    if (this.alertTimer > 5 + Math.random() * 5) {
      this.alertTimer = 0;
      this.generateAlert();
    }
  }
  
  generateTraffic() {
    const connections = this.networkManager.getAllConnections();
    if (connections.length === 0) return;
    
    // Send 1-3 packets along random connections
    const numPackets = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPackets; i++) {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      if (conn.data.status === 'down') continue;
      
      // Random direction
      const from = Math.random() > 0.5 ? conn.from : conn.to;
      const to = from === conn.from ? conn.to : conn.from;
      
      // Random packet type
      const types = ['data', 'data', 'data', 'control', 'ack'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const colors = { data: 0x00f0ff, control: 0xffcc00, error: 0xff3344, ack: 0x00ff88 };
      
      this.packetAnimator.sendPacket(from, to, {
        color: colors[type],
        speed: 2 + Math.random() * 2,
        type: type
      });
      
      this.stats.totalPackets++;
      this.packetsSentThisSecond++;
      
      // Update connection utilization
      conn.data.utilization = Math.min(100, conn.data.utilization + Math.random() * 5);
    }
  }
  
  updateDeviceStats() {
    this.networkManager.getAllDevices().forEach(device => {
      const data = device.mesh.userData;
      if (data.status === 'offline') return;
      
      // Smoothly vary CPU, memory, bandwidth with some randomness
      data.cpu = Math.max(0, Math.min(100, (data.cpu || 0) + (Math.random() - 0.45) * 10));
      data.memory = Math.max(0, Math.min(100, (data.memory || 0) + (Math.random() - 0.48) * 5));
      data.bandwidth = Math.max(0, Math.min(1000, (data.bandwidth || 0) + (Math.random() - 0.45) * 50));
      data.uptime = (data.uptime || 0) + 0.5;
    });
    
    // Decay connection utilization
    this.networkManager.getAllConnections().forEach(conn => {
      conn.data.utilization = Math.max(0, (conn.data.utilization || 0) - Math.random() * 3);
    });
  }
  
  updateNetworkStats() {
    this.stats.packetsPerSecond = this.packetsSentThisSecond;
    this.packetsSentThisSecond = 0;
    
    const devices = this.networkManager.getAllDevices();
    if (devices.length === 0) {
      this.stats.networkHealth = 100;
      return;
    }
    
    // Calculate avg latency from connection utilization
    const connections = this.networkManager.getAllConnections();
    let totalUtil = 0;
    connections.forEach(c => { totalUtil += c.data.utilization; });
    this.stats.avgLatency = connections.length > 0 
      ? Math.round(2 + (totalUtil / connections.length) * 0.5) 
      : 0;
    
    // Calculate total bandwidth
    let totalBW = 0;
    devices.forEach(d => { totalBW += (d.mesh.userData.bandwidth || 0); });
    this.stats.totalBandwidth = Math.round(totalBW);
    
    // Calculate health score
    let healthPenalty = 0;
    devices.forEach(d => {
      if (d.mesh.userData.status === 'offline') healthPenalty += 15;
      if ((d.mesh.userData.cpu || 0) > 90) healthPenalty += 5;
      if ((d.mesh.userData.memory || 0) > 90) healthPenalty += 3;
    });
    connections.forEach(c => {
      if (c.data.status === 'down') healthPenalty += 10;
      if (c.data.utilization > 80) healthPenalty += 2;
    });
    this.stats.networkHealth = Math.max(0, Math.min(100, 100 - healthPenalty));
    this.stats.packetLoss = Math.max(0, Math.min(100, healthPenalty * 0.3));
    
    this.emit('statsUpdate', this.stats);
  }
  
  generateAlert() {
    const devices = this.networkManager.getAllDevices();
    if (devices.length === 0) return;
    
    const device = devices[Math.floor(Math.random() * devices.length)];
    const data = device.mesh.userData;
    
    let alert = null;
    const rand = Math.random();
    
    if (data.cpu > 80) {
      alert = { severity: 'warning', message: `High CPU (${Math.round(data.cpu)}%) on ${data.name}`, device: data.id };
    } else if (data.memory > 85) {
      alert = { severity: 'warning', message: `High Memory (${Math.round(data.memory)}%) on ${data.name}`, device: data.id };
    } else if (rand < 0.15) {
      alert = { severity: 'critical', message: `Packet loss detected on ${data.name}`, device: data.id };
    } else if (rand < 0.25) {
      alert = { severity: 'info', message: `Routine health check passed: ${data.name}`, device: data.id };
    } else if (rand < 0.3) {
      alert = { severity: 'warning', message: `Latency spike on ${data.name} (${Math.round(5 + Math.random() * 50)}ms)`, device: data.id };
    }
    
    if (alert) {
      alert.id = this.nextAlertId++;
      alert.timestamp = new Date().toLocaleTimeString();
      this.alerts.unshift(alert);
      if (this.alerts.length > 50) this.alerts.pop();
      this.emit('alert', alert);
    }
  }
  
  getStats() { return { ...this.stats }; }
  getAlerts() { return [...this.alerts]; }
  clearAlerts() { this.alerts = []; }
}

import * as THREE from 'three';
import DeviceFactory from './DeviceFactory.js';

export default class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.devices = new Map(); // id -> { mesh: THREE.Group, data: object }
    this.connections = new Map(); // id -> { line: THREE.Object3D, from: string, to: string, data: object }
    this.nextDeviceId = 1;
    this.nextConnectionId = 1;
  }
  
  addDevice(type, position = {x:0, y:0, z:0}, config = {}) {
    const id = config.id || `${type}_${this.nextDeviceId++}`;
    const name = config.name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${this.nextDeviceId}`;
    const ip = config.ip || `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    const deviceConfig = { id, name, ip, position, ...config };
    const mesh = DeviceFactory.createDevice(type, deviceConfig);
    
    this.scene.add(mesh);
    this.devices.set(id, { mesh, data: deviceConfig });
    
    return id;
  }
  
  removeDevice(id) {
    const device = this.devices.get(id);
    if (!device) return;

    // Remove all connections involving this device
    const connectionsToRemove = [];
    this.connections.forEach((conn, connId) => {
      if (conn.from === id || conn.to === id) {
        connectionsToRemove.push(connId);
      }
    });
    connectionsToRemove.forEach(connId => this.removeConnection(connId));

    // Remove mesh from scene
    this.scene.remove(device.mesh);
    device.mesh.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    this.devices.delete(id);
  }
  
  addConnection(fromId, toId, config = {}) {
    if (!this.devices.has(fromId) || !this.devices.has(toId)) return null;

    // Check if connection already exists between these two devices
    for (let conn of this.connections.values()) {
      if ((conn.from === fromId && conn.to === toId) || (conn.from === toId && conn.to === fromId)) {
        return null; // Connection already exists
      }
    }

    const id = `conn_${this.nextConnectionId++}`;
    const fromMesh = this.devices.get(fromId).mesh;
    const toMesh = this.devices.get(toId).mesh;

    const p1 = fromMesh.position;
    const p2 = toMesh.position;

    const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    midPoint.y += Math.min(2, p1.distanceTo(p2) * 0.2); // Raise midpoint

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      midPoint,
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );

    const tubeGeometry = new THREE.TubeGeometry(curve, 32, 0.03, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

    const points = curve.getPoints(50);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3
    });
    const lineMesh = new THREE.Line(lineGeometry, lineMaterial);

    const group = new THREE.Group();
    group.add(tubeMesh);
    group.add(lineMesh);

    this.scene.add(group);

    const data = {
      id,
      bandwidth: config.bandwidth || 100,
      latency: config.latency || 5,
      packetLoss: config.packetLoss || 0,
      status: config.status || 'active',
      utilization: config.utilization || 0
    };

    this.connections.set(id, { line: group, from: fromId, to: toId, data, tubeMesh, lineMesh });
    return id;
  }
  
  removeConnection(id) {
    const conn = this.connections.get(id);
    if (!conn) return;

    this.scene.remove(conn.line);
    conn.line.traverse((child) => {
      if (child.isMesh || child.isLine) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      }
    });

    this.connections.delete(id);
  }
  
  getDevice(id) {
    return this.devices.get(id);
  }
  
  getAllDevices() {
    return Array.from(this.devices.values());
  }
  
  getAllConnections() {
    return Array.from(this.connections.values());
  }
  
  getDeviceIds() {
    return Array.from(this.devices.keys());
  }
  
  updateConnectionVisuals() {
    this.connections.forEach((conn) => {
      const { tubeMesh, lineMesh, data } = conn;
      let color = 0x00ff88;
      let opacity = 0.6;
      let lineOpacity = 0.3;

      if (data.status === 'down') {
        color = 0x333344;
        opacity = 0.2;
        lineOpacity = 0.1;
      } else if (data.utilization > 80) {
        color = 0xff3344;
      } else if (data.utilization > 50) {
        color = 0xff8800;
      } else if (data.utilization > 20) {
        color = 0xffcc00;
      }

      tubeMesh.material.color.setHex(color);
      tubeMesh.material.opacity = opacity;
      lineMesh.material.color.setHex(color);
      lineMesh.material.opacity = lineOpacity;
    });
  }
  
  getConnectedDevices(deviceId) {
    const connected = [];
    this.connections.forEach(conn => {
      if (conn.from === deviceId) connected.push(conn.to);
      if (conn.to === deviceId) connected.push(conn.from);
    });
    return connected;
  }
  
  getConnectionBetween(fromId, toId) {
    for (let conn of this.connections.values()) {
      if ((conn.from === fromId && conn.to === toId) || (conn.from === toId && conn.to === fromId)) {
        return conn;
      }
    }
    return null;
  }
  
  clearAll() {
    const connIds = Array.from(this.connections.keys());
    connIds.forEach(id => this.removeConnection(id));

    const deviceIds = Array.from(this.devices.keys());
    deviceIds.forEach(id => this.removeDevice(id));

    this.nextDeviceId = 1;
    this.nextConnectionId = 1;
  }
  
  loadTopology(name) {
    this.clearAll();
    const topology = TOPOLOGIES[name];
    if (!topology) return;
    topology.devices.forEach(d => this.addDevice(d.type, d.position, { name: d.name, ip: d.ip, id: d.id }));
    topology.connections.forEach(c => this.addConnection(c.from, c.to));
  }
  
  update(deltaTime) {
    const time = performance.now() * 0.001;
    this.devices.forEach((device) => {
      const mesh = device.mesh;
      mesh.position.y = 0.5 + Math.sin(time * 1.5 + mesh.position.x) * 0.05;
      
      if (mesh.userData.glowBase) {
        mesh.userData.glowBase.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
      }
      
      if (mesh.userData.statusLight) {
        mesh.userData.statusLight.material.color.setHex(
          mesh.userData.status === 'online' ? 0x00ff88 : 0xff3344
        );
      }

      if (device.data.type === 'cloud') {
         mesh.rotation.y += deltaTime * 0.2;
      }
    });
    this.updateConnectionVisuals();
  }
}

// TOPOLOGY DEFINITIONS
const TOPOLOGIES = {
  enterprise: {
    devices: [
      { id: 'cloud_1', type: 'cloud', name: 'Internet Cloud', position: {x:0, y:0, z:-18}, ip: '8.8.8.8' },
      { id: 'fw_1', type: 'firewall', name: 'Edge Firewall', position: {x:0, y:0, z:-12}, ip: '10.0.0.1' },
      { id: 'router_1', type: 'router', name: 'Core Router', position: {x:0, y:0, z:-6}, ip: '10.0.1.1' },
      { id: 'switch_1', type: 'switch', name: 'Distribution SW 1', position: {x:-8, y:0, z:0}, ip: '10.0.2.1' },
      { id: 'switch_2', type: 'switch', name: 'Distribution SW 2', position: {x:8, y:0, z:0}, ip: '10.0.3.1' },
      { id: 'server_1', type: 'server', name: 'Web Server', position: {x:-12, y:0, z:6}, ip: '10.0.2.10' },
      { id: 'server_2', type: 'server', name: 'App Server', position: {x:-4, y:0, z:7}, ip: '10.0.2.11' },
      { id: 'db_1', type: 'database', name: 'Primary DB', position: {x:4, y:0, z:7}, ip: '10.0.3.10' },
      { id: 'ws_1', type: 'workstation', name: 'Admin PC', position: {x:10, y:0, z:7}, ip: '10.0.3.100' },
      { id: 'ws_2', type: 'workstation', name: 'Dev Workstation', position: {x:14, y:0, z:4}, ip: '10.0.3.101' },
      { id: 'lb_1', type: 'loadbalancer', name: 'Load Balancer', position: {x:-8, y:0, z:12}, ip: '10.0.2.5' },
    ],
    connections: [
      { from: 'cloud_1', to: 'fw_1' },
      { from: 'fw_1', to: 'router_1' },
      { from: 'router_1', to: 'switch_1' },
      { from: 'router_1', to: 'switch_2' },
      { from: 'switch_1', to: 'server_1' },
      { from: 'switch_1', to: 'server_2' },
      { from: 'switch_1', to: 'lb_1' },
      { from: 'switch_2', to: 'db_1' },
      { from: 'switch_2', to: 'ws_1' },
      { from: 'switch_2', to: 'ws_2' },
      { from: 'server_1', to: 'db_1' },
      { from: 'lb_1', to: 'server_1' },
      { from: 'lb_1', to: 'server_2' },
    ]
  },
  datacenter: {
    devices: [
      { id: 'fw_1', type: 'firewall', name: 'DC Firewall', position: {x:0, y:0, z:-12}, ip: '172.16.0.1' },
      { id: 'lb_1', type: 'loadbalancer', name: 'LB Primary', position: {x:-4, y:0, z:-6}, ip: '172.16.1.10' },
      { id: 'lb_2', type: 'loadbalancer', name: 'LB Secondary', position: {x:4, y:0, z:-6}, ip: '172.16.1.11' },
      { id: 'server_1', type: 'server', name: 'Web Srv 01', position: {x:-10, y:0, z:0}, ip: '172.16.2.10' },
      { id: 'server_2', type: 'server', name: 'Web Srv 02', position: {x:-5, y:0, z:0}, ip: '172.16.2.11' },
      { id: 'server_3', type: 'server', name: 'App Srv 01', position: {x:0, y:0, z:0}, ip: '172.16.2.20' },
      { id: 'server_4', type: 'server', name: 'App Srv 02', position: {x:5, y:0, z:0}, ip: '172.16.2.21' },
      { id: 'server_5', type: 'server', name: 'Cache Srv', position: {x:10, y:0, z:0}, ip: '172.16.2.30' },
      { id: 'switch_1', type: 'switch', name: 'Core Switch', position: {x:0, y:0, z:6}, ip: '172.16.3.1' },
      { id: 'db_1', type: 'database', name: 'Master DB', position: {x:-6, y:0, z:12}, ip: '172.16.4.10' },
      { id: 'db_2', type: 'database', name: 'Replica DB', position: {x:6, y:0, z:12}, ip: '172.16.4.11' },
      { id: 'cloud_1', type: 'cloud', name: 'Cloud Backup', position: {x:0, y:0, z:18}, ip: '172.16.5.1' },
    ],
    connections: [
      { from: 'fw_1', to: 'lb_1' },
      { from: 'fw_1', to: 'lb_2' },
      { from: 'lb_1', to: 'server_1' },
      { from: 'lb_1', to: 'server_2' },
      { from: 'lb_2', to: 'server_3' },
      { from: 'lb_2', to: 'server_4' },
      { from: 'lb_2', to: 'server_5' },
      { from: 'server_1', to: 'switch_1' },
      { from: 'server_2', to: 'switch_1' },
      { from: 'server_3', to: 'switch_1' },
      { from: 'server_4', to: 'switch_1' },
      { from: 'server_5', to: 'switch_1' },
      { from: 'switch_1', to: 'db_1' },
      { from: 'switch_1', to: 'db_2' },
      { from: 'db_1', to: 'db_2' },
      { from: 'db_1', to: 'cloud_1' },
    ]
  },
  home: {
    devices: [
      { id: 'cloud_1', type: 'cloud', name: 'Internet', position: {x:0, y:0, z:-12}, ip: '8.8.8.8' },
      { id: 'router_1', type: 'router', name: 'Home Router', position: {x:0, y:0, z:-4}, ip: '192.168.1.1' },
      { id: 'switch_1', type: 'switch', name: 'Home Switch', position: {x:0, y:0, z:2}, ip: '192.168.1.2' },
      { id: 'ws_1', type: 'workstation', name: 'Desktop PC', position: {x:-8, y:0, z:8}, ip: '192.168.1.100' },
      { id: 'ws_2', type: 'workstation', name: 'Laptop', position: {x:-3, y:0, z:8}, ip: '192.168.1.101' },
      { id: 'ws_3', type: 'workstation', name: 'Smart TV', position: {x:3, y:0, z:8}, ip: '192.168.1.102' },
      { id: 'server_1', type: 'server', name: 'NAS Server', position: {x:8, y:0, z:8}, ip: '192.168.1.200' },
    ],
    connections: [
      { from: 'cloud_1', to: 'router_1' },
      { from: 'router_1', to: 'switch_1' },
      { from: 'switch_1', to: 'ws_1' },
      { from: 'switch_1', to: 'ws_2' },
      { from: 'switch_1', to: 'ws_3' },
      { from: 'switch_1', to: 'server_1' },
    ]
  },
  iot: {
    devices: [
      { id: 'cloud_1', type: 'cloud', name: 'IoT Cloud', position: {x:0, y:0, z:-14}, ip: '10.10.0.1' },
      { id: 'router_1', type: 'router', name: 'IoT Gateway', position: {x:0, y:0, z:-6}, ip: '10.10.1.1' },
      { id: 'switch_1', type: 'switch', name: 'Sensor Hub 1', position: {x:-8, y:0, z:0}, ip: '10.10.2.1' },
      { id: 'switch_2', type: 'switch', name: 'Sensor Hub 2', position: {x:8, y:0, z:0}, ip: '10.10.3.1' },
      { id: 'ws_1', type: 'workstation', name: 'Sensor A1', position: {x:-14, y:0, z:6}, ip: '10.10.2.101' },
      { id: 'ws_2', type: 'workstation', name: 'Sensor A2', position: {x:-10, y:0, z:8}, ip: '10.10.2.102' },
      { id: 'ws_3', type: 'workstation', name: 'Sensor A3', position: {x:-6, y:0, z:6}, ip: '10.10.2.103' },
      { id: 'ws_4', type: 'workstation', name: 'Sensor B1', position: {x:6, y:0, z:6}, ip: '10.10.3.101' },
      { id: 'ws_5', type: 'workstation', name: 'Sensor B2', position: {x:10, y:0, z:8}, ip: '10.10.3.102' },
      { id: 'ws_6', type: 'workstation', name: 'Sensor B3', position: {x:14, y:0, z:6}, ip: '10.10.3.103' },
      { id: 'server_1', type: 'server', name: 'Data Collector', position: {x:0, y:0, z:4}, ip: '10.10.1.10' },
      { id: 'db_1', type: 'database', name: 'Time Series DB', position: {x:0, y:0, z:10}, ip: '10.10.1.20' },
    ],
    connections: [
      { from: 'cloud_1', to: 'router_1' },
      { from: 'router_1', to: 'switch_1' },
      { from: 'router_1', to: 'switch_2' },
      { from: 'router_1', to: 'server_1' },
      { from: 'switch_1', to: 'ws_1' },
      { from: 'switch_1', to: 'ws_2' },
      { from: 'switch_1', to: 'ws_3' },
      { from: 'switch_2', to: 'ws_4' },
      { from: 'switch_2', to: 'ws_5' },
      { from: 'switch_2', to: 'ws_6' },
      { from: 'server_1', to: 'db_1' },
    ]
  },
  mesh: {
    devices: [
      { id: 'router_1', type: 'router', name: 'Node Alpha', position: {x:0, y:0, z:-8}, ip: '10.0.0.1' },
      { id: 'router_2', type: 'router', name: 'Node Beta', position: {x:-7, y:0, z:-3}, ip: '10.0.0.2' },
      { id: 'router_3', type: 'router', name: 'Node Gamma', position: {x:7, y:0, z:-3}, ip: '10.0.0.3' },
      { id: 'router_4', type: 'router', name: 'Node Delta', position: {x:-7, y:0, z:5}, ip: '10.0.0.4' },
      { id: 'router_5', type: 'router', name: 'Node Epsilon', position: {x:7, y:0, z:5}, ip: '10.0.0.5' },
      { id: 'router_6', type: 'router', name: 'Node Zeta', position: {x:0, y:0, z:10}, ip: '10.0.0.6' },
    ],
    connections: [
      { from: 'router_1', to: 'router_2' },
      { from: 'router_1', to: 'router_3' },
      { from: 'router_2', to: 'router_3' },
      { from: 'router_2', to: 'router_4' },
      { from: 'router_3', to: 'router_5' },
      { from: 'router_4', to: 'router_5' },
      { from: 'router_4', to: 'router_6' },
      { from: 'router_5', to: 'router_6' },
      { from: 'router_1', to: 'router_4' },
      { from: 'router_1', to: 'router_5' },
      { from: 'router_2', to: 'router_6' },
      { from: 'router_3', to: 'router_6' },
    ]
  }
};

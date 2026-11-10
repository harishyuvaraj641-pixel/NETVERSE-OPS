export default class UIManager {
  constructor(networkManager, simulationEngine, interactionManager) {
    this.networkManager = networkManager;
    this.simulationEngine = simulationEngine;
    this.interactionManager = interactionManager;
    this.updateTimer = 0;
    
    this.initEventListeners();
    this.setupSimulationCallbacks();
  }
  
  initEventListeners() {
    // Sidebar toggle
    document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
      document.getElementById('left-sidebar').classList.toggle('collapsed');
    });
    
    // Load topology
    document.getElementById('btn-load-topology').addEventListener('click', () => {
      const topology = document.getElementById('topology-select').value;
      this.networkManager.loadTopology(topology);
      this.updateDeviceList();
      this.updateCounts();
    });
    
    // Add device modal
    document.getElementById('btn-add-device').addEventListener('click', () => {
      this.openAddDeviceModal();
    });
    
    // Clear all
    document.getElementById('btn-clear-all').addEventListener('click', () => {
      this.networkManager.clearAll();
      this.updateDeviceList();
      this.updateCounts();
      this.interactionManager.deselectDevice();
    });
    
    // Simulation controls
    document.getElementById('btn-toggle-sim').addEventListener('click', () => {
      const running = this.simulationEngine.toggle();
      document.getElementById('btn-toggle-sim').textContent = running ? '⏸' : '▶';
      document.getElementById('btn-toggle-sim').title = running ? 'Pause Simulation' : 'Start Simulation';
    });
    
    document.getElementById('btn-speed-up').addEventListener('click', () => {
      this.simulationEngine.setSpeed(this.simulationEngine.speed + 0.5);
      document.getElementById('sim-speed-display').textContent = this.simulationEngine.speed.toFixed(1) + 'x';
    });
    
    document.getElementById('btn-speed-down').addEventListener('click', () => {
      this.simulationEngine.setSpeed(this.simulationEngine.speed - 0.5);
      document.getElementById('sim-speed-display').textContent = this.simulationEngine.speed.toFixed(1) + 'x';
    });
    
    // Right panel close
    document.getElementById('right-panel-close').addEventListener('click', () => {
      this.hideDeviceInfo();
      this.interactionManager.deselectDevice();
    });
    
    // Remove device
    document.getElementById('btn-remove-device').addEventListener('click', () => {
      if (this.interactionManager.selectedDevice) {
        const id = this.interactionManager.selectedDevice.userData.id;
        this.networkManager.removeDevice(id);
        this.hideDeviceInfo();
        this.interactionManager.deselectDevice();
        this.updateDeviceList();
        this.updateCounts();
      }
    });
    
    // Toggle device status
    document.getElementById('btn-toggle-status').addEventListener('click', () => {
      if (this.interactionManager.selectedDevice) {
        const data = this.interactionManager.selectedDevice.userData;
        data.status = data.status === 'online' ? 'offline' : 'online';
        this.showDeviceInfo(data);
      }
    });
    
    // Modal buttons
    document.getElementById('btn-modal-add').addEventListener('click', () => {
      this.addDeviceFromModal();
    });
    document.getElementById('btn-modal-cancel').addEventListener('click', () => {
      this.closeAddDeviceModal();
    });
    
    // Clear alerts
    document.getElementById('btn-clear-alerts').addEventListener('click', () => {
      this.simulationEngine.clearAlerts();
      document.getElementById('alert-list').innerHTML = '';
    });

    // Integrated Projects (Netverse Ops)
    this.setupProjectIntegrations();
    
    // Device selection callback
    this.interactionManager.onSelectCallback = (deviceData) => {
      if (deviceData) {
        this.showDeviceInfo(deviceData);
      } else {
        this.hideDeviceInfo();
      }
    };
  }
  
  setupSimulationCallbacks() {
    this.simulationEngine.on('alert', (alert) => {
      this.addAlert(alert);
    });
    
    this.simulationEngine.on('statsUpdate', (stats) => {
      this.updateStats(stats);
    });
  }
  
  update(deltaTime) {
    this.updateTimer += deltaTime;
    if (this.updateTimer > 0.5) {
      this.updateTimer = 0;
      this.updateCounts();
      this.updateStats(this.simulationEngine.getStats());
      
      // Update right panel if a device is selected
      if (this.interactionManager.selectedDevice) {
        this.showDeviceInfo(this.interactionManager.selectedDevice.userData);
      }
    }
  }
  
  updateCounts() {
    document.getElementById('device-count').textContent = this.networkManager.devices.size;
    document.getElementById('connection-count').textContent = this.networkManager.connections.size;
  }
  
  updateStats(stats) {
    document.getElementById('network-health').textContent = Math.round(stats.networkHealth) + '%';
    document.getElementById('traffic-rate').textContent = stats.packetsPerSecond + ' pkt/s';
    document.getElementById('bandwidth-total').textContent = stats.totalBandwidth + ' Mbps';
    
    // Update health bar
    const healthBar = document.querySelector('#health-bar .health-bar-fill');
    if (healthBar) {
      healthBar.style.width = stats.networkHealth + '%';
      if (stats.networkHealth > 70) healthBar.style.background = '#00ff88';
      else if (stats.networkHealth > 40) healthBar.style.background = '#ff8800';
      else healthBar.style.background = '#ff3344';
    }
  }
  
  showDeviceInfo(data) {
    const panel = document.getElementById('right-panel');
    panel.classList.remove('hidden');
    
    document.getElementById('device-name').textContent = data.name;
    document.getElementById('device-type').textContent = data.type.toUpperCase();
    document.getElementById('device-ip').textContent = data.ip;
    document.getElementById('device-status').textContent = data.status;
    document.getElementById('device-status').className = 'info-value status-' + data.status;
    document.getElementById('device-uptime').textContent = this.formatUptime(data.uptime || 0);
    document.getElementById('device-mac').textContent = data.mac || '-';
    
    // Update metric bars
    const cpu = Math.round(data.cpu || 0);
    const mem = Math.round(data.memory || 0);
    const bw = Math.min(100, Math.round((data.bandwidth || 0) / 10));
    
    document.getElementById('device-cpu').style.width = cpu + '%';
    document.getElementById('device-cpu-val').textContent = cpu + '%';
    document.getElementById('device-memory').style.width = mem + '%';
    document.getElementById('device-memory-val').textContent = mem + '%';
    document.getElementById('device-bandwidth').style.width = bw + '%';
    document.getElementById('device-bandwidth-val').textContent = Math.round(data.bandwidth || 0) + ' Mbps';
    
    // Color metric bars based on value
    this.colorMetricBar('device-cpu', cpu);
    this.colorMetricBar('device-memory', mem);
  }
  
  colorMetricBar(id, value) {
    const el = document.getElementById(id);
    if (value > 80) el.style.background = '#ff3344';
    else if (value > 60) el.style.background = '#ff8800';
    else el.style.background = '#00f0ff';
  }
  
  hideDeviceInfo() {
    document.getElementById('right-panel').classList.add('hidden');
  }
  
  updateDeviceList() {
    const list = document.getElementById('device-list');
    list.innerHTML = '';
    
    this.networkManager.getAllDevices().forEach(device => {
      const data = device.mesh.userData;
      const item = document.createElement('div');
      item.className = 'device-list-item';
      item.setAttribute('data-id', data.id);
      item.innerHTML = `
        <span class="device-dot" style="background: #${DeviceFactory_getColor(data.type)}"></span>
        <div class="device-list-info">
          <span class="device-list-name">${data.name}</span>
          <span class="device-list-type">${data.type} | ${data.ip}</span>
        </div>
        <span class="device-list-status ${data.status}">${data.status === 'online' ? '●' : '○'}</span>
      `;
      item.addEventListener('click', () => {
        const dev = this.networkManager.getDevice(data.id);
        if (dev) {
          this.interactionManager.selectDevice(dev.mesh);
        }
      });
      list.appendChild(item);
    });
  }
  
  addAlert(alert) {
    const list = document.getElementById('alert-list');
    const item = document.createElement('div');
    item.className = `alert-item alert-${alert.severity}`;
    const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
    item.innerHTML = `
      <span class="alert-time">${alert.timestamp}</span>
      <span class="alert-icon">${icon}</span>
      <span class="alert-message">${alert.message}</span>
    `;
    list.insertBefore(item, list.firstChild);
    
    // Keep only last 20 alerts in DOM
    while (list.children.length > 20) {
      list.removeChild(list.lastChild);
    }
  }
  
  openAddDeviceModal() {
    document.getElementById('add-device-modal').classList.remove('hidden');
    
    // Populate connect-to dropdown
    const select = document.getElementById('modal-connect-to');
    select.innerHTML = '<option value="">-- None --</option>';
    this.networkManager.getAllDevices().forEach(device => {
      const opt = document.createElement('option');
      opt.value = device.mesh.userData.id;
      opt.textContent = device.mesh.userData.name;
      select.appendChild(opt);
    });
    
    // Default name and IP
    document.getElementById('modal-device-name').value = '';
    document.getElementById('modal-device-ip').value = '';
  }
  
  closeAddDeviceModal() {
    document.getElementById('add-device-modal').classList.add('hidden');
  }
  
  addDeviceFromModal() {
    const type = document.getElementById('modal-device-type').value;
    const name = document.getElementById('modal-device-name').value || (type.charAt(0).toUpperCase() + type.slice(1) + ' ' + (this.networkManager.devices.size + 1));
    const ip = document.getElementById('modal-device-ip').value || this.generateIP();
    const connectTo = document.getElementById('modal-connect-to').value;
    
    // Position: random within grid area
    const position = {
      x: (Math.random() - 0.5) * 20,
      y: 0,
      z: (Math.random() - 0.5) * 20
    };
    
    const deviceId = this.networkManager.addDevice(type, position, { name, ip });
    
    // Connect to selected device if specified
    if (connectTo) {
      this.networkManager.addConnection(deviceId, connectTo);
    }
    
    this.closeAddDeviceModal();
    this.updateDeviceList();
    this.updateCounts();
  }
  
  setupProjectIntegrations() {
    const netverseModal = document.getElementById('netverse-modal');
    const netverseIframe = document.getElementById('netverse-iframe');
    const netverseLoader = document.getElementById('netverse-loader');
    const btnOpenNetverse = document.getElementById('btn-open-netverse');
    const btnSidebarNetverse = document.getElementById('btn-sidebar-netverse');
    const btnCloseNetverse = document.getElementById('btn-netverse-close');
    const btnPopout = document.getElementById('btn-netverse-popout');
    const btnFullscreen = document.getElementById('btn-netverse-fullscreen');

    const netversePath = './netverse/index.html';

    const openNetverse = () => {
      if (!netverseModal) return;
      netverseModal.classList.remove('hidden');
      if (netverseIframe && (!netverseIframe.src || netverseIframe.src === 'about:blank' || !netverseIframe.src.includes('netverse'))) {
        if (netverseLoader) netverseLoader.style.display = 'flex';
        netverseIframe.src = netversePath;
        netverseIframe.onload = () => {
          if (netverseLoader) netverseLoader.style.display = 'none';
        };
      }
    };

    const closeNetverse = () => {
      if (!netverseModal) return;
      netverseModal.classList.add('hidden');
    };

    if (btnOpenNetverse) {
      btnOpenNetverse.addEventListener('click', openNetverse);
    }
    if (btnSidebarNetverse) {
      btnSidebarNetverse.addEventListener('click', openNetverse);
    }
    if (btnCloseNetverse) {
      btnCloseNetverse.addEventListener('click', closeNetverse);
    }

    const backdrop = document.querySelector('.project-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeNetverse);
    }

    if (btnPopout) {
      btnPopout.addEventListener('click', () => {
        window.open(netversePath, '_blank');
      });
    }

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        const container = document.querySelector('.project-modal-container');
        if (container) {
          const isFull = container.classList.toggle('fullscreen');
          btnFullscreen.textContent = isFull ? '❐ Windowed' : '⛶ Fullscreen';
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && netverseModal && !netverseModal.classList.contains('hidden')) {
        closeNetverse();
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CLOSE_NETVERSE') {
        closeNetverse();
      }
    });
  }

  generateIP() {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
  }
  
  formatUptime(seconds) {
    if (seconds < 60) return Math.round(seconds) + 's';
    if (seconds < 3600) return Math.round(seconds / 60) + 'm';
    return Math.round(seconds / 3600) + 'h ' + Math.round((seconds % 3600) / 60) + 'm';
  }
}

// Helper to get device color as hex string (for DOM styling)
function DeviceFactory_getColor(type) {
  const colors = {
    router: '00aaff',
    switch: '00ff88',
    server: '8899aa',
    firewall: 'ff8800',
    workstation: 'ccddee',
    cloud: '44ccff',
    database: 'aa44ff',
    loadbalancer: 'ffcc00'
  };
  return colors[type] || 'ffffff';
}

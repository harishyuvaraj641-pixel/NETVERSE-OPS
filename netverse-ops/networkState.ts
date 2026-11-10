import {NetworkDevice, Mission, NetworkAlert, TopologyLink, DeviceStatus, PhysicalCable} from './types';

export const INITIAL_DEVICES: NetworkDevice[] = [
  {
    id: 'NOC-CONSOLE-01',
    name: 'NOC Master Console',
    type: 'terminal',
    zone: 'Sector A',
    roomName: 'Central Operations Center',
    position: [0, 0, 7.5],
    rotation: [0, Math.PI, 0],
    ip: '10.0.0.2',
    mac: '00:1A:2B:3C:4D:01',
    status: 'normal',
    telemetry: {
      cpu: 18,
      memory: 34,
      temperature: 24,
      inTraffic: 840,
      outTraffic: 720,
      latency: 2,
      uptime: '142d 08h 12m',
      packetLoss: 0,
    },
    connectedTo: ['R-01', 'SW-01'],
    firmware: 'NetOS Terminal v4.2.1',
    description: 'Central operations console connected to all digital twin telemetries.',
  },
  {
    id: 'R-01',
    name: 'Core Gateway Router R-01',
    type: 'router',
    zone: 'Sector C',
    roomName: 'Core Routing Bay',
    position: [16, 0, 10],
    rotation: [0, -Math.PI / 2, 0],
    ip: '192.168.1.1',
    mac: '00:1A:2B:3C:4D:10',
    status: 'critical', // Starts in failure for Mission 1!
    telemetry: {
      cpu: 99,
      memory: 94,
      temperature: 68,
      inTraffic: 12,
      outTraffic: 4,
      latency: 480,
      uptime: '0d 00h 14m',
      packetLoss: 98,
    },
    connectedTo: ['INTERNET-GW', 'FW-01', 'SW-01'],
    firmware: 'Enterprise RouterOS 15.4(3)M',
    description: 'Tier-1 BGP border router connecting datacenter to primary optical backbone.',
  },
  {
    id: 'R-02',
    name: 'Redundant Edge Router R-02',
    type: 'router',
    zone: 'Sector C',
    roomName: 'Core Routing Bay',
    position: [16, 0, 4],
    rotation: [0, -Math.PI / 2, 0],
    ip: '192.168.1.2',
    mac: '00:1A:2B:3C:4D:11',
    status: 'normal',
    telemetry: {
      cpu: 31,
      memory: 45,
      temperature: 36,
      inTraffic: 420,
      outTraffic: 390,
      latency: 5,
      uptime: '89d 14h 22m',
      packetLoss: 0.1,
    },
    connectedTo: ['INTERNET-GW', 'FW-02'],
    firmware: 'Enterprise RouterOS 15.4(3)M',
    description: 'Secondary hot-standby edge routing node with VRRP failover capability.',
  },
  {
    id: 'FW-01',
    name: 'Perimeter NGFW FW-01',
    type: 'firewall',
    zone: 'Sector E',
    roomName: 'Security Vault',
    position: [14, 0, -10],
    rotation: [0, -Math.PI / 2, 0],
    ip: '10.0.10.1',
    mac: '00:1A:2B:3C:4D:20',
    status: 'normal',
    telemetry: {
      cpu: 44,
      memory: 52,
      temperature: 38,
      inTraffic: 1200,
      outTraffic: 1150,
      latency: 4,
      uptime: '45d 02h 19m',
      packetLoss: 0.05,
    },
    connectedTo: ['R-01', 'SW-01', 'SW-02'],
    firmware: 'FortiShield ThreatEngine v7.4',
    description: 'Hardware Deep Packet Inspection firewall with IPS and zero-day threat defense.',
  },
  {
    id: 'FW-02',
    name: 'Internal Segment Firewall FW-02',
    type: 'firewall',
    zone: 'Sector E',
    roomName: 'Security Vault',
    position: [14, 0, -16],
    rotation: [0, -Math.PI / 2, 0],
    ip: '10.0.10.2',
    mac: '00:1A:2B:3C:4D:21',
    status: 'normal',
    telemetry: {
      cpu: 28,
      memory: 38,
      temperature: 34,
      inTraffic: 610,
      outTraffic: 590,
      latency: 3,
      uptime: '110d 19h 05m',
      packetLoss: 0,
    },
    connectedTo: ['R-02', 'SW-02'],
    firmware: 'FortiShield ThreatEngine v7.4',
    description: 'Zero-trust microsegmentation gateway securing critical database subnets.',
  },
  {
    id: 'SW-01',
    name: 'Core Distribution Switch SW-01',
    type: 'switch',
    zone: 'Sector D',
    roomName: 'Distribution Switch Bay',
    position: [-14, 0, -10],
    rotation: [0, Math.PI / 2, 0],
    ip: '10.0.20.1',
    mac: '00:1A:2B:3C:4D:30',
    status: 'normal',
    telemetry: {
      cpu: 35,
      memory: 40,
      temperature: 32,
      inTraffic: 2400,
      outTraffic: 2380,
      latency: 1.5,
      uptime: '77d 12h 45m',
      packetLoss: 0,
    },
    connectedTo: ['FW-01', 'SRV-01', 'SRV-02', 'SRV-04'],
    firmware: 'Nexus FabricSwitch OS 10.2',
    description: '100GbE QSFP28 aggregation switch connecting server farm racks.',
  },
  {
    id: 'SW-02',
    name: 'Access Switch SW-02',
    type: 'switch',
    zone: 'Sector D',
    roomName: 'Distribution Switch Bay',
    position: [-14, 0, -16],
    rotation: [0, Math.PI / 2, 0],
    ip: '10.0.20.2',
    mac: '00:1A:2B:3C:4D:31',
    status: 'normal',
    telemetry: {
      cpu: 22,
      memory: 33,
      temperature: 30,
      inTraffic: 480,
      outTraffic: 470,
      latency: 2,
      uptime: '62d 07h 11m',
      packetLoss: 0,
    },
    connectedTo: ['FW-01', 'PC-LAB-01', 'AP-CORP-01'],
    firmware: 'Catalyst Edge OS 17.6',
    description: '48-Port PoE+ Gigabit access switch servicing office and wireless endpoints.',
  },
  {
    id: 'SRV-01',
    name: 'Cloud Application Blade SRV-01',
    type: 'server_rack',
    zone: 'Sector B',
    roomName: 'Server Farm Alpha',
    position: [-16, 0, 10],
    rotation: [0, Math.PI / 2, 0],
    ip: '10.0.30.11',
    mac: '00:1A:2B:3C:4D:40',
    status: 'normal',
    telemetry: {
      cpu: 48,
      memory: 62,
      temperature: 36,
      inTraffic: 720,
      outTraffic: 690,
      latency: 3,
      uptime: '95d 11h 00m',
      packetLoss: 0,
    },
    connectedTo: ['SW-01'],
    firmware: 'ComputeBlade Hypervisor 8.0',
    description: 'Kubernetes container cluster node running critical microservices.',
  },
  {
    id: 'SRV-02',
    name: 'Database Cluster Node SRV-02',
    type: 'server_rack',
    zone: 'Sector B',
    roomName: 'Server Farm Alpha',
    position: [-16, 0, 4],
    rotation: [0, Math.PI / 2, 0],
    ip: '10.0.30.12',
    mac: '00:1A:2B:3C:4D:41',
    status: 'normal',
    telemetry: {
      cpu: 55,
      memory: 78,
      temperature: 42,
      inTraffic: 890,
      outTraffic: 870,
      latency: 2.2,
      uptime: '120d 05h 30m',
      packetLoss: 0,
    },
    connectedTo: ['SW-01'],
    firmware: 'ComputeBlade Hypervisor 8.0',
    description: 'Distributed PostgreSQL relational database instance with NVMe caching.',
  },
  {
    id: 'SRV-04',
    name: 'High-Density Storage SRV-04',
    type: 'server_rack',
    zone: 'Sector B',
    roomName: 'Server Farm Alpha',
    position: [-16, 0, 16],
    rotation: [0, Math.PI / 2, 0],
    ip: '10.0.30.14',
    mac: '00:1A:2B:3C:4D:43',
    status: 'normal',
    telemetry: {
      cpu: 42,
      memory: 65,
      temperature: 39,
      inTraffic: 1450,
      outTraffic: 1390,
      latency: 3.5,
      uptime: '15d 18h 44m',
      packetLoss: 0,
    },
    connectedTo: ['SW-01'],
    firmware: 'SanStorage OS 5.3',
    description: 'PB-scale petabyte SAN storage array with redundant cooling banks.',
  },
  {
    id: 'PC-LAB-01',
    name: 'Network Lab Workstation 01',
    type: 'workstation',
    zone: 'Sector F',
    roomName: 'Computer Laboratory',
    position: [-16, 0, -26],
    rotation: [0, 0, 0],
    ip: '10.0.40.101',
    mac: '00:1A:2B:3C:4D:50',
    status: 'normal',
    telemetry: {
      cpu: 15,
      memory: 28,
      temperature: 26,
      inTraffic: 45,
      outTraffic: 22,
      latency: 4,
      uptime: '3d 04h 15m',
      packetLoss: 0,
    },
    connectedTo: ['SW-02'],
    firmware: 'Enterprise Workstation OS 11',
    description: 'Engineer diagnostics console with Wireshark and protocol analyzers.',
  },
  {
    id: 'AP-CORP-01',
    name: 'Enterprise Wi-Fi 6E AP-01',
    type: 'wifi_ap',
    zone: 'Sector G',
    roomName: 'Wireless Pavilion',
    position: [16, 0, -26],
    rotation: [0, 0, 0],
    ip: '10.0.50.1',
    mac: '00:1A:2B:3C:4D:60',
    status: 'normal',
    telemetry: {
      cpu: 24,
      memory: 31,
      temperature: 29,
      inTraffic: 180,
      outTraffic: 165,
      latency: 6,
      uptime: '40d 09h 12m',
      packetLoss: 0.2,
    },
    connectedTo: ['SW-02'],
    firmware: 'WLAN Controller OS 9.1',
    description: 'Tri-band high-density 802.11ax wireless access point supporting 200+ clients.',
  },
];

export const INITIAL_CABLES: PhysicalCable[] = [
  {
    id: 'CBL-01',
    name: 'Optical Trunk Alpha (R-01 to FW-01)',
    color: '#06b6d4', // Cyan Fiber
    cableType: 'fiber',
    fromDeviceId: 'R-01',
    fromPort: 'TenGigE 0/0/1',
    fromPos: [15.6, 1.3, 10.2],
    toDeviceId: 'FW-01',
    toPort: 'Port 1 (WAN)',
    toPos: [13.6, 1.25, -9.8],
    plugged: true,
    speed: '40 Gbps',
  },
  {
    id: 'CBL-02',
    name: 'Optical Trunk Beta (R-02 to FW-02)',
    color: '#6366f1', // Indigo Fiber
    cableType: 'fiber',
    fromDeviceId: 'R-02',
    fromPort: 'TenGigE 0/0/2',
    fromPos: [15.6, 1.3, 4.2],
    toDeviceId: 'FW-02',
    toPort: 'Port 1 (WAN)',
    toPos: [13.6, 1.25, -15.8],
    plugged: true,
    speed: '40 Gbps',
  },
  {
    id: 'CBL-03',
    name: 'Security Vault Interlink (FW-01 to SW-01)',
    color: '#ef4444', // Red Critical Trunk
    cableType: 'fiber',
    fromDeviceId: 'FW-01',
    fromPort: 'Port 2 (Core Fabric)',
    fromPos: [13.6, 1.2, -10.2],
    toDeviceId: 'SW-01',
    toPort: 'Uplink QSFP-1',
    toPos: [-13.6, 1.2, -9.8],
    plugged: true,
    speed: '100 Gbps',
  },
  {
    id: 'CBL-04',
    name: 'Distribution Patch (SW-01 to SRV-01)',
    color: '#10b981', // Emerald Fiber
    cableType: 'fiber',
    fromDeviceId: 'SW-01',
    fromPort: 'Blade Port 1',
    fromPos: [-13.6, 1.15, -10.1],
    toDeviceId: 'SRV-01',
    toPort: 'NIC 1 (Host)',
    toPos: [-15.5, 1.25, 10.4],
    plugged: true,
    speed: '25 Gbps',
  },
  {
    id: 'CBL-05',
    name: 'Database Fabric Link (SW-01 to SRV-02)',
    color: '#3b82f6', // Blue Fiber
    cableType: 'fiber',
    fromDeviceId: 'SW-01',
    fromPort: 'Blade Port 2',
    fromPos: [-13.6, 1.15, -9.9],
    toDeviceId: 'SRV-02',
    toPort: 'NIC 1 (Host)',
    toPos: [-15.5, 1.25, 4.4],
    plugged: true,
    speed: '25 Gbps',
  },
  {
    id: 'CBL-06',
    name: 'SAN Storage Optical Bus (SW-01 to SRV-04)',
    color: '#a855f7', // Purple Fiber
    cableType: 'fiber',
    fromDeviceId: 'SW-01',
    fromPort: 'Blade Port 4',
    fromPos: [-13.6, 1.15, -10.3],
    toDeviceId: 'SRV-04',
    toPort: 'FC HBA 1',
    toPos: [-15.5, 1.25, 16.4],
    plugged: true,
    speed: '50 Gbps',
  },
  {
    id: 'CBL-07',
    name: 'Lab Workstation Cat6A (SW-02 to PC-LAB-01)',
    color: '#f59e0b', // Yellow Copper
    cableType: 'copper',
    fromDeviceId: 'SW-02',
    fromPort: 'GigabitEth 0/24',
    fromPos: [-13.6, 1.2, -15.8],
    toDeviceId: 'PC-LAB-01',
    toPort: 'RJ45 LAN 1',
    toPos: [-15.4, 0.8, -25.8],
    plugged: true,
    speed: '1 Gbps',
  },
  {
    id: 'CBL-08',
    name: 'Ceiling PoE+ Drop (SW-02 to AP-CORP-01)',
    color: '#06b6d4', // Cyan PoE
    cableType: 'copper',
    fromDeviceId: 'SW-02',
    fromPort: 'PoE+ Port 48',
    fromPos: [-13.6, 1.25, -16.2],
    toDeviceId: 'AP-CORP-01',
    toPort: 'PoE In (2.5G)',
    toPos: [16.0, 4.15, -26.0],
    plugged: true,
    speed: '2.5 Gbps',
  },
  {
    id: 'CBL-09',
    name: 'Access Switch Trunk (FW-01 to SW-02)',
    color: '#ec4899', // Pink Fiber
    cableType: 'fiber',
    fromDeviceId: 'FW-01',
    fromPort: 'Port 3 (Access Trunk)',
    fromPos: [13.6, 1.15, -10.5],
    toDeviceId: 'SW-02',
    toPort: 'Trunk Port 1',
    toPos: [-13.6, 1.3, -16.5],
    plugged: true,
    speed: '10 Gbps',
  },
  {
    id: 'CBL-10',
    name: 'NOC Terminal Fiber Uplink (NOC-CONSOLE-01 to SW-01)',
    color: '#14b8a6', // Teal Fiber
    cableType: 'fiber',
    fromDeviceId: 'NOC-CONSOLE-01',
    fromPort: 'Fiber NIC 1',
    fromPos: [0.6, 0.9, 7.8],
    toDeviceId: 'SW-01',
    toPort: 'Mgmt Port 1',
    toPos: [-13.6, 1.25, -9.5],
    plugged: true,
    speed: '10 Gbps',
  },
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Mission 1: Core Router Outage',
    codeName: 'OPERATION GATEKEEPER',
    description:
      'Critical BGP drop detected on R-01! Datacenter uplink is isolated. Navigate to the Core Routing Bay, inspect R-01, and perform a cold reboot & routing table reload.',
    targetDeviceId: 'R-01',
    targetRoom: 'Core Routing Bay (Sector C)',
    targetPosition: [16, 0, 10],
    actionRequired: 'reboot',
    actionName: 'REBOOT ROUTER R-01',
    completed: false,
    explanation: 'Re-initializing routing daemon and flushing corrupted BGP cache.',
  },
  {
    id: 2,
    title: 'Mission 2: Switch Disconnection',
    codeName: 'OPERATION SYN-FLOOD',
    description:
      'Distribution Switch SW-02 fiber uplink was desynchronized. Computer lab and wireless AP lost trunk access. Navigate to Distribution Switch Bay, inspect SW-02, and re-link the trunk port.',
    targetDeviceId: 'SW-02',
    targetRoom: 'Distribution Switch Bay (Sector D)',
    targetPosition: [-14, 0, -16],
    actionRequired: 'reconnect',
    actionName: 'RE-ESTABLISH TRUNK LINK',
    completed: false,
    explanation: 'Re-enabling LACP link aggregation and restoring 802.1Q VLAN trunking.',
  },
  {
    id: 3,
    title: 'Mission 3: Firewall Congestion',
    codeName: 'OPERATION SHIELD-WALL',
    description:
      'Packet flood saturating Perimeter Firewall FW-01! Packet buffer at 98%, latency 450ms. Head to the Security Vault, inspect FW-01, and apply QoS rate-limiting rules.',
    targetDeviceId: 'FW-01',
    targetRoom: 'Security Vault (Sector E)',
    targetPosition: [14, 0, -10],
    actionRequired: 'qos_optimize',
    actionName: 'APPLY QOS RATE-LIMITING',
    completed: false,
    explanation: 'Filtering syn-flood traffic and allocating priority bandwidth to mission-critical ports.',
  },
  {
    id: 4,
    title: 'Mission 4: Server Thermal Throttle',
    codeName: 'OPERATION COOL-DOWN',
    description:
      'Storage Node SRV-04 reports extreme thermal runaway (89°C)! Datacenter auto-shutdown imminent in 90s. Navigate to Server Farm Alpha, inspect SRV-04, and cycle auxiliary cooling.',
    targetDeviceId: 'SRV-04',
    targetRoom: 'Server Farm Alpha (Sector B)',
    targetPosition: [-16, 0, 16],
    actionRequired: 'thermal_cycle',
    actionName: 'CYCLE AUXILIARY COOLING',
    completed: false,
    explanation: 'Engaging liquid coolant loop and load-balancing disk read/write queues.',
  },
];

export const INITIAL_ALERTS: NetworkAlert[] = [
  {
    id: 'ALT-101',
    time: '02:00:14',
    level: 'critical',
    source: 'R-01',
    message: 'BGP peering session dropped on interface Gi0/0/0 (Carrier Link down).',
  },
  {
    id: 'ALT-102',
    time: '02:00:15',
    level: 'warning',
    source: 'NOC-MONITOR',
    message: 'Global network packet loss spiked to 98% across edge perimeter.',
  },
];

export const TOPOLOGY_LINKS: TopologyLink[] = [
  {fromId: 'R-01', toId: 'FW-01', bandwidth: '40 Gbps', status: 'degraded'},
  {fromId: 'R-02', toId: 'FW-02', bandwidth: '40 Gbps', status: 'healthy'},
  {fromId: 'FW-01', toId: 'SW-01', bandwidth: '100 Gbps', status: 'healthy'},
  {fromId: 'FW-01', toId: 'SW-02', bandwidth: '10 Gbps', status: 'healthy'},
  {fromId: 'SW-01', toId: 'SRV-01', bandwidth: '25 Gbps', status: 'healthy'},
  {fromId: 'SW-01', toId: 'SRV-02', bandwidth: '25 Gbps', status: 'healthy'},
  {fromId: 'SW-01', toId: 'SRV-04', bandwidth: '50 Gbps', status: 'healthy'},
  {fromId: 'SW-02', toId: 'PC-LAB-01', bandwidth: '1 Gbps', status: 'healthy'},
  {fromId: 'SW-02', toId: 'AP-CORP-01', bandwidth: '2.5 Gbps', status: 'healthy'},
  {fromId: 'NOC-CONSOLE-01', toId: 'SW-01', bandwidth: '10 Gbps', status: 'healthy'},
];

/** Room zones with bounding boxes for location identification */
export interface RoomZone {
  name: string;
  code: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const ROOM_ZONES: RoomZone[] = [
  {name: 'Central Operations Center', code: 'Sector A', minX: -8, maxX: 8, minZ: 0, maxZ: 14},
  {name: 'Server Farm Alpha', code: 'Sector B', minX: -22, maxX: -10, minZ: 0, maxZ: 20},
  {name: 'Core Routing Bay', code: 'Sector C', minX: 10, maxX: 22, minZ: 0, maxZ: 20},
  {name: 'Distribution Switch Bay', code: 'Sector D', minX: -20, maxX: -8, minZ: -20, maxZ: -4},
  {name: 'Security Vault', code: 'Sector E', minX: 8, maxX: 20, minZ: -20, maxZ: -4},
  {name: 'Computer Laboratory', code: 'Sector F', minX: -22, maxX: -8, minZ: -32, maxZ: -22},
  {name: 'Wireless Pavilion', code: 'Sector G', minX: 8, maxX: 22, minZ: -32, maxZ: -22},
  {name: 'Central Junction Corridor', code: 'Sector H', minX: -8, maxX: 8, minZ: -24, maxZ: -2},
];

export function getPlayerCurrentZone(x: number, z: number): {name: string; code: string} {
  for (const zone of ROOM_ZONES) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
      return {name: zone.name, code: zone.code};
    }
  }
  return {name: 'Datacenter Main Concourse', code: 'Corridor'};
}

/**
 * Realistic Network Graph Traversal & ICMP Ping Simulation
 * Checks physical layer cables, carrier state, hop paths, and device operational statuses.
 */
export interface PingResultPayload {
  success: boolean;
  targetIp: string;
  hopCount: number;
  rttAvg: number;
  packetLoss: number;
  lines: string[];
}

export function simulateNetworkPing(
  sourceDevice: NetworkDevice,
  targetIp: string,
  devices: NetworkDevice[],
  cables: PhysicalCable[],
): PingResultPayload {
  // 1. Physical Layer: Check if source device has any connected physical cables
  const attachedCables = cables.filter(
    (c) => c.fromDeviceId === sourceDevice.id || c.toDeviceId === sourceDevice.id,
  );
  const pluggedCables = attachedCables.filter((c) => c.plugged);

  if (pluggedCables.length === 0) {
    return {
      success: false,
      targetIp,
      hopCount: 0,
      rttAvg: 0,
      packetLoss: 100,
      lines: [
        `PING ${targetIp} 56(84) bytes of data.`,
        `connect: Network is unreachable (Interface eth0: NO-CARRIER)`,
        `CRITICAL ERROR: No physical patch cable connected to ${sourceDevice.name}.`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 0 received, 100% packet loss (Interface Down)`,
      ],
    };
  }

  // 2. Identify target device in datacenter
  let targetDevice: NetworkDevice | null = null;
  if (targetIp === '10.0.0.1' || targetIp === '192.168.1.1') {
    targetDevice = devices.find((d) => d.id === 'R-01') || null;
  } else if (targetIp === '8.8.8.8') {
    // External Internet DNS: routes through Gateway R-01
    targetDevice = devices.find((d) => d.id === 'R-01') || null;
  } else {
    targetDevice = devices.find((d) => d.ip === targetIp) || null;
  }

  if (!targetDevice) {
    return {
      success: false,
      targetIp,
      hopCount: 0,
      rttAvg: 0,
      packetLoss: 100,
      lines: [
        `PING ${targetIp} 56(84) bytes of data.`,
        `From ${sourceDevice.ip} icmp_seq=1 Destination Host Unreachable (No route to host)`,
        `From ${sourceDevice.ip} icmp_seq=2 Destination Host Unreachable`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 0 received, +4 errors, 100% packet loss`,
      ],
    };
  }

  // If pinging self
  if (targetDevice.id === sourceDevice.id) {
    return {
      success: true,
      targetIp,
      hopCount: 0,
      rttAvg: 0.04,
      packetLoss: 0,
      lines: [
        `PING ${targetIp} 56(84) bytes of data.`,
        `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.038 ms`,
        `64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.041 ms`,
        `64 bytes from ${targetIp}: icmp_seq=3 ttl=64 time=0.039 ms`,
        `64 bytes from ${targetIp}: icmp_seq=4 ttl=64 time=0.042 ms`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 4 received, 0% packet loss, time 3002ms`,
        `rtt min/avg/max = 0.038/0.040/0.042 ms (Loopback interface)`,
      ],
    };
  }

  // 3. Network Graph Traversal via BFS on PLUGGED cables
  const queue: string[] = [sourceDevice.id];
  const visited = new Set<string>([sourceDevice.id]);
  const parent = new Map<string, {node: string; cable: PhysicalCable}>();

  let reached = false;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetDevice.id) {
      reached = true;
      break;
    }

    // Find all plugged cables from curr
    for (const cable of cables) {
      if (!cable.plugged) continue;

      let neighborId: string | null = null;
      if (cable.fromDeviceId === curr) neighborId = cable.toDeviceId;
      else if (cable.toDeviceId === curr) neighborId = cable.fromDeviceId;

      if (neighborId && !visited.has(neighborId)) {
        visited.add(neighborId);
        parent.set(neighborId, {node: curr, cable});
        queue.push(neighborId);
      }
    }
  }

  // 4. Evaluate path results
  if (!reached) {
    // Find disconnected cable name
    const brokenLink = attachedCables.find((c) => !c.plugged);
    const brokenNote = brokenLink
      ? `Physical patch cable '${brokenLink.name}' is unplugged.`
      : `Uplink path broken: Trunk cable disconnected along the route to ${targetDevice.name}.`;

    return {
      success: false,
      targetIp,
      hopCount: 1,
      rttAvg: 0,
      packetLoss: 100,
      lines: [
        `PING ${targetIp} 56(84) bytes of data.`,
        `From ${sourceDevice.ip} icmp_seq=1 Destination Host Unreachable`,
        `From ${sourceDevice.ip} icmp_seq=2 Destination Host Unreachable (Link down)`,
        `From ${sourceDevice.ip} icmp_seq=3 Destination Host Unreachable`,
        `From ${sourceDevice.ip} icmp_seq=4 Destination Host Unreachable`,
        `DIAGNOSTIC NOTICE: ${brokenNote}`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 0 received, +4 errors, 100% packet loss`,
      ],
    };
  }

  // Reconstruct path to count hops
  const path: string[] = [targetDevice.id];
  let curr = targetDevice.id;
  while (parent.has(curr)) {
    curr = parent.get(curr)!.node;
    path.unshift(curr);
  }
  const hops = Math.max(1, path.length - 1);

  // Check if target or intermediate device is down / failed (e.g. Router R-01 in Mission 1)
  const isTargetFailed = targetDevice.status === 'critical' || targetDevice.status === 'offline';
  if (isTargetFailed) {
    return {
      success: false,
      targetIp,
      hopCount: hops,
      rttAvg: 0,
      packetLoss: 100,
      lines: [
        `PING ${targetIp} 56(84) bytes of data.`,
        `Request timeout for icmp_seq 1 (${targetDevice.name} daemon unresponsive)`,
        `Request timeout for icmp_seq 2 (${targetDevice.name} daemon unresponsive)`,
        `Request timeout for icmp_seq 3`,
        `Request timeout for icmp_seq 4`,
        `HARDWARE FAULT: Target node ${targetDevice.id} is in critical failure mode.`,
        `--- ${targetIp} ping statistics ---`,
        `4 packets transmitted, 0 received, 100% packet loss (Host Down)`,
      ],
    };
  }

  // Target and route are both operational! Calculate realistic RTT
  const baseRtt = 1.2 + hops * 0.45;
  const r1 = +(baseRtt + 0.12).toFixed(2);
  const r2 = +(baseRtt - 0.08).toFixed(2);
  const r3 = +(baseRtt + 0.05).toFixed(2);
  const r4 = +(baseRtt - 0.02).toFixed(2);
  const avg = +((r1 + r2 + r3 + r4) / 4).toFixed(2);
  const ttl = 64 - hops;

  return {
    success: true,
    targetIp,
    hopCount: hops,
    rttAvg: avg,
    packetLoss: 0,
    lines: [
      `PING ${targetIp} (${targetDevice.name}) 56(84) bytes of data:`,
      `64 bytes from ${targetIp}: icmp_seq=1 ttl=${ttl} time=${r1} ms`,
      `64 bytes from ${targetIp}: icmp_seq=2 ttl=${ttl} time=${r2} ms`,
      `64 bytes from ${targetIp}: icmp_seq=3 ttl=${ttl} time=${r3} ms`,
      `64 bytes from ${targetIp}: icmp_seq=4 ttl=${ttl} time=${r4} ms`,
      `--- ${targetIp} ping statistics ---`,
      `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`,
      `rtt min/avg/max = ${r2}/${avg}/${r1} ms (Hops: ${hops}) - STATUS: OPTIMAL`,
    ],
  };
}

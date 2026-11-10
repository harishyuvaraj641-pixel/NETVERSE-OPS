// tslint:disable
/* eslint-disable */
/** 3D Vector. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** 3D Position as a tuple. */
export type Position3D = [number, number, number];

/** Represents an object in the 3D scene. */
export interface Entity3D {
  id: string | number;
  type?: string;
  position: Vec3 | Position3D;
  rotation?: Vec3 | Position3D;
  scale?: Vec3 | Position3D;
  velocity?: Vec3;
  active?: boolean;
  [key: string]: any;
}

/** Represents a particle in a particle system. */
export interface Particle {
  id: string | number;
  position: Vec3 | Position3D;
  velocity?: Vec3 | Position3D;
  life: number;
  maxLife: number;
  color?: string;
  size?: number;
  [key: string]: any;
}

// Digital Twin Network Types

export type DeviceType =
  | 'router'
  | 'switch'
  | 'firewall'
  | 'server_rack'
  | 'workstation'
  | 'wifi_ap'
  | 'terminal';

export type DeviceStatus = 'normal' | 'warning' | 'critical' | 'offline' | 'rebooting';

export interface DeviceTelemetry {
  cpu: number; // %
  memory: number; // %
  temperature: number; // °C
  inTraffic: number; // Mbps
  outTraffic: number; // Mbps
  latency: number; // ms
  uptime: string;
  packetLoss: number; // %
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  zone: string;
  roomName: string;
  position: Position3D;
  rotation?: [number, number, number];
  ip: string;
  mac: string;
  status: DeviceStatus;
  telemetry: DeviceTelemetry;
  connectedTo: string[];
  firmware: string;
  description: string;
}

export interface PhysicalCable {
  id: string;
  name: string;
  color: string;
  cableType: 'fiber' | 'copper';
  fromDeviceId: string;
  fromPort: string;
  fromPos: Position3D;
  toDeviceId: string;
  toPort: string;
  toPos: Position3D;
  plugged: boolean;
  speed: string;
}

export interface Mission {
  id: number;
  title: string;
  codeName: string;
  description: string;
  targetDeviceId: string;
  targetRoom: string;
  targetPosition: Position3D;
  actionRequired: 'reboot' | 'reconnect' | 'qos_optimize' | 'thermal_cycle' | 'cable_patch';
  actionName: string;
  completed: boolean;
  explanation: string;
}

export interface NetworkAlert {
  id: string;
  time: string;
  level: 'info' | 'warning' | 'critical';
  source: string;
  message: string;
}

export interface TopologyLink {
  fromId: string;
  toId: string;
  bandwidth: string;
  status: 'healthy' | 'degraded' | 'down';
}

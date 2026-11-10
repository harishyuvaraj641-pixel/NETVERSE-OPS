import React, {useRef, useMemo} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {RigidBody, CuboidCollider} from '@react-three/rapier';
import {NetworkDevice, PhysicalCable} from '../types';

interface DatacenterFacilityProps {
  devices: NetworkDevice[];
  cables: PhysicalCable[];
  activeTargetDeviceId?: string;
  hoveredDeviceId?: string | null;
  hoveredCableId?: string | null;
  isMorningMode?: boolean;
}

/**
 * 3D High-Tech Network Operations Center & Datacenter Facility
 * With Morning Mode skylights and 3D Physical Interactive Cables.
 */
export function DatacenterFacility({
  devices,
  cables,
  activeTargetDeviceId,
  hoveredDeviceId,
  hoveredCableId,
  isMorningMode = false,
}: DatacenterFacilityProps) {
  // Animated lights & conduit pulse
  const conduitRef = useRef<THREE.MeshStandardMaterial>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  const skylightRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({clock}) => {
    const t = clock.getElapsedTime();
    if (conduitRef.current) {
      conduitRef.current.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.4;
    }
    if (beaconRef.current) {
      beaconRef.current.intensity = 15 + Math.sin(t * 6) * 12;
    }
    if (skylightRef.current) {
      skylightRef.current.emissiveIntensity = isMorningMode
        ? 1.4 + Math.sin(t * 1.5) * 0.2
        : 0.1;
    }
  });

  return (
    <group name="datacenter_facility">
      {/* ========================================================================= */}
      {/* 1. FLOOR & CEILING WITH SCI-FI TILING & GLOWING CONDUITS                  */}
      {/* ========================================================================= */}

      {/* Main Floor (Ground) */}
      <RigidBody type="fixed" friction={0.8} colliders={false}>
        <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[80, 0.1, 80]} />
          <meshStandardMaterial
            color={isMorningMode ? '#1e293b' : '#0b1120'}
            roughness={0.35}
            metalness={0.65}
          />
        </mesh>
      </RigidBody>

      {/* Raised Floor Accent Tiles (Datacenter Cold/Hot Aisle Panels) */}
      <mesh position={[0, 0.01, 7]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial
          color={isMorningMode ? '#283548' : '#0f172a'}
          roughness={0.3}
          metalness={0.8}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </mesh>
      <mesh position={[-16, 0.01, 10]} receiveShadow>
        <planeGeometry args={[10, 16]} />
        <meshStandardMaterial
          color={isMorningMode ? '#064e3b' : '#022c22'}
          roughness={0.35}
          metalness={0.75}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </mesh>
      <mesh position={[16, 0.01, 10]} receiveShadow>
        <planeGeometry args={[10, 16]} />
        <meshStandardMaterial
          color={isMorningMode ? '#312e81' : '#1e1b4b'}
          roughness={0.35}
          metalness={0.75}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </mesh>

      {/* Glowing Datacenter Floor Conduits (Optical Fiber Trays) */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[0, 0, -5]}>
          <boxGeometry args={[0.6, 0.02, 50]} />
          <meshStandardMaterial
            ref={conduitRef}
            color="#0284c7"
            emissive="#06b6d4"
            emissiveIntensity={1.2}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[-8, 0, 10]}>
          <boxGeometry args={[16, 0.02, 0.5]} />
          <meshStandardMaterial
            color="#059669"
            emissive="#10b981"
            emissiveIntensity={1.0}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[8, 0, 10]}>
          <boxGeometry args={[16, 0.02, 0.5]} />
          <meshStandardMaterial
            color="#4f46e5"
            emissive="#6366f1"
            emissiveIntensity={1.0}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0, -12]}>
          <boxGeometry args={[30, 0.02, 0.5]} />
          <meshStandardMaterial
            color="#e11d48"
            emissive="#f43f5e"
            emissiveIntensity={1.0}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Ceiling & Overhead Trusses */}
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[80, 0.2, 80]} />
        <meshStandardMaterial
          color={isMorningMode ? '#1e293b' : '#090d16'}
          roughness={0.9}
          metalness={0.3}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* MORNING MODE ROOF SKYLIGHTS & NATURAL SUNBEAMS                            */}
      {/* ========================================================================= */}
      {[-16, 0, 16].map((x) => (
        <group key={`skylight-${x}`} position={[x, 5.48, 6]}>
          {/* Glass Skylight Panel */}
          <mesh>
            <boxGeometry args={[5, 0.04, 8]} />
            <meshStandardMaterial
              ref={skylightRef}
              color={isMorningMode ? '#fef08a' : '#0f172a'}
              emissive={isMorningMode ? '#fde047' : '#0369a1'}
              emissiveIntensity={isMorningMode ? 1.5 : 0.2}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>

          {/* Morning Sunbeam Light Shafts */}
          {isMorningMode && (
            <group position={[0, -2.5, 0]} rotation={[0.2, 0, 0.15]}>
              <mesh>
                <cylinderGeometry args={[2.0, 3.2, 5.0, 16, 1, true]} />
                <meshBasicMaterial
                  color="#fef08a"
                  transparent
                  opacity={0.08}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
              <pointLight
                color="#fde047"
                intensity={12}
                distance={14}
                decay={1.5}
                position={[0, 1.8, 0]}
              />
            </group>
          )}
        </group>
      ))}

      {/* Industrial Ceiling Trusses */}
      {[-20, -10, 0, 10, 20].map((z) => (
        <group key={`truss-${z}`} position={[0, 5.2, z]}>
          <mesh>
            <boxGeometry args={[60, 0.3, 0.3]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          {/* Overhead Strip Lighting */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[20, 0.08, 0.2]} />
            <meshBasicMaterial color={isMorningMode ? '#fef9c3' : '#bae6fd'} />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 2. PERIMETER & INTERIOR ARCHITECTURAL WALLS                               */}
      {/* ========================================================================= */}
      <FacilityWalls isMorningMode={isMorningMode} />

      {/* ========================================================================= */}
      {/* 3. NOC CENTRAL VIDEO WALL & OPERATIONS CONSOLES                           */}
      {/* ========================================================================= */}
      <NocVideoWall />

      {/* ========================================================================= */}
      {/* 4. SECTOR SIGNAGE & OVERHEAD HEADS-UP LABELS                              */}
      {/* ========================================================================= */}
      <SectorSignage />

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE 3D NETWORK EQUIPMENT MODELS                                */}
      {/* ========================================================================= */}
      {devices.map((device) => (
        <Device3DModel
          key={device.id}
          device={device}
          isTargeted={device.id === activeTargetDeviceId}
          isHovered={device.id === hoveredDeviceId}
        />
      ))}

      {/* ========================================================================= */}
      {/* 6. PHYSICAL INTERACTIVE PATCH CABLES (PLUG & UNPLUG SYSTEM)               */}
      {/* ========================================================================= */}
      {cables.map((cable) => (
        <PhysicalCable3D
          key={cable.id}
          cable={cable}
          isHovered={cable.id === hoveredCableId}
        />
      ))}

      {/* Alarm Warning Beacon in active room */}
      {activeTargetDeviceId && (
        <group position={[16, 4.5, 10]}>
          <pointLight
            ref={beaconRef}
            color="#ef4444"
            intensity={20}
            distance={20}
            decay={1.5}
          />
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * 3D Physical Patch Cable Model
 * Renders curved spline when plugged, and dangling disconnected wire when unplugged!
 */
function PhysicalCable3D({
  cable,
  isHovered,
}: {
  cable: PhysicalCable;
  isHovered: boolean;
}) {
  const packetRef = useRef<THREE.Mesh>(null);
  const blinkRef = useRef<THREE.MeshBasicMaterial>(null);

  // Build the 3D curve for the cable
  const curve = useMemo(() => {
    const p1 = new THREE.Vector3(...cable.fromPos);
    if (cable.plugged) {
      const p2 = new THREE.Vector3(...cable.toPos);
      // Midpoint lifts slightly into ceiling cable trays or drops in an arc
      const mid = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5);
      // Elevation or sag
      const dist = p1.distanceTo(p2);
      mid.y = Math.max(p1.y, p2.y) + (dist > 10 ? 2.2 : 0.3);

      return new THREE.CatmullRomCurve3([p1, mid, p2]);
    } else {
      // Unplugged: Cable drops loose from fromPos down towards the floor/shelf
      const drop1 = new THREE.Vector3(p1.x, p1.y - 0.4, p1.z + 0.15);
      const drop2 = new THREE.Vector3(p1.x, 0.15, p1.z + 0.35);
      return new THREE.CatmullRomCurve3([p1, drop1, drop2]);
    }
  }, [cable.fromPos, cable.toPos, cable.plugged]);

  // Dynamic packet flow animation
  useFrame(({clock}) => {
    const t = clock.getElapsedTime();
    if (packetRef.current && cable.plugged) {
      const u = (t * 0.8) % 1;
      const pt = curve.getPointAt(u);
      packetRef.current.position.copy(pt);
    }
    if (blinkRef.current && !cable.plugged) {
      blinkRef.current.opacity = Math.sin(t * 8) > 0 ? 1 : 0.2;
    }
  });

  return (
    <group name={`cable-${cable.id}`}>
      {/* 3D Curved Cable Tube */}
      <mesh>
        <tubeGeometry args={[curve, 24, 0.022, 8, false]} />
        <meshStandardMaterial
          color={cable.plugged ? cable.color : '#64748b'}
          emissive={cable.plugged ? cable.color : '#000000'}
          emissiveIntensity={isHovered ? 1.2 : cable.plugged ? 0.4 : 0}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* From-Port Connector Boot */}
      <mesh position={cable.fromPos}>
        <boxGeometry args={[0.06, 0.06, 0.1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>

      {/* To-Port: Plugged vs Disconnected Status */}
      {cable.plugged ? (
        <>
          {/* Connected Connector Boot at toPos */}
          <mesh position={cable.toPos}>
            <boxGeometry args={[0.06, 0.06, 0.1]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          {/* Link Activity Green LED */}
          <mesh position={[cable.toPos[0], cable.toPos[1] + 0.05, cable.toPos[2]]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          {/* Animated Glowing Packet Flowing along Cable */}
          <mesh ref={packetRef}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      ) : (
        <>
          {/* Empty Port Socket at toPos with Warning Amber Indicator */}
          <mesh position={cable.toPos}>
            <boxGeometry args={[0.07, 0.07, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[cable.toPos[0], cable.toPos[1] + 0.05, cable.toPos[2]]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshBasicMaterial ref={blinkRef} color="#ef4444" transparent />
          </mesh>

          {/* Dangling Disconnected Connector Head near the floor */}
          <group position={[cable.fromPos[0], 0.15, cable.fromPos[2] + 0.35]}>
            <mesh>
              <boxGeometry args={[0.06, 0.06, 0.12]} />
              <meshStandardMaterial color="#ef4444" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        </>
      )}

      {/* Reticle Highlight Ring when looking at cable */}
      {isHovered && (
        <group position={cable.plugged ? cable.toPos : [cable.fromPos[0], 0.2, cable.fromPos[2] + 0.35]}>
          <mesh>
            <ringGeometry args={[0.15, 0.2, 16]} />
            <meshBasicMaterial
              color={cable.plugged ? '#06b6d4' : '#f59e0b'}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * Architectural solid walls and partitions with physical colliders.
 */
function FacilityWalls({isMorningMode}: {isMorningMode: boolean}) {
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isMorningMode ? '#1e293b' : '#111827',
        roughness: 0.6,
        metalness: 0.5,
      }),
    [isMorningMode],
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isMorningMode ? '#38bdf8' : '#0284c7',
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: isMorningMode ? 0.45 : 0.35,
      }),
    [isMorningMode],
  );

  return (
    <group name="facility_walls">
      {/* Outer Perimeter Enclosing Walls */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 2.5, -34]} material={wallMat}>
          <boxGeometry args={[70, 5, 1]} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 2.5, 22]} material={wallMat}>
          <boxGeometry args={[70, 5, 1]} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-26, 2.5, -6]} material={wallMat}>
          <boxGeometry args={[1, 5, 58]} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[26, 2.5, -6]} material={wallMat}>
          <boxGeometry args={[1, 5, 58]} />
        </mesh>
      </RigidBody>

      {/* Interior Room Partitions */}
      {/* Server Farm West Partition */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-9, 2.5, 3]} material={wallMat}>
          <boxGeometry args={[1, 5, 8]} />
        </mesh>
        <mesh position={[-9, 2.5, 17]} material={wallMat}>
          <boxGeometry args={[1, 5, 8]} />
        </mesh>
        <mesh position={[-9, 4.3, 10]} material={wallMat}>
          <boxGeometry args={[1, 1.4, 6]} />
        </mesh>
        <mesh position={[-9, 2.2, 10]} material={glassMat}>
          <boxGeometry args={[0.2, 3.2, 4]} />
        </mesh>
      </RigidBody>

      {/* Routing Bay East Partition */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[9, 2.5, 3]} material={wallMat}>
          <boxGeometry args={[1, 5, 8]} />
        </mesh>
        <mesh position={[9, 2.5, 17]} material={wallMat}>
          <boxGeometry args={[1, 5, 8]} />
        </mesh>
        <mesh position={[9, 4.3, 10]} material={wallMat}>
          <boxGeometry args={[1, 1.4, 6]} />
        </mesh>
        <mesh position={[9, 2.2, 10]} material={glassMat}>
          <boxGeometry args={[0.2, 3.2, 4]} />
        </mesh>
      </RigidBody>

      {/* North Partition separating NOC from Corridors */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-18, 2.5, 0]} material={wallMat}>
          <boxGeometry args={[16, 5, 1]} />
        </mesh>
        <mesh position={[18, 2.5, 0]} material={wallMat}>
          <boxGeometry args={[16, 5, 1]} />
        </mesh>
        <mesh position={[-6, 2.5, 0]} material={wallMat}>
          <boxGeometry args={[4, 5, 1]} />
        </mesh>
        <mesh position={[6, 2.5, 0]} material={wallMat}>
          <boxGeometry args={[4, 5, 1]} />
        </mesh>
        <mesh position={[0, 4.4, 0]} material={wallMat}>
          <boxGeometry args={[8, 1.2, 1]} />
        </mesh>
      </RigidBody>

      {/* Partitions for Security Vault & Switch Bay */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-7, 2.5, -14]} material={wallMat}>
          <boxGeometry args={[1, 5, 16]} />
        </mesh>
        <mesh position={[7, 2.5, -14]} material={wallMat}>
          <boxGeometry args={[1, 5, 16]} />
        </mesh>
      </RigidBody>

      {/* Partition for Computer Lab & Wireless Pavilion */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-16, 2.5, -22]} material={wallMat}>
          <boxGeometry args={[18, 5, 1]} />
        </mesh>
        <mesh position={[16, 2.5, -22]} material={wallMat}>
          <boxGeometry args={[18, 5, 1]} />
        </mesh>
        <mesh position={[0, 4.4, -22]} material={wallMat}>
          <boxGeometry args={[8, 1.2, 1]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

/**
 * NOC Curved Center Video Wall displaying Digital Twin Global Infrastructure
 */
function NocVideoWall() {
  const pulseRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({clock}) => {
    if (pulseRef.current) {
      pulseRef.current.opacity = 0.85 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
    }
  });

  return (
    <group position={[0, 0, 1]}>
      <mesh position={[0, 2.8, 0.1]} castShadow>
        <boxGeometry args={[12, 4.2, 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[0, 2.8, 0.32]}>
        <planeGeometry args={[11.4, 3.8]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[0, 2.8, 0.33]}>
        <planeGeometry args={[11.2, 3.6]} />
        <meshBasicMaterial ref={pulseRef} color="#0c4a6e" transparent opacity={0.9} />
      </mesh>

      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.5, 5]} castShadow>
          <boxGeometry args={[7, 1.0, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.3, 4.8]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[3.2, 0.8, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </RigidBody>
    </group>
  );
}

/**
 * Overhead Sector Signs with glowing neon labels
 */
function SectorSignage() {
  const signs = [
    {title: 'SECTOR A: NOC OPERATIONS', pos: [0, 4.2, 1.5] as [number, number, number], color: '#38bdf8'},
    {title: 'SECTOR B: SERVER FARM ALPHA', pos: [-9, 4.2, 10] as [number, number, number], color: '#10b981'},
    {title: 'SECTOR C: CORE ROUTING BAY', pos: [9, 4.2, 10] as [number, number, number], color: '#818cf8'},
    {title: 'SECTOR D: DISTRIBUTION SWITCHES', pos: [-7, 4.2, -10] as [number, number, number], color: '#f59e0b'},
    {title: 'SECTOR E: SECURITY VAULT (NGFW)', pos: [7, 4.2, -10] as [number, number, number], color: '#f43f5e'},
    {title: 'SECTOR F: COMPUTER LABORATORY', pos: [-9, 4.2, -22] as [number, number, number], color: '#a855f7'},
    {title: 'SECTOR G: WIRELESS PAVILION', pos: [9, 4.2, -22] as [number, number, number], color: '#06b6d4'},
  ];

  return (
    <group name="sector_signs">
      {signs.map((s, idx) => (
        <group key={`sign-${idx}`} position={s.pos}>
          <mesh>
            <boxGeometry args={[4.2, 0.5, 0.1]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[4.0, 0.35, 0.02]} />
            <meshBasicMaterial color={s.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Detailed 3D procedural models of Network Hardware
 */
function Device3DModel({
  device,
  isTargeted,
  isHovered,
}: {
  device: NetworkDevice;
  isTargeted: boolean;
  isHovered: boolean;
}) {
  const rot = device.rotation || [0, 0, 0];
  const isFailed = device.status === 'critical' || device.status === 'offline';
  const isDegraded = device.status === 'warning';

  const statusColor = isFailed ? '#ef4444' : isDegraded ? '#f59e0b' : '#10b981';

  return (
    <group position={device.position} rotation={rot} name={`device-${device.id}`}>
      <RigidBody type="fixed" colliders="cuboid">
        {device.type === 'server_rack' && (
          <ServerRackModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
        {device.type === 'router' && (
          <RouterModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
        {device.type === 'switch' && (
          <SwitchModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
        {device.type === 'firewall' && (
          <FirewallModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
        {device.type === 'workstation' && (
          <WorkstationModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
        {device.type === 'wifi_ap' && (
          <WifiApModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
        {device.type === 'terminal' && (
          <TerminalModel isTargeted={isTargeted} isHovered={isHovered} statusColor={statusColor} />
        )}
      </RigidBody>

      {/* Floating Target Diagnostic Beacon if targeted by active mission */}
      {isTargeted && (
        <group position={[0, 2.6, 0]}>
          <mesh>
            <octahedronGeometry args={[0.25, 0]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
          <pointLight color="#ef4444" intensity={8} distance={6} decay={1.5} />
        </group>
      )}

      {/* Proximity / Reticle Highlight Halo */}
      {(isHovered || isTargeted) && (
        <mesh position={[0, 0.05, 0]}>
          <ringGeometry args={[0.9, 1.05, 24]} />
          <meshBasicMaterial
            color={isTargeted ? '#ef4444' : '#38bdf8'}
            side={THREE.DoubleSide}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </mesh>
      )}
    </group>
  );
}

/** 42U Enterprise Server Rack */
function ServerRackModel({
  isTargeted,
  statusColor,
}: {
  isTargeted: boolean;
  isHovered: boolean;
  statusColor: string;
}) {
  return (
    <group position={[0, 1.25, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.5, 0.9]} />
        <meshStandardMaterial
          color={isTargeted ? '#3b0764' : '#0f172a'}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, 0, 0.46]}>
        <boxGeometry args={[0.82, 2.38, 0.02]} />
        <meshStandardMaterial
          color="#0284c7"
          transparent
          opacity={0.3}
          metalness={0.9}
        />
      </mesh>
      {[-0.8, -0.4, 0, 0.4, 0.8].map((yOffset, i) => (
        <group key={`blade-${i}`} position={[0, yOffset, 0.44]}>
          <mesh>
            <boxGeometry args={[0.78, 0.28, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
          <mesh position={[-0.28, 0, 0.03]}>
            <boxGeometry args={[0.04, 0.04, 0.01]} />
            <meshBasicMaterial color={statusColor} />
          </mesh>
          <mesh position={[-0.2, 0, 0.03]}>
            <boxGeometry args={[0.04, 0.04, 0.01]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.28, 0.35]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
    </group>
  );
}

/** Cisco-style Enterprise Core Router */
function RouterModel({statusColor}: {isTargeted: boolean; isHovered: boolean; statusColor: string}) {
  return (
    <group position={[0, 1.0, 0]}>
      <mesh position={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[1.0, 1.0, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.7]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.3, 0.36]}>
        <boxGeometry args={[0.82, 0.4, 0.02]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      <mesh position={[-0.2, 0.3, 0.38]}>
        <boxGeometry args={[0.3, 0.06, 0.01]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      <mesh position={[0.2, 0.3, 0.38]}>
        <boxGeometry args={[0.3, 0.06, 0.01]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0, -0.05, 0.4]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

/** High-Density Distribution Switch Rack */
function SwitchModel({statusColor}: {isTargeted: boolean; isHovered: boolean; statusColor: string}) {
  return (
    <group position={[0, 1.0, 0]}>
      <mesh position={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[1.0, 1.0, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.65]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0.33]}>
        <boxGeometry args={[0.8, 0.2, 0.02]} />
        <meshStandardMaterial color="#020617" metalness={0.9} />
      </mesh>
      {[-0.25, -0.1, 0.05, 0.2].map((x, i) => (
        <mesh key={`led-${i}`} position={[x, 0.24, 0.35]}>
          <boxGeometry args={[0.08, 0.03, 0.01]} />
          <meshBasicMaterial color={i === 0 ? statusColor : '#22c55e'} />
        </mesh>
      ))}
    </group>
  );
}

/** Next-Gen Firewall Appliance */
function FirewallModel({statusColor}: {isTargeted: boolean; isHovered: boolean; statusColor: string}) {
  return (
    <group position={[0, 1.0, 0]}>
      <mesh position={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[1.0, 1.0, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.88, 0.42, 0.65]} />
        <meshStandardMaterial color="#881337" roughness={0.35} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.25, 0.34]}>
        <boxGeometry args={[0.78, 0.12, 0.02]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
    </group>
  );
}

/** Computer Lab Workstation */
function WorkstationModel({statusColor}: {isTargeted: boolean; isHovered: boolean; statusColor: string}) {
  return (
    <group position={[0, 0.75, 0]}>
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[1.6, 0.7, 0.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[-0.35, 0.5, 0.1]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.65, 0.4, 0.03]} />
        <meshBasicMaterial color="#0369a1" />
      </mesh>
      <mesh position={[0.35, 0.5, 0.1]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.65, 0.4, 0.03]} />
        <meshBasicMaterial color="#0891b2" />
      </mesh>
      <mesh position={[0, 0.27, -0.15]}>
        <boxGeometry args={[0.5, 0.02, 0.2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.6, -0.05, -0.1]}>
        <boxGeometry args={[0.22, 0.55, 0.5]} />
        <meshStandardMaterial color="#090d16" metalness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.1, 0.16]}>
        <boxGeometry args={[0.1, 0.05, 0.01]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
    </group>
  );
}

/** Wi-Fi 6E Access Point Ceiling Unit */
function WifiApModel({statusColor}: {isTargeted: boolean; isHovered: boolean; statusColor: string}) {
  return (
    <group position={[0, 4.2, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.35, 0.1, 24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <ringGeometry args={[0.15, 0.2, 24]} />
        <meshBasicMaterial color={statusColor} side={THREE.DoubleSide} rotation={[-Math.PI / 2, 0, 0]} />
      </mesh>
    </group>
  );
}

/** Master Diagnostic Terminal */
function TerminalModel({statusColor}: {isTargeted: boolean; isHovered: boolean; statusColor: string}) {
  return (
    <group position={[0, 0.9, 0]}>
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.04]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[0, 0.22, -0.1]}>
        <boxGeometry args={[0.6, 0.02, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.04]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
    </group>
  );
}

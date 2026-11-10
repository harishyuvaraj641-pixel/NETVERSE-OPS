import React, {useRef, useEffect} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {RigidBody, CapsuleCollider, type RapierRigidBody} from '@react-three/rapier';
import {InputSnapshot} from '../input';
import {NetworkDevice, PhysicalCable} from '../types';
import {getConfig} from '../constants';
import {gameAudio} from '../utils/helper';

interface FPSPlayerProps {
  inputRef: React.MutableRefObject<InputSnapshot>;
  devices: NetworkDevice[];
  cables: PhysicalCable[];
  enabled: boolean;
  onHoverDevice: (device: NetworkDevice | null) => void;
  onHoverCable: (cable: PhysicalCable | null) => void;
  onInteract: (device: NetworkDevice) => void;
  onToggleCable: (cable: PhysicalCable) => void;
  onUpdatePlayerPos: (pos: [number, number, number]) => void;
  isMobile?: boolean;
  virtualMove?: {x: number; y: number};
}

// Module-level pre-allocated scratch vectors to prevent GC allocations in useFrame
const vMove = new THREE.Vector3();
const vForward = new THREE.Vector3();
const vRight = new THREE.Vector3();
const vCamPos = new THREE.Vector3();
const vEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

export function FPSPlayer({
  inputRef,
  devices,
  cables,
  enabled,
  onHoverDevice,
  onHoverCable,
  onInteract,
  onToggleCable,
  onUpdatePlayerPos,
  isMobile = false,
  virtualMove,
}: FPSPlayerProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const {camera, gl} = useThree();

  // Camera yaw (Y) and pitch (X) in radians
  const angles = useRef({yaw: 0, pitch: 0});
  const isGrounded = useRef(true);
  const footstepTimer = useRef(0);
  const headBobPhase = useRef(0);
  const lastInteractKey = useRef(false);
  const hoveredDevRef = useRef<NetworkDevice | null>(null);
  const hoveredCableRef = useRef<PhysicalCable | null>(null);

  // Mouse Pointer Lock handling on desktop
  useEffect(() => {
    if (isMobile) return;

    const canvas = gl.domElement;

    const handlePointerDown = () => {
      if (document.pointerLockElement !== canvas && enabled) {
        void canvas.requestPointerLock?.();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas && enabled) {
        const sens = (getConfig('mouseSensitivity') || 1.6) * 0.0022;
        angles.current.yaw -= e.movementX * sens;
        angles.current.pitch -= e.movementY * sens;
        angles.current.pitch = Math.max(-1.45, Math.min(1.45, angles.current.pitch));
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, enabled, isMobile]);

  // Touch drag camera rotation on mobile
  const touchLastRef = useRef<{x: number; y: number} | null>(null);
  useEffect(() => {
    if (!isMobile) return;
    const canvas = gl.domElement;

    const onTouchStart = (e: TouchEvent) => {
      if (!enabled) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.clientX > window.innerWidth * 0.35) {
          touchLastRef.current = {x: touch.clientX, y: touch.clientY};
          break;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!enabled || !touchLastRef.current) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.clientX > window.innerWidth * 0.35) {
          const dx = touch.clientX - touchLastRef.current.x;
          const dy = touch.clientY - touchLastRef.current.y;
          touchLastRef.current = {x: touch.clientX, y: touch.clientY};

          const sens = 0.005;
          angles.current.yaw -= dx * sens;
          angles.current.pitch -= dy * sens;
          angles.current.pitch = Math.max(-1.45, Math.min(1.45, angles.current.pitch));
          break;
        }
      }
    };

    const onTouchEnd = () => {
      touchLastRef.current = null;
    };

    canvas.addEventListener('touchstart', onTouchStart, {passive: true});
    canvas.addEventListener('touchmove', onTouchMove, {passive: true});
    canvas.addEventListener('touchend', onTouchEnd, {passive: true});
    canvas.addEventListener('touchcancel', onTouchEnd, {passive: true});

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl, enabled, isMobile]);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    const dt = Math.min(delta, 0.1);
    const actions = inputRef.current?.actions;

    // 1. Update Camera Rotation
    vEuler.set(angles.current.pitch, angles.current.yaw, 0);
    camera.quaternion.setFromEuler(vEuler);

    // 2. Compute Directional Vectors on Ground Plane
    vForward.set(0, 0, -1).applyEuler(vEuler);
    vForward.y = 0;
    vForward.normalize();

    vRight.set(1, 0, 0).applyEuler(vEuler);
    vRight.y = 0;
    vRight.normalize();

    // 3. Movement Input Calculation
    vMove.set(0, 0, 0);

    if (enabled) {
      if (virtualMove && (Math.abs(virtualMove.x) > 0.05 || Math.abs(virtualMove.y) > 0.05)) {
        vMove.addScaledVector(vRight, virtualMove.x);
        vMove.addScaledVector(vForward, -virtualMove.y);
      } else if (actions) {
        if (actions.up) vMove.add(vForward);
        if (actions.down) vMove.sub(vForward);
        if (actions.right) vMove.add(vRight);
        if (actions.left) vMove.sub(vRight);
      }
    }

    const isMoving = vMove.lengthSq() > 0.001;
    if (isMoving) {
      vMove.normalize();
    }

    const isSprinting = Boolean(enabled && actions?.sprint);
    const currentSpeed = isSprinting
      ? getConfig('playerSprintSpeed')
      : getConfig('playerSpeed');

    // 4. Physics Movement Velocity
    const curVel = body.linvel();
    isGrounded.current = Math.abs(curVel.y) < 0.15;

    let vy = curVel.y;
    if (enabled && actions?.jump && isGrounded.current) {
      vy = getConfig('jumpForce');
      actions.jump = false;
      gameAudio.playFootstepStone();
    }

    body.setLinvel(
      {
        x: isMoving ? vMove.x * currentSpeed : 0,
        y: vy,
        z: isMoving ? vMove.z * currentSpeed : 0,
      },
      true,
    );

    // 5. Position & Head Bobbing
    const t = body.translation();
    onUpdatePlayerPos([t.x, t.y, t.z]);

    let bobOffset = 0;
    if (isMoving && isGrounded.current) {
      const bobFreq = isSprinting ? 14 : 9;
      headBobPhase.current += dt * bobFreq;
      bobOffset = Math.sin(headBobPhase.current) * 0.05;

      footstepTimer.current += dt * (isSprinting ? 1.6 : 1.0);
      if (footstepTimer.current > 0.45) {
        footstepTimer.current = 0;
        gameAudio.playFootstepStone();
      }
    } else {
      headBobPhase.current = 0;
      footstepTimer.current = 0.2;
    }

    vCamPos.set(t.x, t.y + 1.65 + bobOffset, t.z);
    camera.position.copy(vCamPos);

    // 6. Proximity Raycast Detection to Network Devices & Physical Cables
    if (enabled) {
      raycaster.setFromCamera(screenCenter, camera);
      const rayOrigin = camera.position;
      const rayDir = raycaster.ray.direction;
      const maxDist = getConfig('interactionDistance') || 4.0;

      // Check physical cables first (precise port targeting)
      let closestCable: PhysicalCable | null = null;
      let closestCableDist = 2.8; // tighter radius for cable plugs

      for (const cable of cables) {
        // Test proximity to cable's toPos or dangling position
        const targetPos = cable.plugged
          ? cable.toPos
          : [cable.fromPos[0], 0.2, cable.fromPos[2] + 0.35];

        const cdx = targetPos[0] - rayOrigin.x;
        const cdy = targetPos[1] - rayOrigin.y;
        const cdz = targetPos[2] - rayOrigin.z;
        const distToPort = Math.hypot(cdx, cdy, cdz);

        if (distToPort <= closestCableDist) {
          const dot = (cdx * rayDir.x + cdy * rayDir.y + cdz * rayDir.z) / Math.max(0.1, distToPort);
          if (dot > 0.85) {
            closestCable = cable;
            closestCableDist = distToPort;
          }
        }
      }

      if (closestCable !== hoveredCableRef.current) {
        hoveredCableRef.current = closestCable;
        onHoverCable(closestCable);
      }

      // Check network devices
      let closestDev: NetworkDevice | null = null;
      let closestDist = maxDist;

      if (!closestCable) {
        for (const dev of devices) {
          const dx = dev.position[0] - rayOrigin.x;
          const dy = dev.position[1] + 1.0 - rayOrigin.y;
          const dz = dev.position[2] - rayOrigin.z;
          const distToDev = Math.hypot(dx, dy, dz);

          if (distToDev <= maxDist) {
            const dot = (dx * rayDir.x + dy * rayDir.y + dz * rayDir.z) / Math.max(0.1, distToDev);
            if (dot > 0.65 && distToDev < closestDist) {
              closestDist = distToDev;
              closestDev = dev;
            }
          }
        }
      }

      if (closestDev !== hoveredDevRef.current) {
        hoveredDevRef.current = closestDev;
        onHoverDevice(closestDev);
      }

      // 7. Interaction 'E' Key Handling
      const interactPressed = Boolean(actions?.interact);
      if (interactPressed && !lastInteractKey.current) {
        if (hoveredCableRef.current) {
          onToggleCable(hoveredCableRef.current);
        } else if (hoveredDevRef.current) {
          onInteract(hoveredDevRef.current);
        }
      }
      lastInteractKey.current = interactPressed;
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      mass={1.5}
      type="dynamic"
      position={[0, 0.1, 10]}
      lockRotations>
      <CapsuleCollider
        args={[0.45, 0.4]}
        position={[0, 0.85, 0]}
        friction={0}
      />
    </RigidBody>
  );
}

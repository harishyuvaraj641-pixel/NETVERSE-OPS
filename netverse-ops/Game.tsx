import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Bloom, EffectComposer} from '@react-three/postprocessing';
import {Physics} from '@react-three/rapier';
import type {MutableRefObject} from 'react';
import React, {Suspense, useEffect, useRef} from 'react';
import * as THREE from 'three';
import {DatacenterFacility} from './components/DatacenterFacility';
import {FPSPlayer} from './components/FPSPlayer';
import {getConfig} from './constants';
import {InputSnapshot, useInput} from './input';
import {NetworkDevice, PhysicalCable} from './types';
import {GameState} from './utils/helper';

interface GameProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  exitChat: (payload: Record<string, unknown>) => Promise<void>;
  gameStateRef: MutableRefObject<GameState>;
  devices: NetworkDevice[];
  cables: PhysicalCable[];
  activeTargetDeviceId?: string;
  hoveredDevice: NetworkDevice | null;
  setHoveredDevice: (d: NetworkDevice | null) => void;
  hoveredCable: PhysicalCable | null;
  setHoveredCable: (c: PhysicalCable | null) => void;
  onInteractDevice: (d: NetworkDevice) => void;
  onToggleCable: (c: PhysicalCable) => void;
  onUpdatePlayerPos: (pos: [number, number, number]) => void;
  isMobile: boolean;
  virtualMove?: {x: number; y: number};
  isPaused: boolean;
  isMorningMode?: boolean;
  onToggleTopology?: () => void;
}

const sunFocus = new THREE.Vector3();
const sunForward = new THREE.Vector3();
const SUN_FOCUS_DISTANCE = 12;
const SUN_OFFSET: readonly [number, number, number] = [10, 20, 15];
const SUN_SHADOW_EXTENT = 30;

function SunLight({isMorningMode}: {isMorningMode?: boolean}): React.ReactElement {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const {camera} = useThree();

  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;

    camera.getWorldDirection(sunForward);
    sunFocus
      .copy(camera.position)
      .addScaledVector(sunForward, SUN_FOCUS_DISTANCE);
    sunFocus.y = 0;

    light.position.set(
      sunFocus.x + SUN_OFFSET[0],
      sunFocus.y + SUN_OFFSET[1],
      sunFocus.z + SUN_OFFSET[2],
    );
    light.target.position.copy(sunFocus);
    light.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={isMorningMode ? 4.8 : getConfig('sunIntensity')}
      color={isMorningMode ? '#fef08a' : getConfig('sunColor')}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-camera-left={-SUN_SHADOW_EXTENT}
      shadow-camera-right={SUN_SHADOW_EXTENT}
      shadow-camera-top={SUN_SHADOW_EXTENT}
      shadow-camera-bottom={-SUN_SHADOW_EXTENT}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
  );
}

function CameraSetup(): null {
  const {camera} = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = getConfig('fov');
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

/** Scene content wrapped inside Canvas */
function DatacenterScene({
  gameState,
  setGameState,
  exitChat,
  gameStateRef,
  inputRef,
  devices,
  cables,
  activeTargetDeviceId,
  setHoveredDevice,
  hoveredCable,
  setHoveredCable,
  onInteractDevice,
  onToggleCable,
  onUpdatePlayerPos,
  isMobile,
  virtualMove,
  isPaused,
  isMorningMode,
  onToggleTopology,
}: {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  exitChat: (payload: Record<string, unknown>) => Promise<void>;
  gameStateRef: MutableRefObject<GameState>;
  inputRef: MutableRefObject<InputSnapshot>;
  devices: NetworkDevice[];
  cables: PhysicalCable[];
  activeTargetDeviceId?: string;
  setHoveredDevice: (d: NetworkDevice | null) => void;
  hoveredCable: PhysicalCable | null;
  setHoveredCable: (c: PhysicalCable | null) => void;
  onInteractDevice: (d: NetworkDevice) => void;
  onToggleCable: (c: PhysicalCable) => void;
  onUpdatePlayerPos: (pos: [number, number, number]) => void;
  isMobile: boolean;
  virtualMove?: {x: number; y: number};
  isPaused: boolean;
  isMorningMode?: boolean;
  onToggleTopology?: () => void;
}) {
  const lastCancelRef = useRef(false);
  const lastTabRef = useRef(false);

  useFrame(() => {
    const input = inputRef.current;
    if (input) {
      const cancelPressed = input.actions.cancel;
      if (cancelPressed && !lastCancelRef.current) {
        const currentStatus = gameStateRef.current.status;
        if (currentStatus === 'PLAYING') {
          setGameState((prev) => ({...prev, status: 'PAUSED'}));
        } else if (currentStatus === 'PAUSED') {
          setGameState((prev) => ({...prev, status: 'PLAYING'}));
        } else if (currentStatus === 'START') {
          void exitChat({});
        }
      }
      lastCancelRef.current = cancelPressed;

      const tabPressed = input.actions.tab;
      if (tabPressed && !lastTabRef.current && onToggleTopology) {
        onToggleTopology();
      }
      lastTabRef.current = tabPressed;
    }
  });

  return (
    <group>
      <DatacenterFacility
        devices={devices}
        cables={cables}
        activeTargetDeviceId={activeTargetDeviceId}
        hoveredCableId={hoveredCable?.id}
        isMorningMode={isMorningMode}
      />
      <FPSPlayer
        inputRef={inputRef}
        devices={devices}
        cables={cables}
        enabled={gameState.status === 'PLAYING' && !isPaused}
        onHoverDevice={setHoveredDevice}
        onHoverCable={setHoveredCable}
        onInteract={onInteractDevice}
        onToggleCable={onToggleCable}
        onUpdatePlayerPos={onUpdatePlayerPos}
        isMobile={isMobile}
        virtualMove={virtualMove}
      />
    </group>
  );
}

/** Main game canvas */
export function Game({
  gameState,
  setGameState,
  exitChat,
  gameStateRef,
  devices,
  cables,
  activeTargetDeviceId,
  hoveredDevice,
  setHoveredDevice,
  hoveredCable,
  setHoveredCable,
  onInteractDevice,
  onToggleCable,
  onUpdatePlayerPos,
  isMobile,
  virtualMove,
  isPaused,
  isMorningMode = false,
  onToggleTopology,
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useInput(containerRef, {
    enabled: gameState.status === 'PLAYING' && !isPaused,
  });

  const bgColor = isMorningMode ? '#0f172a' : getConfig('backgroundColor');
  const fogColor = isMorningMode ? '#1e293b' : '#05070f';

  return (
    <div ref={containerRef} className="w-full h-full canvas-wrapper relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          fov: getConfig('fov'),
          near: 0.1,
          far: 500,
          position: [0, 1.65, 10],
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isMorningMode ? 1.25 : 1.1,
        }}
        scene={{
          background: new THREE.Color(bgColor),
          fog: new THREE.FogExp2(fogColor, isMorningMode ? 0.012 : 0.015),
        }}>
        <Suspense fallback={null}>
          <CameraSetup />

          {/* Physically Correct Lighting Rig */}
          <ambientLight
            color={isMorningMode ? '#ffedd5' : getConfig('ambientColor')}
            intensity={isMorningMode ? 2.2 : getConfig('ambientIntensity')}
          />
          <SunLight isMorningMode={isMorningMode} />
          <hemisphereLight
            color={isMorningMode ? '#fef9c3' : getConfig('hemiSkyColor')}
            groundColor={isMorningMode ? '#475569' : getConfig('hemiGroundColor')}
            intensity={isMorningMode ? 1.2 : getConfig('hemiIntensity')}
          />

          <Physics
            gravity={[0, getConfig('gravity'), 0]}
            timeStep="vary"
            paused={isPaused || gameState.status !== 'PLAYING'}>
            <DatacenterScene
              gameState={gameState}
              setGameState={setGameState}
              exitChat={exitChat}
              gameStateRef={gameStateRef}
              inputRef={inputRef}
              devices={devices}
              cables={cables}
              activeTargetDeviceId={activeTargetDeviceId}
              setHoveredDevice={setHoveredDevice}
              hoveredCable={hoveredCable}
              setHoveredCable={setHoveredCable}
              onInteractDevice={onInteractDevice}
              onToggleCable={onToggleCable}
              onUpdatePlayerPos={onUpdatePlayerPos}
              isMobile={isMobile}
              virtualMove={virtualMove}
              isPaused={isPaused}
              isMorningMode={isMorningMode}
              onToggleTopology={onToggleTopology}
            />
          </Physics>

          <EffectComposer>
            <Bloom
              luminanceThreshold={isMorningMode ? 0.8 : 0.85}
              luminanceSmoothing={0.9}
              intensity={isMorningMode ? 0.7 : 0.6}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

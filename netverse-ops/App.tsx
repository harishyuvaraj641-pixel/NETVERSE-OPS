// tslint:disable
/* eslint-disable */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Play,
  RotateCw,
  Activity,
  Zap,
  Info,
  Settings,
  Volume2,
  VolumeX,
  Trophy,
} from 'lucide-react';
import {getConfig} from './constants';
import {Game} from './Game';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  GameState,
  MenuOverlay,
  useIsMobile,
  gameAudio,
  useAutoFocus,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
  usePlaygroundResume,
  useRpc,
} from './utils/usePlayground';
import {
  NetworkDevice,
  Mission,
  NetworkAlert,
  DeviceStatus,
  PhysicalCable,
} from './types';
import {
  INITIAL_DEVICES,
  INITIAL_CABLES,
  INITIAL_MISSIONS,
  INITIAL_ALERTS,
  TOPOLOGY_LINKS,
  getPlayerCurrentZone,
  simulateNetworkPing,
  PingResultPayload,
} from './networkState';

interface CustomWindow extends Window {
  canHandleBackKey?: boolean;
}

export default function App() {
  // --- PLAYGROUND SDK INTEGRATION ---
  const {sdk, isReady} = usePlayground();
  const [exitChat] = useRpc<Record<string, unknown>, void>('ExitChat');

  // Do not remove: Playground save/resume
  const {initialLevel, initialScore, persistenceEnabled, autoStartPending} =
    usePlaygroundResume({
      isReady,
      onAutoStart: () => {
        if (gameStateRef.current.status === 'START') {
          initGame();
        }
      },
    });

  const startLevel = Math.min(initialLevel || 1, 4);
  const startScore = initialScore || 0;

  const levelStartScoreRef = useRef(startScore);
  const prevLevelRef = useRef(startLevel);
  const runWonRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: startScore,
    level: startLevel,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const [gameKey, setGameKey] = useState(0);

  // Digital Twin Simulator State
  const [devices, setDevices] = useState<NetworkDevice[]>(INITIAL_DEVICES);
  const [cables, setCables] = useState<PhysicalCable[]>(INITIAL_CABLES);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [alerts, setAlerts] = useState<NetworkAlert[]>(INITIAL_ALERTS);
  const [networkHealth, setNetworkHealth] = useState(
    getConfig('initialNetworkHealth') || 85,
  );
  const [isMorningMode, setIsMorningMode] = useState(false);

  const [currentZone, setCurrentZone] = useState({
    name: 'Central Operations Center',
    code: 'Sector A',
  });
  const [playerCoords, setPlayerCoords] = useState<[number, number, number]>([
    0, 1.65, 10,
  ]);
  const [hoveredDevice, setHoveredDevice] = useState<NetworkDevice | null>(null);
  const [hoveredCable, setHoveredCable] = useState<PhysicalCable | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'performance' | 'cables' | 'network' | 'actions'
  >('overview');
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [pingTargetIp, setPingTargetIp] = useState('10.0.0.1');
  const [pingResult, setPingResult] = useState<PingResultPayload | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [virtualMove, setVirtualMove] = useState<{x: number; y: number}>({
    x: 0,
    y: 0,
  });

  const isMobile = useIsMobile();
  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );

  // Active Device resolved from current device list
  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  // Active Mission resolution
  const activeMission =
    missions.find((m) => !m.completed) || missions[missions.length - 1];

  // Lifecycle updates for Playground SDK
  useEffect(() => {
    if (gameState.level !== prevLevelRef.current) {
      prevLevelRef.current = gameState.level;
      levelStartScoreRef.current = gameStateRef.current.score;
    }
  }, [gameState.level]);

  useEffect(() => {
    if (gameState.status === 'VICTORY') {
      runWonRef.current = true;
      gameAudio.playVictoryFanfare();
    } else if (gameState.status === 'GAME_OVER') {
      gameAudio.playDefeatMotif();
    }
  }, [gameState.status]);

  useEffect(() => {
    const canHandle = ['PLAYING', 'PAUSED'].includes(gameState.status);
    (window as unknown as CustomWindow).canHandleBackKey = canHandle;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {type: 'PLAYGROUND_CAN_HANDLE_BACK_KEY', value: canHandle},
        '*',
      );
    }
  }, [gameState.status]);

  usePlaygroundGameLifecycle(gameState, sdk);

  // --- Run Control ---
  const startRun = useCallback(
    (level: number, score: number) => {
      levelStartScoreRef.current = score;
      prevLevelRef.current = level;
      runWonRef.current = false;
      setDevices(INITIAL_DEVICES);
      setCables(INITIAL_CABLES);
      setMissions(INITIAL_MISSIONS);
      setAlerts(INITIAL_ALERTS);
      setNetworkHealth(getConfig('initialNetworkHealth') || 85);
      setSelectedDeviceId(null);
      setHoveredCable(null);
      setPingResult(null);
      setIsTopologyOpen(false);
      setIsGameMenuOpen(false);

      setGameState((prev) => ({
        ...prev,
        status: 'PLAYING',
        level,
        score,
      }));
      setGameKey((prev) => prev + 1);

      if (sdk) {
        sdk.startGame();
      }
    },
    [sdk],
  );

  const initGame = useCallback(() => {
    if (persistenceEnabled && !runWonRef.current) {
      startRun(gameStateRef.current.level, levelStartScoreRef.current);
    } else {
      startRun(1, 0);
    }
  }, [startRun, persistenceEnabled]);

  const resetGame = useCallback(() => {
    startRun(1, 0);
  }, [startRun]);

  // Periodic simulated telemetry fluctuation for connected devices
  useEffect(() => {
    if (gameState.status !== 'PLAYING' || isGameMenuOpen) return;

    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((dev) => {
          if (dev.status === 'offline') return dev;
          const cpuDelta = (Math.random() - 0.5) * 4;
          const tempDelta = (Math.random() - 0.5) * 1.5;
          const trafficDelta = (Math.random() - 0.5) * 40;
          return {
            ...dev,
            telemetry: {
              ...dev.telemetry,
              cpu: Math.min(
                100,
                Math.max(
                  5,
                  Math.round((dev.telemetry.cpu + cpuDelta) * 10) / 10,
                ),
              ),
              temperature: Math.min(
                95,
                Math.max(
                  22,
                  Math.round((dev.telemetry.temperature + tempDelta) * 10) / 10,
                ),
              ),
              inTraffic: Math.max(
                0,
                Math.round(dev.telemetry.inTraffic + trafficDelta),
              ),
              outTraffic: Math.max(
                0,
                Math.round(dev.telemetry.outTraffic + trafficDelta * 0.9),
              ),
            },
          };
        }),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState.status, isGameMenuOpen]);

  // Handle player location update
  const handleUpdatePlayerPos = useCallback((pos: [number, number, number]) => {
    setPlayerCoords(pos);
    const z = getPlayerCurrentZone(pos[0], pos[2]);
    setCurrentZone((prev) => (prev.name !== z.name ? z : prev));
  }, []);

  // Handle interacting with device
  const handleInteractDevice = useCallback(
    (dev: NetworkDevice) => {
      gameAudio.playCrispClick();
      if (dev.id === 'NOC-CONSOLE-01') {
        setIsTopologyOpen(true);
      } else {
        setSelectedDeviceId(dev.id);
        setSelectedTab('overview');
        setPingResult(null);
      }
    },
    [],
  );

  // Toggle Physical Cable (Plug / Unplug) with Real Network Link Reactions
  const handleToggleCable = useCallback((cable: PhysicalCable) => {
    const nextPlugged = !cable.plugged;
    if (nextPlugged) {
      gameAudio.playConfirmSelect();
    } else {
      gameAudio.playCrispClick();
    }

    // Update cables
    const updatedCables = cables.map((c) =>
      c.id === cable.id ? {...c, plugged: nextPlugged} : c,
    );
    setCables(updatedCables);

    // Update connected devices' live telemetry & status
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === cable.fromDeviceId || d.id === cable.toDeviceId) {
          // Count active plugged cables for this device
          const devCables = updatedCables.filter(
            (c) => (c.fromDeviceId === d.id || c.toDeviceId === d.id) && c.plugged,
          );
          if (devCables.length === 0) {
            // All links unplugged -> Device physical carrier down
            return {
              ...d,
              status: 'offline' as DeviceStatus,
              telemetry: {
                ...d.telemetry,
                inTraffic: 0,
                outTraffic: 0,
                packetLoss: 100,
                latency: 0,
              },
            };
          } else {
            // Has active cable -> Restore normal if was offline
            return {
              ...d,
              status:
                d.status === 'offline' ? ('normal' as DeviceStatus) : d.status,
              telemetry: {
                ...d.telemetry,
                packetLoss: d.id === 'R-01' && d.status === 'critical' ? 98 : 0,
                inTraffic: Math.max(120, d.telemetry.inTraffic),
                outTraffic: Math.max(90, d.telemetry.outTraffic),
              },
            };
          }
        }
        return d;
      }),
    );

    // Clear old ping results since network topology changed
    setPingResult(null);

    // Update alerts & telemetry based on cable state
    const timeStr = new Date().toTimeString().slice(0, 8);
    if (!nextPlugged) {
      setAlerts((prev) => [
        {
          id: `CBL-${Date.now().toString().slice(-4)}`,
          time: timeStr,
          level: 'warning',
          source: cable.fromDeviceId,
          message: `Physical link DOWN: ${cable.name} was unplugged from ${cable.toPort}!`,
        },
        ...prev,
      ]);
      setNetworkHealth((h) => Math.max(10, h - 10));
    } else {
      setAlerts((prev) => [
        {
          id: `CBL-${Date.now().toString().slice(-4)}`,
          time: timeStr,
          level: 'info',
          source: cable.toDeviceId,
          message: `Physical link UP: ${cable.name} securely plugged into ${cable.toPort}. Carrier detected.`,
        },
        ...prev,
      ]);
      setNetworkHealth((h) => Math.min(100, h + 10));
    }
  }, [cables]);

  // Execute diagnostic ping with realistic network route verification
  const runPingTest = useCallback(
    (target?: string) => {
      if (!selectedDevice || isPinging) return;
      const targetIp = target || pingTargetIp;
      setIsPinging(true);
      gameAudio.playCrispClick();

      setTimeout(() => {
        setIsPinging(false);
        const result = simulateNetworkPing(
          selectedDevice,
          targetIp,
          devices,
          cables,
        );
        setPingResult(result);

        if (result.success) {
          gameAudio.playConfirmSelect();
        } else {
          gameAudio.playErrorBuzz();
        }
      }, 500);
    },
    [selectedDevice, isPinging, pingTargetIp, devices, cables],
  );

  // Remediation Action for Active Mission
  const executeRemediation = useCallback(() => {
    if (!selectedDevice || isRemediating) return;

    setIsRemediating(true);
    gameAudio.playConfirmSelect();

    setTimeout(() => {
      setIsRemediating(false);
      gameAudio.playPowerupChime();

      // Update Device status to normal
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === selectedDevice.id) {
            return {
              ...d,
              status: 'normal' as DeviceStatus,
              telemetry: {
                ...d.telemetry,
                cpu: 28,
                memory: 42,
                temperature: 34,
                latency: 4,
                packetLoss: 0,
              },
            };
          }
          return d;
        }),
      );

      // Complete Mission
      let nextLevel = gameState.level;
      let missionJustFinished = false;

      setMissions((prev) =>
        prev.map((m) => {
          if (m.targetDeviceId === selectedDevice.id && !m.completed) {
            missionJustFinished = true;
            return {...m, completed: true};
          }
          return m;
        }),
      );

      if (missionJustFinished) {
        gameAudio.playLevelUpStinger();
        const newScore = gameState.score + 500;
        const newHealth = Math.min(100, networkHealth + 20);
        setNetworkHealth(newHealth);

        // Add resolution alert
        setAlerts((prev) => [
          {
            id: `RES-${Date.now().toString().slice(-4)}`,
            time: new Date().toTimeString().slice(0, 8),
            level: 'info',
            source: selectedDevice.id,
            message: `Service restored: ${selectedDevice.name} operating within SLA.`,
          },
          ...prev,
        ]);

        // Advance mission or trigger next incident
        const completedCount = missions.filter((m) => m.completed).length + 1;
        if (completedCount >= missions.length) {
          setGameState((prev) => ({
            ...prev,
            status: 'VICTORY',
            score: newScore + 1000,
          }));
        } else {
          nextLevel = Math.min(4, gameState.level + 1);
          setGameState((prev) => ({
            ...prev,
            level: nextLevel,
            score: newScore,
          }));

          const nextTarget =
            nextLevel === 2 ? 'SW-02' : nextLevel === 3 ? 'FW-01' : 'SRV-04';
          setDevices((prev) =>
            prev.map((d) => {
              if (d.id === nextTarget) {
                return {
                  ...d,
                  status:
                    nextLevel === 4
                      ? ('critical' as DeviceStatus)
                      : ('warning' as DeviceStatus),
                  telemetry: {
                    ...d.telemetry,
                    temperature: nextLevel === 4 ? 89 : d.telemetry.temperature,
                    packetLoss: nextLevel === 2 ? 75 : 15,
                  },
                };
              }
              return d;
            }),
          );

          setAlerts((prev) => [
            {
              id: `ALT-${Date.now().toString().slice(-4)}`,
              time: new Date().toTimeString().slice(0, 8),
              level: 'warning',
              source: nextTarget,
              message: `Anomaly detected on node ${nextTarget}. Investigation required.`,
            },
            ...prev,
          ]);
        }
      }

      setSelectedDeviceId(null);
    }, 1200);
  }, [selectedDevice, isRemediating, gameState, networkHealth, missions]);

  // Direction beacon calculation to active mission target
  const targetDevice = devices.find((d) => d.id === activeMission?.targetDeviceId);
  const distanceToTarget = targetDevice
    ? Math.hypot(
        targetDevice.position[0] - playerCoords[0],
        targetDevice.position[2] - playerCoords[2],
      ).toFixed(1)
    : null;

  // Connected cables for currently selected device
  const deviceCables = selectedDevice
    ? cables.filter(
        (c) =>
          c.fromDeviceId === selectedDevice.id ||
          c.toDeviceId === selectedDevice.id,
      )
    : [];

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col bg-slate-950 text-white font-sans select-none">
      <BackgroundMusic
        url={getConfig('backgroundMusicUrl')}
        isPlaying={gameState.status === 'PLAYING' && !isGameMenuOpen}
        isMuted={isMusicMuted}
      />

      {/* ========================================================================= */}
      {/* 1. FPS HEADS-UP DISPLAY (HUD)                                             */}
      {/* ========================================================================= */}
      {gameState.status === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-4">
          {/* Top Bar Safe Zone */}
          <div className="flex flex-wrap justify-between items-start gap-2 w-full">
            {/* Top-Left: Player Location & Current Mission */}
            <div className="flex flex-col gap-1.5 max-w-sm sm:max-w-md pointer-events-auto">
              <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 shadow-lg shadow-cyan-950/30">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-cyan-300">
                  {currentZone.code}
                </span>
                <span className="text-zinc-400 text-xs">|</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                  {currentZone.name}
                </span>
              </div>

              {/* Active Mission Banner */}
              <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/80 shadow-md">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Zap size={12} className="text-amber-400" />
                    {activeMission?.title}
                  </div>
                  {distanceToTarget && (
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {distanceToTarget}m
                    </span>
                  )}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                  {activeMission?.description}
                </div>
              </div>
            </div>

            {/* Top-Right: Controls, Morning Mode Toggle, Health, and Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
              {/* Morning Mode Environment Lighting Toggle */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsMorningMode((prev) => !prev);
                }}
                title="Toggle Morning / Datacenter Night Mode"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all shadow-md min-h-[38px] ${
                  isMorningMode
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30 shadow-amber-950/40'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isMorningMode ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
                  }`}
                />
                <span>{isMorningMode ? 'MORNING MODE' : 'NIGHT MODE'}</span>
              </button>

              {/* Network Health Indicator */}
              <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2.5 shadow-md">
                <Activity
                  size={16}
                  className={
                    networkHealth >= 75
                      ? 'text-emerald-400'
                      : networkHealth >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }
                />
                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 gap-3">
                    <span>NET HEALTH</span>
                    <span className="font-bold text-white">
                      {networkHealth}%
                    </span>
                  </div>
                  <div className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full transition-all duration-500 ${
                        networkHealth >= 75
                          ? 'bg-emerald-400'
                          : networkHealth >= 50
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{width: `${networkHealth}%`}}
                    />
                  </div>
                </div>
              </div>

              {/* Digital Twin Topology Toggle Button */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsTopologyOpen(true);
                }}
                className="bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-md min-h-[38px]">
                <Activity size={14} />
                <span className="hidden sm:inline">TOPOLOGY</span>
                <span className="text-[10px] text-cyan-400 sm:inline hidden">
                  [TAB]
                </span>
              </button>

              {/* Digital Twin Network Switch Button */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'CLOSE_NETVERSE' }, '*');
                  } else {
                    window.location.href = '../index.html';
                  }
                }}
                title="Switch to Digital Twin Network Simulator"
                className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-md min-h-[38px]">
                <RotateCw size={14} />
                <span className="hidden sm:inline">DIGITAL TWIN</span>
              </button>

              {/* Reserved Game Menu Button */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsGameMenuOpen(true);
                }}
                aria-label="Game Menu"
                className="bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md min-h-[38px]">
                <Settings size={14} />
                <span>Menu</span>
              </button>
            </div>
          </div>

          {/* Center: Reticle & Interaction Banner */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {hoveredCable ? (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="w-10 h-10 border-2 border-amber-400 rounded-full flex items-center justify-center animate-pulse mb-3 bg-amber-950/30">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                </div>
                <div className="bg-slate-950/95 border border-amber-400/80 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-xl shadow-amber-950/60 flex flex-col items-center pointer-events-auto">
                  <div className="text-[10px] font-mono tracking-widest text-amber-300 uppercase flex items-center gap-1.5">
                    <span>PHYSICAL PATCH CABLE</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        hoveredCable.plugged
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}>
                      {hoveredCable.plugged ? 'CONNECTED' : 'UNPLUGGED'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {hoveredCable.name}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {hoveredCable.fromPort} ➔ {hoveredCable.toPort} (
                    {hoveredCable.speed})
                  </div>
                  <div className="text-xs text-amber-300 font-mono mt-1.5 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                    {isMobile
                      ? hoveredCable.plugged
                        ? 'TAP [INTERACT] TO UNPLUG'
                        : 'TAP [INTERACT] TO PLUG IN'
                      : hoveredCable.plugged
                      ? 'PRESS [E] TO UNPLUG CABLE'
                      : 'PRESS [E] TO PLUG IN CABLE'}
                  </div>
                </div>
              </div>
            ) : hoveredDevice ? (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="w-10 h-10 border-2 border-cyan-400 rounded-full flex items-center justify-center animate-pulse mb-3 bg-cyan-950/30">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
                <div className="bg-slate-950/90 border border-cyan-400/80 px-4 py-2 rounded-lg backdrop-blur-md shadow-xl shadow-cyan-950/50 flex flex-col items-center pointer-events-auto">
                  <div className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase">
                    DEVICE TARGETED
                  </div>
                  <div className="text-sm font-bold text-white">
                    {hoveredDevice.name}
                  </div>
                  <div className="text-xs text-amber-300 font-mono mt-1 font-semibold">
                    {isMobile
                      ? 'TAP [INTERACT] BUTTON'
                      : 'PRESS [E] TO INTERACT'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-3 h-3 relative opacity-70">
                <div className="absolute top-1/2 left-0 w-3 h-0.5 bg-cyan-400/80 -translate-y-1/2" />
                <div className="absolute left-1/2 top-0 h-3 w-0.5 bg-cyan-400/80 -translate-x-1/2" />
              </div>
            )}
          </div>

          {/* Bottom Bar: Score & Legend */}
          <div className="flex flex-wrap justify-between items-end gap-2 w-full">
            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] sm:text-xs font-mono text-zinc-400 border border-slate-800 flex items-center gap-2">
              <span>
                SCORE:{' '}
                <strong className="text-white">{gameState.score}</strong>
              </span>
              <span>·</span>
              <span>
                PATCH CABLES:{' '}
                <strong className="text-cyan-400">
                  {cables.filter((c) => c.plugged).length}/{cables.length} LINKED
                </strong>
              </span>
              <span>·</span>
              <span>
                INCIDENTS:{' '}
                <strong className="text-amber-400">
                  {missions.filter((m) => m.completed).length}/4
                </strong>
              </span>
            </div>

            {!isMobile && (
              <div className="text-zinc-400 text-[11px] font-mono bg-slate-950/80 px-3 py-1 rounded-md border border-slate-800">
                <span className="text-cyan-400">WASD</span>: Move ·{' '}
                <span className="text-cyan-400">Shift</span>: Sprint ·{' '}
                <span className="text-cyan-400">Space</span>: Jump ·{' '}
                <span className="text-cyan-400">E</span>: Interact/Plug/Unplug ·{' '}
                <span className="text-cyan-400">TAB</span>: Topology ·{' '}
                <span className="text-cyan-400">ESC</span>: Menu
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THREE.JS 3D CANVAS & FIRST-PERSON ENGINE                               */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full min-h-0 relative">
        <Game
          key={gameKey}
          gameState={gameState}
          setGameState={setGameState}
          exitChat={exitChat}
          gameStateRef={gameStateRef}
          devices={devices}
          cables={cables}
          activeTargetDeviceId={activeMission?.targetDeviceId}
          hoveredDevice={hoveredDevice}
          setHoveredDevice={setHoveredDevice}
          hoveredCable={hoveredCable}
          setHoveredCable={setHoveredCable}
          onInteractDevice={handleInteractDevice}
          onToggleCable={handleToggleCable}
          onUpdatePlayerPos={handleUpdatePlayerPos}
          isMobile={isMobile}
          virtualMove={virtualMove}
          isPaused={
            isGameMenuOpen ||
            isHowToPlayOpen ||
            selectedDevice !== null ||
            isTopologyOpen
          }
          isMorningMode={isMorningMode}
          onToggleTopology={() => setIsTopologyOpen((prev) => !prev)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE TOUCH CONTROLS                                                 */}
      {/* ========================================================================= */}
      {isMobile && gameState.status === 'PLAYING' && !isGameMenuOpen && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end p-4 pb-8">
          <div className="flex justify-between items-end w-full">
            <div className="pointer-events-auto flex flex-col items-center gap-1.5 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <button
                onPointerDown={() => setVirtualMove({x: 0, y: 1})}
                onPointerUp={() => setVirtualMove({x: 0, y: 0})}
                onPointerLeave={() => setVirtualMove({x: 0, y: 0})}
                className="w-12 h-12 bg-slate-800 active:bg-cyan-600 rounded-xl font-bold text-white flex items-center justify-center border border-slate-700 shadow-md">
                ▲
              </button>
              <div className="flex gap-2">
                <button
                  onPointerDown={() => setVirtualMove({x: -1, y: 0})}
                  onPointerUp={() => setVirtualMove({x: 0, y: 0})}
                  onPointerLeave={() => setVirtualMove({x: 0, y: 0})}
                  className="w-12 h-12 bg-slate-800 active:bg-cyan-600 rounded-xl font-bold text-white flex items-center justify-center border border-slate-700 shadow-md">
                  ◀
                </button>
                <button
                  onPointerDown={() => setVirtualMove({x: 0, y: -1})}
                  onPointerUp={() => setVirtualMove({x: 0, y: 0})}
                  onPointerLeave={() => setVirtualMove({x: 0, y: 0})}
                  className="w-12 h-12 bg-slate-800 active:bg-cyan-600 rounded-xl font-bold text-white flex items-center justify-center border border-slate-700 shadow-md">
                  ▼
                </button>
                <button
                  onPointerDown={() => setVirtualMove({x: 1, y: 0})}
                  onPointerUp={() => setVirtualMove({x: 0, y: 0})}
                  onPointerLeave={() => setVirtualMove({x: 0, y: 0})}
                  className="w-12 h-12 bg-slate-800 active:bg-cyan-600 rounded-xl font-bold text-white flex items-center justify-center border border-slate-700 shadow-md">
                  ▶
                </button>
              </div>
            </div>

            <div className="pointer-events-auto flex flex-col gap-2.5">
              {hoveredCable ? (
                <button
                  onClick={() => handleToggleCable(hoveredCable)}
                  className="w-16 h-16 bg-amber-600 active:bg-amber-500 rounded-2xl font-bold text-white flex flex-col items-center justify-center border-2 border-amber-300 shadow-lg shadow-amber-900/60 animate-bounce">
                  <span className="text-[10px] font-mono font-black">
                    {hoveredCable.plugged ? 'UNPLUG' : 'PLUG IN'}
                  </span>
                  <span className="text-[9px] text-amber-200">CABLE</span>
                </button>
              ) : hoveredDevice ? (
                <button
                  onClick={() => handleInteractDevice(hoveredDevice)}
                  className="w-14 h-14 bg-cyan-600 active:bg-cyan-500 rounded-2xl font-bold text-white flex flex-col items-center justify-center border-2 border-cyan-300 shadow-lg shadow-cyan-900/60 animate-bounce">
                  <span className="text-xs font-mono font-black">INTERACT</span>
                  <span className="text-[10px] text-cyan-200">[E]</span>
                </button>
              ) : null}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setIsTopologyOpen(true);
                  }}
                  className="w-12 h-12 bg-slate-800 active:bg-slate-700 rounded-xl font-bold text-cyan-300 flex items-center justify-center border border-slate-700 text-[10px]">
                  MAP
                </button>
                <button
                  onClick={() => {
                    const evt = new KeyboardEvent('keydown', {key: ' '});
                    window.dispatchEvent(evt);
                  }}
                  className="w-12 h-12 bg-slate-800 active:bg-slate-700 rounded-xl font-bold text-white flex items-center justify-center border border-slate-700 text-xs">
                  JUMP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HOLOGRAPHIC DEVICE MANAGEMENT MODAL                                    */}
      {/* ========================================================================= */}
      {selectedDevice && (
        <MenuOverlay tone="neutral" zIndex={45}>
          <div className="w-full max-w-xl bg-slate-900/95 border-2 border-cyan-500/70 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl flex flex-col gap-4 text-slate-100">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 uppercase font-bold">
                    {selectedDevice.type}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      selectedDevice.status === 'normal'
                        ? 'bg-emerald-950 border border-emerald-600 text-emerald-400'
                        : selectedDevice.status === 'warning'
                        ? 'bg-amber-950 border border-amber-600 text-amber-400'
                        : 'bg-rose-950 border border-rose-600 text-rose-400 animate-pulse'
                    }`}>
                    {selectedDevice.status === 'offline' ? 'OFFLINE (NO CARRIER)' : selectedDevice.status}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                  {selectedDevice.name}
                </h2>
                <div className="text-xs font-mono text-zinc-400">
                  ID: {selectedDevice.id} · {selectedDevice.zone} (
                  {selectedDevice.roomName})
                </div>
              </div>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setSelectedDeviceId(null);
                }}
                className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-mono font-bold">
                ✕ ESC
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
              {(
                ['overview', 'performance', 'cables', 'network', 'actions'] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setSelectedTab(tab);
                  }}
                  className={`text-xs font-mono uppercase px-3 py-1.5 border-b-2 font-bold transition-colors whitespace-nowrap ${
                    selectedTab === tab
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-zinc-400 hover:text-slate-200'
                  }`}>
                  {tab === 'cables' ? 'Cables & Ports' : tab}
                </button>
              ))}
            </div>

            {/* Tab Content: Overview */}
            {selectedTab === 'overview' && (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono py-1">
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-zinc-400 text-[10px]">IP ADDRESS</div>
                  <div className="text-cyan-300 font-bold text-sm">
                    {selectedDevice.ip}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-zinc-400 text-[10px]">MAC ADDRESS</div>
                  <div className="text-slate-200 text-sm font-semibold">
                    {selectedDevice.mac}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-zinc-400 text-[10px]">FIRMWARE OS</div>
                  <div className="text-slate-200">{selectedDevice.firmware}</div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-zinc-400 text-[10px]">SYSTEM UPTIME</div>
                  <div className="text-slate-200">
                    {selectedDevice.telemetry.uptime}
                  </div>
                </div>
                <div className="col-span-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-zinc-300 leading-relaxed font-sans text-xs">
                  {selectedDevice.description}
                </div>
              </div>
            )}

            {/* Tab Content: Cables & Ports */}
            {selectedTab === 'cables' && (
              <div className="flex flex-col gap-3 py-1 font-mono text-xs">
                <div className="text-zinc-400 text-[11px] flex justify-between items-center">
                  <span>PHYSICAL INTERFACE PORTS & CABLE TERMINATIONS:</span>
                  <span className="text-cyan-400">
                    {deviceCables.filter((c) => c.plugged).length}/{deviceCables.length} CARRIER UP
                  </span>
                </div>
                {deviceCables.length === 0 ? (
                  <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 text-zinc-500 text-center">
                    No physical patch cables currently mapped to this device chassis.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {deviceCables.map((c) => {
                      const isLocalFrom = c.fromDeviceId === selectedDevice.id;
                      const localPort = isLocalFrom ? c.fromPort : c.toPort;
                      const remoteTarget = isLocalFrom
                        ? `${c.toDeviceId} (${c.toPort})`
                        : `${c.fromDeviceId} (${c.fromPort})`;

                      return (
                        <div
                          key={c.id}
                          className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {localPort}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  c.plugged
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                                    : 'bg-rose-950 text-rose-400 border border-rose-700 animate-pulse'
                                }`}>
                                {c.plugged ? 'LINK UP (CARRIER DETECTED)' : 'NO-CARRIER (DISCONNECTED)'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Cable: {c.name} ({c.cableType}, {c.speed})
                            </div>
                            <div className="text-[10px] text-cyan-300">
                              ➔ Remote: {remoteTarget}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleCable(c)}
                            className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors border ${
                              c.plugged
                                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-700 text-rose-300'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600 text-emerald-300'
                            }`}>
                            {c.plugged ? 'UNPLUG' : 'PLUG IN'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Performance */}
            {selectedTab === 'performance' && (
              <div className="flex flex-col gap-3 py-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-400">CPU UTILIZATION</span>
                      <span className="font-bold text-cyan-300">
                        {selectedDevice.telemetry.cpu}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedDevice.telemetry.cpu > 80
                            ? 'bg-rose-500'
                            : 'bg-cyan-400'
                        }`}
                        style={{width: `${selectedDevice.telemetry.cpu}%`} as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-400">MEMORY ALLOCATION</span>
                      <span className="font-bold text-cyan-300">
                        {selectedDevice.telemetry.memory}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400"
                        style={{width: `${selectedDevice.telemetry.memory}%`} as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-400">THERMAL READING</span>
                      <span
                        className={`font-bold ${
                          selectedDevice.telemetry.temperature > 75
                            ? 'text-rose-400 animate-pulse'
                            : 'text-emerald-400'
                        }`}>
                        {selectedDevice.telemetry.temperature}°C
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedDevice.telemetry.temperature > 75
                            ? 'bg-rose-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedDevice.telemetry.temperature / 100) * 100,
                          )}%`,
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-zinc-400">INTERFACE LATENCY</span>
                      <span className="font-bold text-amber-300">
                        {selectedDevice.telemetry.latency} ms
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{
                          width: `${Math.min(
                            100,
                            selectedDevice.telemetry.latency / 5,
                          )}%`,
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Network */}
            {selectedTab === 'network' && (
              <div className="flex flex-col gap-3 py-1 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-zinc-400 text-[10px]">
                      INGRESS THROUGHPUT
                    </div>
                    <div className="text-emerald-400 font-bold text-base">
                      {selectedDevice.telemetry.inTraffic} Mbps
                    </div>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-zinc-400 text-[10px]">
                      EGRESS THROUGHPUT
                    </div>
                    <div className="text-cyan-400 font-bold text-base">
                      {selectedDevice.telemetry.outTraffic} Mbps
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div className="text-zinc-400 text-[10px] mb-1.5">
                    CONNECTED TOPOLOGY NEIGHBORS
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDevice.connectedTo.map((neighbor) => (
                      <span
                        key={neighbor}
                        className="bg-slate-800 px-2.5 py-1 rounded text-cyan-300 font-bold border border-slate-700">
                        {neighbor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Actions & Real Network Ping Terminal */}
            {selectedTab === 'actions' && (
              <div className="flex flex-col gap-3 py-1">
                {/* Mission Remediation Action */}
                {selectedDevice.id === activeMission?.targetDeviceId && (
                  <div className="bg-amber-950/40 border border-amber-500/60 p-3.5 rounded-xl flex flex-col gap-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-400" />
                      SIMULATION TROUBLESHOOTING MISSION ACTIVE
                    </div>
                    <div className="text-xs text-slate-300 leading-snug">
                      {activeMission.explanation}
                    </div>
                    <button
                      onClick={executeRemediation}
                      disabled={isRemediating}
                      className="mt-1 bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 font-black py-2.5 px-4 rounded-lg font-mono text-xs uppercase transition-all shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2">
                      {isRemediating ? (
                        <RotateCw size={16} className="animate-spin" />
                      ) : (
                        <Zap size={16} />
                      )}
                      {isRemediating
                        ? 'APPLYING FIRMWARE PATCH...'
                        : activeMission.actionName}
                    </button>
                  </div>
                )}

                {/* REAL NETWORK ICMP PING TERMINAL */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-cyan-400" />
                      <span className="text-xs font-mono font-bold text-white">
                        LIVE ICMP PING DIAGNOSTICS
                      </span>
                    </div>

                    {/* Quick IP Targets */}
                    <div className="flex gap-1.5 text-[10px] font-mono">
                      {[
                        {label: 'Gateway', ip: '10.0.0.1'},
                        {label: 'Core Switch', ip: '10.0.20.1'},
                        {label: 'Server Blade', ip: '10.0.30.11'},
                        {label: 'Internet DNS', ip: '8.8.8.8'},
                      ].map((t) => (
                        <button
                          key={t.ip}
                          onClick={() => {
                            setPingTargetIp(t.ip);
                            runPingTest(t.ip);
                          }}
                          className={`px-2 py-0.5 rounded border transition-colors ${
                            pingTargetIp === t.ip
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                              : 'bg-slate-900 text-zinc-400 border-slate-800 hover:text-white'
                          }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input & Ping Trigger */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pingTargetIp}
                      onChange={(e) => setPingTargetIp(e.target.value)}
                      placeholder="Target IP (e.g. 10.0.0.1)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => runPingTest()}
                      disabled={isPinging}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-mono font-bold border border-cyan-500 shadow-md">
                      {isPinging ? 'PINGING...' : 'PING HOST'}
                    </button>
                  </div>

                  {/* Terminal Console Output */}
                  <div className="bg-black/90 p-3 rounded-lg border border-slate-800 font-mono text-[11px] min-h-[90px] flex flex-col justify-center">
                    {isPinging ? (
                      <div className="text-cyan-400 flex items-center gap-2">
                        <RotateCw size={14} className="animate-spin" />
                        <span>Transmitting ICMP ECHO_REQUEST packets across physical links...</span>
                      </div>
                    ) : pingResult ? (
                      <div className="flex flex-col gap-1">
                        {pingResult.lines.map((line, idx) => (
                          <div
                            key={`ping-${idx}`}
                            className={
                              line.includes('Destination Host Unreachable') ||
                              line.includes('NO-CARRIER') ||
                              line.includes('100% packet loss') ||
                              line.includes('Request timeout')
                                ? 'text-rose-400 font-bold'
                                : line.includes('DIAGNOSTIC NOTICE')
                                ? 'text-amber-300 font-semibold'
                                : line.includes('bytes from')
                                ? 'text-emerald-400'
                                : 'text-zinc-300'
                            }>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-500 text-xs">
                        Enter target IP and execute ping to test physical cable connectivity & routing hops in real time.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* 5. DIGITAL TWIN LIVE TOPOLOGY & HEALTH OVERLAY (TAB / NOC Console)        */}
      {/* ========================================================================= */}
      {isTopologyOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-4xl bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-cyan-400" />
                <h2 className="text-lg sm:text-xl font-black text-white">
                  DIGITAL TWIN INFRASTRUCTURE TOPOLOGY
                </h2>
              </div>
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsTopologyOpen(false);
                }}
                className="text-zinc-400 hover:text-white px-3 py-1 rounded-lg border border-slate-700 text-xs font-mono font-bold">
                ✕ CLOSE [TAB]
              </button>
            </div>

            {/* Interactive Topology Graph SVG with Live Cable Physical Status */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              <svg viewBox="0 0 800 320" className="w-full min-w-[600px] h-auto">
                {TOPOLOGY_LINKS.map((link, idx) => {
                  const src = devices.find((d) => d.id === link.fromId);
                  const dst = devices.find((d) => d.id === link.toId);
                  if (!src || !dst) return null;

                  // Find matching physical cable to evaluate actual link state
                  const matchedCable = cables.find(
                    (c) =>
                      (c.fromDeviceId === link.fromId && c.toDeviceId === link.toId) ||
                      (c.fromDeviceId === link.toId && c.toDeviceId === link.fromId),
                  );

                  const isPlugged = matchedCable ? matchedCable.plugged : true;
                  const isDegraded = link.status === 'degraded';

                  const x1 = ((src.position[0] + 25) / 50) * 700 + 50;
                  const y1 = ((src.position[2] + 30) / 50) * 240 + 40;
                  const x2 = ((dst.position[0] + 25) / 50) * 700 + 50;
                  const y2 = ((dst.position[2] + 30) / 50) * 240 + 40;

                  return (
                    <g key={`top-link-${idx}`}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          !isPlugged
                            ? '#ef4444'
                            : isDegraded
                            ? '#f59e0b'
                            : '#0284c7'
                        }
                        strokeWidth={!isPlugged ? '3' : '2.5'}
                        strokeDasharray={!isPlugged ? '6 4' : '4 2'}
                        opacity={!isPlugged ? 0.9 : 0.75}
                      />
                      {!isPlugged && (
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 6}
                          fill="#ef4444"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace">
                          UNPLUGGED
                        </text>
                      )}
                    </g>
                  );
                })}

                {devices.map((dev) => {
                  const nx = ((dev.position[0] + 25) / 50) * 700 + 50;
                  const ny = ((dev.position[2] + 30) / 50) * 240 + 40;
                  const isNodeFailed = dev.status === 'critical' || dev.status === 'offline';
                  const isNodeDegraded = dev.status === 'warning';

                  return (
                    <g
                      key={`top-node-${dev.id}`}
                      className="cursor-pointer"
                      onClick={() => {
                        handleInteractDevice(dev);
                        setIsTopologyOpen(false);
                      }}>
                      <circle
                        cx={nx}
                        cy={ny}
                        r="14"
                        fill="#0f172a"
                        stroke={
                          isNodeFailed
                            ? '#ef4444'
                            : isNodeDegraded
                            ? '#f59e0b'
                            : '#06b6d4'
                        }
                        strokeWidth="3"
                      />
                      <circle
                        cx={nx}
                        cy={ny}
                        r="6"
                        fill={
                          isNodeFailed
                            ? '#ef4444'
                            : isNodeDegraded
                            ? '#f59e0b'
                            : '#10b981'
                        }
                      />
                      <text
                        x={nx}
                        y={ny + 24}
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace">
                        {dev.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Live Alerts List */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="text-xs font-mono font-bold text-zinc-300 flex items-center justify-between">
                <span>INCIDENT TELEMETRY LOG</span>
                <span className="text-[10px] text-zinc-500">REAL-TIME</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-center gap-2 text-xs font-mono p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-zinc-500 text-[10px]">[{alt.time}]</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        alt.level === 'critical'
                          ? 'bg-rose-950 text-rose-400'
                          : alt.level === 'warning'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-emerald-950 text-emerald-400'
                      }`}>
                      {alt.source}
                    </span>
                    <span className="text-slate-200 truncate">{alt.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* 6. GAME MENU / PAUSE OVERLAY                                              */}
      {/* ========================================================================= */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3.5 text-white">
            <h2 className="text-2xl font-black text-cyan-400 tracking-wider">
              SIMULATION MENU
            </h2>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(false);
              }}
              autoFocus
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px] transition-colors shadow-md">
              <Play size={18} />
              RESUME
            </button>

            {/* Morning Mode Toggle inside Menu */}
            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsMorningMode((prev) => !prev);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px]">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isMorningMode ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
                }`}
              />
              ENVIRONMENT: {isMorningMode ? 'MORNING MODE (ACTIVE)' : 'NIGHT MODE (ACTIVE)'}
            </button>

            {/* Separate Music & SFX Toggles */}
            <div className="w-full flex gap-2">
              <button
                onClick={() => {
                  const nextMuted = gameAudio.toggleMute();
                  setIsSfxMuted(nextMuted);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 min-h-[48px]">
                {isSfxMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                SFX: {isSfxMuted ? 'OFF' : 'ON'}
              </button>

              <button
                onClick={() => setIsMusicMuted((prev) => !prev)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 min-h-[48px]">
                {isMusicMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                BGM: {isMusicMuted ? 'OFF' : 'ON'}
              </button>
            </div>

            <button
              onClick={() => {
                setIsGameMenuOpen(false);
                startRun(gameState.level, levelStartScoreRef.current);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px] text-xs font-mono">
              <RotateCw size={16} />
              TRY LEVEL AGAIN
            </button>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(true);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px] text-xs font-mono">
              <Info size={16} />
              HOW TO PLAY
            </button>

            <button
              onClick={() => {
                setIsGameMenuOpen(false);
                setGameState((prev) => ({...prev, status: 'START'}));
              }}
              className="w-full bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center min-h-[48px] text-xs font-mono">
              QUIT TO TITLE
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* 7. HOW TO PLAY OVERLAY                                                    */}
      {/* ========================================================================= */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={70}>
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <h2 className="text-xl font-black text-cyan-400 tracking-wider">
              OPERATIONAL BRIEFING
            </h2>
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-sans leading-relaxed">
              <p>
                <strong>1. First-Person Exploration:</strong> Explore the
                datacenter corridors using{' '}
                <span className="text-cyan-300 font-bold">WASD</span>, look with{' '}
                <span className="text-cyan-300 font-bold">Mouse</span>, and sprint
                with <span className="text-cyan-300 font-bold">Shift</span>.
              </p>
              <p>
                <strong>2. Physical Cable Patching:</strong> Walk up to any
                server rack, switch, or router. Aim at patch cords and press{' '}
                <span className="text-amber-400 font-bold">E</span> to physically{' '}
                <strong>Plug or Unplug cables</strong>! You can also manage ports
                directly inside the device's "Cables & Ports" tab.
              </p>
              <p>
                <strong>3. Real Network ICMP Ping:</strong> Open the "Actions" tab
                on any device to execute real network pings. If a device has its
                cables unplugged, the ping will realistically fail with{' '}
                <span className="text-rose-400 font-bold">NO-CARRIER</span> or{' '}
                <span className="text-rose-400 font-bold">Destination Host Unreachable</span>!
              </p>
              <p>
                <strong>4. Morning Mode:</strong> Toggle Morning Mode on the HUD
                or menu to bathe the facility in natural dawn sunlight through
                the glass roof skylights.
              </p>
            </div>
            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsHowToPlayOpen(false);
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl min-h-[48px] mt-2 transition-colors">
              BACK
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* 8. START SIMULATION BRIEFING OVERLAY                                      */}
      {/* ========================================================================= */}
      {gameState.status === 'START' && !autoStartPending && (
        <MenuOverlay tone="neutral" zIndex={40}>
          <div className="bg-slate-900/95 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md border-2 border-cyan-500/60 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-400 flex items-center justify-center mb-4 text-cyan-300 shadow-lg shadow-cyan-950/60">
              <Activity size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center tracking-tight">
              {getConfig('title') ?? 'NETVERSE OPS'}
            </h1>
            <p className="text-cyan-300 font-mono text-xs uppercase tracking-widest text-center mb-4">
              FPS Digital Twin Network Simulator
            </p>
            <p className="text-slate-300 text-xs sm:text-sm text-center mb-6 leading-relaxed">
              Step into an enterprise datacenter facility in first-person 3D.
              Physically plug and unplug patch cables, switch between Morning
              and Night modes, run real ICMP network pings, and troubleshoot
              routers and server racks in real time.
            </p>

            <button
              ref={startButtonRef}
              onClick={initGame}
              autoFocus
              data-testid="start-button"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 px-6 py-3 rounded-xl font-black text-base hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/80 min-h-[48px]">
              <Play size={20} />
              START SIMULATION
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* 9. VICTORY OVERLAY                                                        */}
      {/* ========================================================================= */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="bg-slate-900 border-2 border-emerald-500/80 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md backdrop-blur-xl">
            <Trophy size={48} className="text-emerald-400 mb-3" />
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-2 text-center">
              NETWORK RESTORED!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 text-center mb-4">
              All simulated network incidents successfully resolved. Datacenter
              infrastructure operating at 100% SLA health.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 w-full mb-6 text-center font-mono text-xs text-zinc-300">
              FINAL SCORE:{' '}
              <span className="text-cyan-400 font-bold">{gameState.score}</span>
            </div>
            <button
              onClick={resetGame}
              autoFocus
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-black text-base transition-colors flex items-center justify-center gap-2 min-h-[48px]">
              <RotateCw size={20} />
              PLAY AGAIN
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* ========================================================================= */}
      {/* 10. GAME OVER OVERLAY                                                     */}
      {/* ========================================================================= */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="bg-slate-900 border-2 border-rose-500/80 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md backdrop-blur-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-rose-500 mb-2 text-center">
              CASCADE OUTAGE
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 text-center mb-6">
              Network health dropped to 0%. The datacenter experienced an
              unrecoverable service cascade failure.
            </p>
            <button
              onClick={initGame}
              autoFocus
              className="w-full bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-black text-base transition-colors flex items-center justify-center gap-2 min-h-[48px]">
              <RotateCw size={20} />
              TRY AGAIN
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}

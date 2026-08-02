"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { buildRosePoints } from "@/lib/rose";

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

interface BurstTrigger {
  seq: number;
  x: number;
  y: number;
}

const MAX_BURST_PARTICLES = 600;

function createSoftSprite(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.85)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function RosePoints({
  count,
  reducedMotion,
  triggerRef,
}: {
  count: number;
  reducedMotion: boolean;
  triggerRef: RefObject<BurstTrigger>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const introRef = useRef(0);
  const pulseRef = useRef(0);
  const prevSeq = useRef(0);

  const geometry = useMemo(() => {
    const { positions, colors } = buildRosePoints(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  const sprite = useMemo(() => createSoftSprite(), []);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const tr = triggerRef.current;
    if (tr && tr.seq !== prevSeq.current) {
      prevSeq.current = tr.seq;
      pulseRef.current = 1;
    }
    pulseRef.current = Math.max(0, pulseRef.current - delta * 1.3);
    const pulse = pulseRef.current;

    if (!reducedMotion) {
      if (introRef.current < 1)
        introRef.current = Math.min(1, introRef.current + delta / 1.8);
      const k = easeOutCubic(introRef.current);
      const breath = Math.sin(t * 0.7) * 0.03;
      g.rotation.y += delta * 0.12 * k;
      g.scale.set(
        k * (1 + breath + pulse * 0.14),
        k * (1 - breath * 0.5 - pulse * 0.09),
        k * (1 + breath + pulse * 0.14),
      );
    } else {
      g.rotation.y = 0;
      g.scale.setScalar(1);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          map={sprite}
          size={0.07}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function BurstSystem({
  triggerRef,
}: {
  triggerRef: RefObject<BurstTrigger>;
}) {
  const camera = useThree((s) => s.camera);
  const [geometry, particles] = useMemo(() => {
    const positions = new Float32Array(MAX_BURST_PARTICLES * 3);
    const colors = new Float32Array(MAX_BURST_PARTICLES * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, 0);
    const arr = Array.from({ length: MAX_BURST_PARTICLES }, () => ({
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      color: new THREE.Color(),
    }));
    return [geo, arr] as const;
  }, []);

  const sprite = useMemo(() => createSoftSprite(), []);
  const prevSeq = useRef(0);
  const cursor = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );
  const origin = useMemo(() => new THREE.Vector3(), []);

  const spawnBurst = (point: THREE.Vector3) => {
    const count = 90;
    for (let k = 0; k < count; k++) {
      const p = particles[cursor.current];
      cursor.current = (cursor.current + 1) % MAX_BURST_PARTICLES;
      p.active = true;
      p.pos.copy(point);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1) * 0.55;
      const speed = 1.6 + Math.random() * 2.6;
      p.vel
        .set(
          Math.sin(theta) * Math.cos(phi),
          Math.sin(phi),
          Math.cos(theta) * Math.cos(phi),
        )
        .multiplyScalar(speed);
      p.life = p.maxLife = 0.7 + Math.random() * 1.0;
      p.color
        .set(Math.random() < 0.5 ? 0xff7ab8 : 0xffc96b)
        .multiplyScalar(0.8 + Math.random() * 0.4);
    }
  };

  useFrame((_, delta) => {
    const tr = triggerRef.current;
    if (tr && tr.seq !== prevSeq.current) {
      prevSeq.current = tr.seq;
      ndc.set(tr.x, tr.y);
      raycaster.setFromCamera(ndc, camera);
      const point = raycaster.ray.intersectPlane(plane, origin) ?? origin;
      spawnBurst(point);
    }

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
    let lastActive = -1;
    for (let i = 0; i < MAX_BURST_PARTICLES; i++) {
      const p = particles[i];
      if (!p.active) continue;
      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        colAttr.setXYZ(i, 0, 0, 0);
        continue;
      }
      p.pos.addScaledVector(p.vel, delta);
      p.vel.multiplyScalar(1 - delta * 1.1);
      p.vel.y -= delta * 0.55;
      posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      const a = p.life / p.maxLife;
      colAttr.setXYZ(i, p.color.r * a, p.color.g * a, p.color.b * a);
      lastActive = i;
    }
    geometry.setDrawRange(0, lastActive + 1);
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={sprite}
        size={0.13}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface RoseSceneProps {
  particleCount?: number;
  reducedMotion?: boolean;
}

export default function RoseScene({
  particleCount = 9000,
  reducedMotion = false,
}: RoseSceneProps) {
  const burstTrigger = useRef<BurstTrigger>({ seq: 0, x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        burstTrigger.current = {
          seq: burstTrigger.current.seq + 1,
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
        };
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [3, 2.6, 4.6], fov: 42 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#050505"]} />
        <RosePoints
          count={particleCount}
          reducedMotion={reducedMotion}
          triggerRef={burstTrigger}
        />
        <BurstSystem triggerRef={burstTrigger} />
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={1.25}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.9}
            radius={0.85}
          />
        </EffectComposer>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.55}
          minDistance={2.2}
          maxDistance={9}
          target={[0, 0.45, 0]}
        />
      </Canvas>
    </div>
  );
}

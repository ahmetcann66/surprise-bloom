"use client";

/* eslint-disable react-hooks/immutability, react-hooks/purity -- Three.js render loop'ta imperative mutasyon gerekli */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import type { Theme } from "@/lib/types";

interface ThreeSceneProps {
  theme: Theme;
  particleCount: number;
  opened: boolean;
  onBloomComplete?: () => void;
}

const PETALS = 12;
const OUTER_TILT = -1.25;

function createPetalGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1);
  shape.bezierCurveTo(0.5, -0.6, 0.6, 0.3, 0, 1);
  shape.bezierCurveTo(-0.6, 0.3, -0.5, -0.6, 0, -1);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  geometry.center();
  return geometry;
}

function CameraRig({ opened }: { opened: boolean }) {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    camera.lookAt(0, 0.4, 0);
  });

  useEffect(() => {
    if (!opened) return;
    const tl = gsap.timeline();
    tl.to(
      camera.position,
      { x: 1.6, y: 2.1, z: 5.2, duration: 2.2, ease: "power2.inOut" },
      0,
    );
    return () => {
      tl.kill();
    };
  }, [opened, camera]);

  return null;
}

function Flower({
  theme,
  opened,
  onBloomComplete,
}: {
  theme: Theme;
  opened: boolean;
  onBloomComplete?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const petalGeometry = useMemo(() => createPetalGeometry(), []);

  const petals = useMemo(
    () =>
      Array.from({ length: PETALS }, (_, i) => ({
        angle: (i / PETALS) * Math.PI * 2,
        color: theme.petalColors[i % theme.petalColors.length],
      })),
    [theme.petalColors],
  );

  useEffect(() => {
    if (!opened || !group.current) return;
    const petalsMeshes = group.current.children;
    const tl = gsap.timeline({
      onComplete: () => onBloomComplete?.(),
    });
    tl.fromTo(
      group.current.scale,
      { x: 0.7, y: 0.7, z: 0.7 },
      { x: 1, y: 1, z: 1, duration: 1.4, ease: "power2.out" },
      0,
    );
    petalsMeshes.forEach((mesh, i) => {
      tl.fromTo(
        mesh.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.95, ease: "back.out(1.6)" },
        0.2 + i * 0.07,
      );
    });
    return () => {
      tl.kill();
    };
  }, [opened, onBloomComplete]);

  return (
    <group ref={group} position={[0, 0.2, 0]}>
      {petals.map((p, i) => (
        <group key={i} rotation={[0, p.angle, 0]}>
          <mesh rotation={[OUTER_TILT, 0, 0]} position={[0, 0.05, 0.42]}>
            <primitive object={petalGeometry} attach="geometry" />
            <meshStandardMaterial
              color={p.color}
              side={THREE.DoubleSide}
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial color={theme.centerColor} roughness={0.4} />
      </mesh>
    </group>
  );
}

function FallingPetals({
  count,
  colors,
}: {
  count: number;
  colors: string[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const petalGeometry = useMemo(() => createPetalGeometry(), []);

  const data = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const color = new THREE.Color(
          colors[Math.floor(Math.random() * colors.length)],
        );
        return {
          speed: 0.35 + Math.random() * 0.55,
          sway: 0.8 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          rotX: Math.random() * Math.PI,
          rotZ: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 1.6,
          scale: 0.35 + Math.random() * 0.65,
          color,
          x: (Math.random() - 0.5) * 16,
          y: 6 + Math.random() * 9,
          z: (Math.random() - 0.5) * 10,
        };
      }),
    [count, colors],
  );

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < data.length; i++) {
      mesh.setColorAt(i, data[i].color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.y -= d.speed * dt;
      if (d.y < -5) {
        d.y = 9;
        d.x = (Math.random() - 0.5) * 16;
        d.z = (Math.random() - 0.5) * 10;
      }
      dummy.position.set(
        d.x + Math.sin(t * d.sway + d.phase) * 0.7,
        d.y,
        d.z,
      );
      dummy.rotation.set(d.rotX + t * d.spin, 0, d.rotZ + t * d.spin * 1.3);
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[petalGeometry, undefined, count]}>
      <meshStandardMaterial
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
        roughness={0.7}
      />
    </instancedMesh>
  );
}

export default function ThreeScene({
  theme,
  particleCount,
  opened,
  onBloomComplete,
}: ThreeSceneProps) {
  return (
    <Canvas
      camera={{ position: [2.8, 3.2, 7], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <CameraRig opened={opened} />
      <Flower
        theme={theme}
        opened={opened}
        onBloomComplete={onBloomComplete}
      />
      <FallingPetals count={particleCount} colors={theme.petalColors} />
    </Canvas>
  );
}

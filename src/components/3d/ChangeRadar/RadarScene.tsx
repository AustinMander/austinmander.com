"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Line, Plane, Text } from "@react-three/drei";
import * as THREE from "three";

interface RadarSceneProps {
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    alert: string;
  };
}

export function RadarScene({
  theme = {
    primary: "#0b2545", // Navy
    secondary: "#00bfa6", // Teal
    accent: "#ffffff",  // White
    alert: "#f9a826",   // Gold
  },
}: RadarSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scanBeamRef = useRef<THREE.Mesh>(null);

  // Generate random "risk" blips
  const riskBlips = useMemo(() => {
    return new Array(8).fill(0).map(() => ({
      position: [
        (Math.random() - 0.5) * 8, // x
        (Math.random() - 0.5) * 2, // y
        (Math.random() - 0.5) * 8, // z
      ] as [number, number, number],
      delay: Math.random() * 2,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
    if (scanBeamRef.current) {
        // Rotate the beam faster than the grid
        scanBeamRef.current.rotation.y -= 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Axis */}
      <Line
        points={[
            [0, -2, 0],
            [0, 2, 0]
        ]}
        color={theme.secondary}
        lineWidth={1}
        transparent
        opacity={0.5}
      />

      {/* Main Radar Plane (Grid) */}
      <gridHelper 
        args={[12, 12, theme.secondary, theme.primary]} 
        position={[0, -1, 0]}
        rotation={[0, 0, 0]}
      />
      <gridHelper 
        args={[12, 6, theme.secondary, theme.primary]} 
        position={[0, 1, 0]}
        rotation={[0, 0, 0]}
      />

      {/* Scanning Beam */}
      <group position={[0, -0.9, 0]}>
        <mesh ref={scanBeamRef} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[5, 0.1, 32, 1, true, 0, Math.PI / 4]} />
            <meshBasicMaterial 
                color={theme.secondary} 
                transparent 
                opacity={0.1} 
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
      </group>

      {/* Interactive Risk Blips */}
      {riskBlips.map((blip, i) => (
        <RiskBlip 
            key={i} 
            position={blip.position} 
            color={theme.alert} 
            secondaryColor={theme.secondary}
            delay={blip.delay}
        />
      ))}
      
      {/* Ambient particles for depth */}
        {new Array(30).fill(0).map((_, i) => (
            <mesh 
                key={`star-${i}`}
                position={[
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 15
                ]}
            >
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshBasicMaterial color={theme.accent} transparent opacity={0.4} />
            </mesh>
        ))}
    </group>
  );
}

function RiskBlip({ position, color, secondaryColor, delay }: { position: [number, number, number], color: string, secondaryColor: string, delay: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [visible, setVisible] = (useMemo(() => {
        let v = false;
        const t = 0;
        return [v, (val: boolean) => { v = val; }]; // Mock state hook for loop, actually we use useFrame refs
    }, []));

    // Simple customized shader or animation logic could go here
    // For MVP we just pulse scale
    useFrame((state) => {
        if (!meshRef.current) return;
        
        const time = state.clock.elapsedTime + delay;
        // Periodic "ping" effect
        const ping = Math.sin(time * 3);
        
        if (ping > 0.9) {
            meshRef.current.scale.setScalar(1 + (ping - 0.9) * 5);
            (meshRef.current.material as THREE.MeshBasicMaterial).color.set(color);
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1;
        } else {
            meshRef.current.scale.setScalar(0.2);
            (meshRef.current.material as THREE.MeshBasicMaterial).color.set(secondaryColor);
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={secondaryColor} transparent opacity={0.5} />
        </mesh>
    );
}

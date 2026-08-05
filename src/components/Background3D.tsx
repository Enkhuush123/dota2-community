"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ theme }: { theme: "dire" | "radiant" }) {
  const points = useRef<THREE.Points>(null);

  const particleCount = 1000;
  
  // Generate random positions for particles
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Create a large field of particles
      // eslint-disable-next-line react-hooks/purity
      pos[i * 3] = (Math.random() - 0.5) * 20;
      // eslint-disable-next-line react-hooks/purity
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      // eslint-disable-next-line react-hooks/purity
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  // Determine colors: Dire (Red/Orange ember), Radiant (Green/Gold spark)
  const targetColor = theme === "radiant" ? new THREE.Color("#34d399") : new THREE.Color("#ef4444");
  
  // Animate the color smoothly instead of snapping
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  useFrame((state, delta) => {
    if (points.current) {
      // Slowly rotate the entire particle field
      points.current.rotation.y = state.clock.elapsedTime * 0.03;
      points.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
    if (materialRef.current) {
      // Smooth color transition
      materialRef.current.color.lerp(targetColor, delta * 2);
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.15}
        color={targetColor}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function Background3D() {
  const [theme, setTheme] = useState<"dire" | "radiant">("dire");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Check initial theme
    if (document.documentElement.classList.contains("theme-radiant")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme("radiant");
    }

    // Observe changes to the html class for theme toggling
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isRadiant = document.documentElement.classList.contains("theme-radiant");
          setTheme(isRadiant ? "radiant" : "dire");
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch on initial render

  return (
    <div className="fixed inset-0 z-[-10] pointer-events-none bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        {/* Fog to hide particles in the distance */}
        <fog attach="fog" args={["#0f1115", 3, 15]} />
        <Particles theme={theme} />
      </Canvas>
      
      {/* Glowing Pulsing Dota 2 Logo */}
      <img 
        src="/dota2-logo.svg" 
        alt="Dota 2 Background" 
        className="animate-heartbeat w-[100vw] h-[100vw] md:w-[60vw] md:h-[60vw] object-contain pointer-events-none z-[-5]"
        style={{
          filter: theme === 'radiant' ? 'drop-shadow(0 0 100px #34d399)' : 'drop-shadow(0 0 100px #ef4444)'
        }}
      />

      {/* Removed the heavy overlay so particles are clearly visible */}
      <div className="absolute inset-0 bg-background/30 pointer-events-none" />
    </div>
  );
}

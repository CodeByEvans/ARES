import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import type { AppState } from '../types'

interface AIOrbProps {
  state: AppState
  analyserRef: React.RefObject<AnalyserNode | null>
}

const ICOSA_DETAIL = 4
const ORB_RADIUS = 1.2

const PARTICLE_COUNT = 3500
const SPHERE_RADIUS = 1.3
const MERIDIAN_COUNT = 10
const MERIDIAN_POINTS = 80
const HIGHLIGHT_COUNT = 80
const JITTER = 0.06
const FLARE_COUNT = 18
const FLARE_POINTS = 35
const OUTER_PARTICLE_COUNT = 2000
const OUTER_RADIUS = 1.35

const AURORA_STOPS = [
  { y: 1.0, color: [0.10, 0.90, 0.90] },
  { y: 0.5, color: [0.05, 0.60, 0.75] },
  { y: 0.0, color: [0.15, 0.25, 0.95] },
  { y: -0.3, color: [0.55, 0.10, 0.78] },
  { y: -0.6, color: [0.90, 0.15, 0.45] },
  { y: -1.0, color: [0.85, 0.05, 0.22] },
]

function auroraColor(y: number): [number, number, number] {
  const clamped = Math.max(-1, Math.min(1, y))
  let lower = AURORA_STOPS[0]
  let upper = AURORA_STOPS[AURORA_STOPS.length - 1]
  for (let i = 0; i < AURORA_STOPS.length - 1; i++) {
    if (clamped <= AURORA_STOPS[i].y && clamped >= AURORA_STOPS[i + 1].y) {
      lower = AURORA_STOPS[i]
      upper = AURORA_STOPS[i + 1]
      break
    }
  }
  const range = lower.y - upper.y
  const t = range === 0 ? 0 : (lower.y - clamped) / range
  return [
    lower.color[0] + (upper.color[0] - lower.color[0]) * t,
    lower.color[1] + (upper.color[1] - lower.color[1]) * t,
    lower.color[2] + (upper.color[2] - lower.color[2]) * t,
  ]
}

function createFlareGeo(center: THREE.Vector3, normal: THREE.Vector3, height: number, radius: number, count: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)

  const t1 = new THREE.Vector3(-normal.y, normal.x, 0).normalize()
  if (t1.length() < 0.1) t1.set(-normal.z, 0, normal.x).normalize()
  const t2 = new THREE.Vector3().crossVectors(normal, t1).normalize()

  const sigma = radius * 0.45
  const [cr, cg, cb] = auroraColor(center.y / SPHERE_RADIUS)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * radius
    const gauss = Math.exp(-(dist * dist) / (sigma * sigma))
    const h = height * gauss
    const alpha = gauss * 0.9

    const ox = t1.x * Math.cos(angle) * dist + t2.x * Math.sin(angle) * dist
    const oy = t1.y * Math.cos(angle) * dist + t2.y * Math.sin(angle) * dist
    const oz = t1.z * Math.cos(angle) * dist + t2.z * Math.sin(angle) * dist

    positions[i * 3] = center.x + normal.x * h + ox
    positions[i * 3 + 1] = center.y + normal.y * h + oy
    positions[i * 3 + 2] = center.z + normal.z * h + oz

    const bright = 1 + gauss * 0.4
    colors[i * 3] = Math.min(1, cr * bright) * alpha
    colors[i * 3 + 1] = Math.min(1, cg * bright) * alpha
    colors[i * 3 + 2] = Math.min(1, cb * bright) * alpha

    sizes[i] = 0.03 + Math.random() * 0.04 * gauss
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  return geo
}

const stateColors: Record<AppState, { mesh: string; glow: string; particle: string }> = {
  idle: { mesh: '#3a4a40', glow: '#5a7a60', particle: '#4a6a50' },
  listening: { mesh: '#d94a38', glow: '#f06048', particle: '#e85842' },
  thinking: { mesh: '#b87038', glow: '#d98848', particle: '#c47840' },
  speaking: { mesh: '#3d8a55', glow: '#4d9a68', particle: '#45925e' },
}

function getAudioLevel(analyser: AnalyserNode | null): number {
  if (!analyser) return 0
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)
  return dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255
}

function Sphere({ animRef, analyserRef, state }: {
  animRef: React.MutableRefObject<{ scale: number; glowColor: THREE.Color; meshColor: THREE.Color; particleOpacity: number }>
  analyserRef: React.RefObject<AnalyserNode | null>
  state: AppState
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)
  const haloRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(ORB_RADIUS, ICOSA_DETAIL), [])
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 15), [geometry])
  const haloGeometry = useMemo(() => new THREE.CircleGeometry(3.5, 80), [])

  const haloMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.7 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying float vY;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vY = worldPos.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying float vY;
      uniform float uOpacity;
      void main() {
        float yn = clamp(vY / 1.4, -1.0, 1.0);
        vec3 auroraCol;
        if (yn > 0.5) {
          auroraCol = mix(vec3(0.05, 0.60, 0.75), vec3(0.10, 0.90, 0.90), (yn - 0.5) * 2.0);
        } else if (yn > 0.0) {
          auroraCol = mix(vec3(0.15, 0.25, 0.95), vec3(0.05, 0.60, 0.75), yn * 2.0);
        } else if (yn > -0.3) {
          float t2 = (yn + 0.3) / 0.3;
          auroraCol = mix(vec3(0.55, 0.10, 0.78), vec3(0.15, 0.25, 0.95), t2);
        } else if (yn > -0.6) {
          float t3 = (yn + 0.6) / 0.3;
          auroraCol = mix(vec3(0.90, 0.15, 0.45), vec3(0.55, 0.10, 0.78), t3);
        } else {
          float t4 = (yn + 1.0) / 0.4;
          auroraCol = mix(vec3(0.85, 0.05, 0.22), vec3(0.90, 0.15, 0.45), t4);
        }

        float dist = length(vWorldPos.xy);
        float borderGlow = exp(-abs(dist - 1.3) * 5.0);
        float innerFill = smoothstep(0.0, 1.3, dist);

        vec3 spaceBlue = vec3(0.02, 0.04, 0.15);
        vec3 col = mix(spaceBlue, auroraCol, innerFill);

        float alpha = borderGlow * uOpacity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  const meshMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.60 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying float vY;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vY = worldPos.y;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying float vY;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform float uOpacity;
      void main() {
        float yn = clamp(vY / 1.3, -1.0, 1.0);
        vec3 auroraCol;
        if (yn > 0.5) {
          auroraCol = mix(vec3(0.03, 0.30, 0.38), vec3(0.05, 0.45, 0.45), (yn - 0.5) * 2.0);
        } else if (yn > 0.0) {
          auroraCol = mix(vec3(0.08, 0.12, 0.48), vec3(0.03, 0.30, 0.38), yn * 2.0);
        } else if (yn > -0.3) {
          float t2 = (yn + 0.3) / 0.3;
          auroraCol = mix(vec3(0.28, 0.05, 0.39), vec3(0.08, 0.12, 0.48), t2);
        } else if (yn > -0.6) {
          float t3 = (yn + 0.6) / 0.3;
          auroraCol = mix(vec3(0.45, 0.08, 0.23), vec3(0.28, 0.05, 0.39), t3);
        } else {
          float t4 = (yn + 1.0) / 0.4;
          auroraCol = mix(vec3(0.43, 0.03, 0.11), vec3(0.45, 0.08, 0.23), t4);
        }

        float fresnel = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDir)));
        fresnel = pow(fresnel, 2.5);

        vec3 nearBlack = vec3(0.02, 0.02, 0.03);
        vec3 col = mix(nearBlack, auroraCol, fresnel);

        gl_FragColor = vec4(col, uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }), [])

  useFrame((_, delta) => {
    const a = animRef.current
    const level = getAudioLevel(analyserRef.current)

    const targetScale = a.scale + level * 0.12
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 8
      )
    }

    const baseSpeed = state === 'idle' ? 0.08
      : state === 'listening' ? 0.10
      : state === 'thinking' ? 0.2
      : 0.15 + level * 0.5

    meshRef.current!.rotation.y += delta * baseSpeed
    meshRef.current!.rotation.x += delta * baseSpeed * 0.3

    if (wireframeRef.current) {
      wireframeRef.current.rotation.copy(meshRef.current!.rotation)
      wireframeRef.current.scale.copy(meshRef.current!.scale)
      const mat = wireframeRef.current.material as THREE.LineBasicMaterial
      mat.color.copy(a.glowColor)
      mat.opacity += (a.particleOpacity - mat.opacity) * delta * 4
    }

    if (haloRef.current) {
      const hm = haloMaterial
      hm.uniforms.uOpacity.value += (a.particleOpacity * 0.7 - hm.uniforms.uOpacity.value) * delta * 4
    }

    meshMaterial.uniforms.uOpacity.value += (0.45 + level * 0.2 - meshMaterial.uniforms.uOpacity.value) * delta * 4
  })

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} material={meshMaterial} />
      <lineSegments ref={wireframeRef} geometry={edgesGeometry}>
        <lineBasicMaterial color="#5a7a60" transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
      <mesh ref={haloRef} geometry={haloGeometry} material={haloMaterial} />
    </>
  )
}

function ParticleSphere({ animRef, analyserRef, state }: {
  animRef: React.MutableRefObject<{ scale: number; glowColor: THREE.Color; meshColor: THREE.Color; particleOpacity: number }>
  analyserRef: React.RefObject<AnalyserNode | null>
  state: AppState
}) {
  const groupRef = useRef<THREE.Group>(null)
  const meridianGroupRef = useRef<THREE.Group>(null)
  const baseRef = useRef<THREE.Points>(null)
  const meridianRef = useRef<THREE.Points>(null)
  const highlightRef = useRef<THREE.Points>(null)

  const baseGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = SPHERE_RADIUS + (Math.random() - 0.5) * JITTER * 2
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      const ny = y / SPHERE_RADIUS
      const [cr, cg, cb] = auroraColor(ny)
      colors[i * 3] = cr
      colors[i * 3 + 1] = cg
      colors[i * 3 + 2] = cb
      sizes[i] = 0.03 + Math.random() * 0.04
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  const meridianGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const total = MERIDIAN_COUNT * MERIDIAN_POINTS
    const positions = new Float32Array(total * 3)
    const colors = new Float32Array(total * 3)
    const sizes = new Float32Array(total)
    for (let m = 0; m < MERIDIAN_COUNT; m++) {
      const theta = (m / MERIDIAN_COUNT) * Math.PI * 2
      for (let p = 0; p < MERIDIAN_POINTS; p++) {
        const phi = (p / (MERIDIAN_POINTS - 1)) * Math.PI
        const r = SPHERE_RADIUS + (Math.random() - 0.5) * JITTER
        const idx = m * MERIDIAN_POINTS + p
        positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[idx * 3 + 2] = r * Math.cos(phi)
        const ny = Math.sin(phi) * Math.sin(theta)
        const [cr, cg, cb] = auroraColor(ny)
        colors[idx * 3] = cr
        colors[idx * 3 + 1] = cg
        colors[idx * 3 + 2] = cb
        sizes[idx] = 0.025 + Math.random() * 0.02
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  const highlightGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(HIGHLIGHT_COUNT * 3)
    const sizes = new Float32Array(HIGHLIGHT_COUNT)
    for (let i = 0; i < HIGHLIGHT_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = SPHERE_RADIUS + (Math.random() - 0.5) * 0.15
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      sizes[i] = 0.06 + Math.random() * 0.08
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  const outerBaseGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(OUTER_PARTICLE_COUNT * 3)
    const colors = new Float32Array(OUTER_PARTICLE_COUNT * 3)
    const sizes = new Float32Array(OUTER_PARTICLE_COUNT)
    for (let i = 0; i < OUTER_PARTICLE_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = OUTER_RADIUS + (Math.random() - 0.5) * JITTER * 2
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      const ny = y / OUTER_RADIUS
      const [cr, cg, cb] = auroraColor(ny)
      colors[i * 3] = cr
      colors[i * 3 + 1] = cg
      colors[i * 3 + 2] = cb
      sizes[i] = 0.03 + Math.random() * 0.03
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  const baseMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: true,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  }), [])

  const meridianMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: true,
    transparent: true,
    opacity: 0.12,
    sizeAttenuation: true,
  }), [])

  const highlightMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.08,
    color: 0xffffff,
    blending: THREE.AdditiveBlending,
    depthWrite: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  }), [])

  const outerGroupRef = useRef<THREE.Group>(null)
  const outerBaseRef = useRef<THREE.Points>(null)

  const outerBaseMaterial = useMemo(() => new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: true,
    transparent: true,
    opacity: 0.22,
    sizeAttenuation: true,
  }), [])

  useFrame((st, delta) => {
    const level = getAudioLevel(analyserRef.current)
    const time = st.clock.elapsedTime
    const a = animRef.current

    const baseSpeed = state === 'idle' ? 0.08
      : state === 'listening' ? 0.10
      : state === 'thinking' ? 0.2
      : 0.15 + level * 0.5

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * baseSpeed * 0.4
      groupRef.current.rotation.x += delta * baseSpeed * 0.12
      const s = a.scale + level * 0.1
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 4)
    }

    if (meridianGroupRef.current) {
      meridianGroupRef.current.rotation.y += delta * baseSpeed * 0.25
    }

    if (outerGroupRef.current) {
      outerGroupRef.current.rotation.y -= delta * baseSpeed * 0.2
      outerGroupRef.current.rotation.x += delta * baseSpeed * 0.05
    }
    outerBaseMaterial.opacity = 0.2 + level * 0.12

    highlightMaterial.opacity = 0.45 + Math.sin(time * 2.5) * 0.15
    baseMaterial.opacity = 0.42 + level * 0.12
  })

  return (
    <group ref={groupRef}>
      <group ref={meridianGroupRef}>
        <points ref={meridianRef} geometry={meridianGeo} material={meridianMaterial} />
      </group>
      <points ref={baseRef} geometry={baseGeo} material={baseMaterial} />
      <group ref={outerGroupRef}>
        <points ref={outerBaseRef} geometry={outerBaseGeo} material={outerBaseMaterial} />
      </group>
      <points ref={highlightRef} geometry={highlightGeo} material={highlightMaterial} />
    </group>
  )
}

function FlareSystem({ animRef, analyserRef, state }: {
  animRef: React.MutableRefObject<{ scale: number; glowColor: THREE.Color; meshColor: THREE.Color; particleOpacity: number }>
  analyserRef: React.RefObject<AnalyserNode | null>
  state: AppState
}) {
  const groupRef = useRef<THREE.Group>(null)

  const flares = useMemo(() => {
    const result: Array<{
      geo: THREE.BufferGeometry
      mat: THREE.PointsMaterial
      axis: THREE.Vector3
      speed: number
      phase: number
    }> = []
    for (let i = 0; i < FLARE_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const center = new THREE.Vector3(
        SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
        SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta),
        SPHERE_RADIUS * Math.cos(phi),
      )
      const normal = center.clone().normalize()
      const height = 0.10 + Math.random() * 0.10
      const bumpRadius = 0.20 + Math.random() * 0.25
      const geo = createFlareGeo(center, normal, height, bumpRadius, FLARE_POINTS)
      const mat = new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.3,
        sizeAttenuation: true,
      })
      const moveAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize()
      const speed = 0.08 + Math.random() * 0.2
      const phase = Math.random() * Math.PI * 2
      result.push({ geo, mat, axis: moveAxis, speed, phase })
    }
    return result
  }, [])

  const flareGroupsRef = useRef<(THREE.Group | null)[]>([])

  useFrame((st, delta) => {
    const level = getAudioLevel(analyserRef.current)
    const time = st.clock.elapsedTime
    const a = animRef.current

    const baseSpeed = state === 'idle' ? 0.08
      : state === 'listening' ? 0.10
      : state === 'thinking' ? 0.2
      : 0.15 + level * 0.5

    if (groupRef.current) {
      const s = a.scale + level * 0.12
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 3)
    }

    const flareSpeed = baseSpeed > 0.10 ? baseSpeed * 0.15 : 0.10
    flares.forEach((f, i) => {
      const gRef = flareGroupsRef.current[i]
      if (gRef) {
        gRef.rotateOnWorldAxis(f.axis, delta * f.speed * flareSpeed)
      }
      f.mat.opacity = (0.6 + Math.sin(time * 1.8 + f.phase) * 0.15) + level * 0.1
    })
  })

  return (
    <group ref={groupRef}>
      {flares.map((f, i) => (
        <group
          key={i}
          ref={(el: THREE.Group | null) => { flareGroupsRef.current[i] = el }}
        >
          <points geometry={f.geo} material={f.mat} />
        </group>
      ))}
    </group>
  )
}

function Scene({ state, analyserRef, animRef }: {
  state: AppState
  analyserRef: React.RefObject<AnalyserNode | null>
  animRef: React.MutableRefObject<{ scale: number; glowColor: THREE.Color; meshColor: THREE.Color; particleOpacity: number }>
}) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 2, 4]} intensity={0.4} color="#ffffff" />
      <pointLight position={[-3, -1, -2]} intensity={0.15} color="#5a7a60" />
      <Sphere animRef={animRef} analyserRef={analyserRef} state={state} />
      <ParticleSphere animRef={animRef} analyserRef={analyserRef} state={state} />
      <FlareSystem animRef={animRef} analyserRef={analyserRef} state={state} />
    </>
  )
}

export default function AIOrb({ state, analyserRef }: AIOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef({
    scale: 1,
    glowColor: new THREE.Color(stateColors.idle.glow),
    meshColor: new THREE.Color(stateColors.idle.mesh),
    particleOpacity: 0.45,
  })
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.kill()

    const colors = stateColors[state]
    const target = {
      scale: state !== 'idle' ? 1.05 : 1,
      particleOpacity: state !== 'idle' ? 0.7 : 0.45,
    }

    if (state === 'listening') {
      target.scale = 1.04
      target.particleOpacity = 0.8
    } else if (state === 'speaking') {
      target.scale = 1.06
      target.particleOpacity = 0.75
    }

    if (reducedMotion.current) {
      animRef.current.scale = target.scale
      animRef.current.glowColor.set(colors.glow)
      animRef.current.meshColor.set(colors.mesh)
      animRef.current.particleOpacity = target.particleOpacity
      return
    }

    const tl = gsap.timeline()
    const proxy = { scale: animRef.current.scale, particleOpacity: animRef.current.particleOpacity }

    tl.to(proxy, {
      scale: target.scale,
      particleOpacity: target.particleOpacity,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        animRef.current.scale = proxy.scale
        animRef.current.particleOpacity = proxy.particleOpacity
      },
    }, 0)

    tl.to({}, {
      duration: 0.6,
      onUpdate: () => {
        animRef.current.glowColor.lerp(new THREE.Color(colors.glow), 0.1)
        animRef.current.meshColor.lerp(new THREE.Color(colors.mesh), 0.1)
      },
    }, 0)

    if (state === 'listening') {
      const pulseProxy = { val: 1 }
      tl.to(pulseProxy, {
        val: 1.04,
        duration: 0.9,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          animRef.current.scale = pulseProxy.val
        },
      }, 0)
    } else if (state === 'thinking') {
      const pulseProxy = { val: 1 }
      tl.to(pulseProxy, {
        val: 1.06,
        duration: 0.8,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          animRef.current.scale = pulseProxy.val
        },
      }, 0)
    }

    timelineRef.current = tl
    return () => { tl.kill() }
  }, [state])

  return (
    <div ref={containerRef} className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: 380, height: 380 }}>
        <Canvas
          camera={{ position: [0, 0, 5.0], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <Scene state={state} analyserRef={analyserRef} animRef={animRef} />
        </Canvas>
      </div>
    </div>
  )
}

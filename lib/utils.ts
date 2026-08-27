import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Vector3, Euler, MathUtils } from 'three';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  return a.clone().lerp(b, t);
}

export function lerpEuler(a: Euler, b: Euler, t: number): Euler {
  const av = new Vector3(a.x, a.y, a.z);
  const bv = new Vector3(b.x, b.y, b.z);
  const result = av.lerp(bv, t);
  return new Euler(result.x, result.y, result.z);
}

export function tintPageBackground(hex: string, duration: number = 1): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--bg-tint', hex);
  // transition is set in global CSS if desired
}

export function registerScrollDrivenCamera(
  sectionEl: HTMLElement,
  keyframes: any,
): void {
  // Stub for now; implemented per-section with GSAP ScrollTrigger
  // This is a marker/documentation function
}

export function mapProgress(
  progress: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const normalized = (progress - inMin) / (inMax - inMin);
  const clamped = clamp(normalized, 0, 1);
  return outMin + clamped * (outMax - outMin);
}

export function projectToScreen(
  worldPosition: Vector3,
  camera: THREE.Camera,
  viewport: { width: number; height: number },
) {
  const vector = worldPosition.clone();
  vector.project(camera);
  const widthHalf = viewport.width / 2;
  const heightHalf = viewport.height / 2;
  return {
    x: vector.x * widthHalf + widthHalf,
    y: -(vector.y * heightHalf) + heightHalf,
    z: vector.z,
  };
}

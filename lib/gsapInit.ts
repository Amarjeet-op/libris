import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let initialized = false;

export function initGSAP(): void {
  if (initialized) return;
  gsap.registerPlugin(ScrollTrigger);
  initialized = true;
}

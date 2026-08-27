import type {
  FinishPreset,
  MaterialPreset,
  CameraZoomLevel,
  ExplodedComponent,
  SpecCategory,
} from '@/types/product.types';

export const PRODUCT_NAME = 'AURELIS ONE';
export const PRODUCT_TAGLINE = 'A new dimension of mobile.';
export const PRODUCT_SUBLINE = 'Precision engineered. Intelligently designed.';

export const THEME = {
  void: '#0A0A0B',
  surface: '#141416',
  line: '#2A2A2E',
  text: '#F5F5F2',
  muted: '#8A8A8E',
  accentGradient: 'linear-gradient(135deg, #6EE7D8 0%, #A78BFA 100%)',
};

export const FINISHES: FinishPreset[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    hex: '#1a1a1c',
    metalness: 0.92,
    roughness: 0.28,
    description: 'Deep black with precise machine finishes.',
  },
  {
    id: 'silver',
    name: 'Silver',
    hex: '#c0c0c0',
    metalness: 0.88,
    roughness: 0.35,
    description: 'Polished titanium with subtle reflections.',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    hex: '#a8b4d4',
    metalness: 0.85,
    roughness: 0.32,
    description: 'Soft blue-violet with ethereal finish.',
  },
  {
    id: 'sand',
    name: 'Sand',
    hex: '#d4c5b0',
    metalness: 0.80,
    roughness: 0.45,
    description: 'Warm, tactile ceramic aesthetic.',
  },
];

export const MATERIALS: MaterialPreset[] = [
  {
    id: 'titanium',
    name: 'Titanium Frame',
    description: 'Grade 5 titanium alloy. Machined to ±0.02mm.',
    lighting: { intensity: 1.0, colorTemp: 0 },
    bgTint: '#0f1419',
  },
  {
    id: 'ceramic',
    name: 'Ceramic Shield',
    description: 'Tougher than glass. 9H hardness rating.',
    lighting: { intensity: 1.2, colorTemp: 2000 },
    bgTint: '#0a0a0b',
  },
  {
    id: 'glass',
    name: 'Precision Glass',
    description: 'Edge-to-edge. Fully integrated display.',
    lighting: { intensity: 0.8, colorTemp: 5000 },
    bgTint: '#141416',
  },
];

export const CAMERA_ZOOM_LEVELS: CameraZoomLevel[] = [
  {
    label: '1×',
    scale: 1,
    focal: { x: 50, y: 50 },
    description: 'Ultra-wide perspective. Everything in frame.',
  },
  {
    label: '2×',
    scale: 1.8,
    focal: { x: 52, y: 48 },
    description: 'Standard telephoto. Precise framing.',
  },
  {
    label: '5×',
    scale: 3.5,
    focal: { x: 54, y: 46 },
    description: 'Detail without moving closer.',
  },
  {
    label: '10×',
    scale: 6.8,
    focal: { x: 56, y: 44 },
    description: 'Extreme magnification. Macro territory.',
  },
];

export const EXPLODED_COMPONENTS: ExplodedComponent[] = [
  {
    id: 'frame',
    title: 'TITANIUM FRAME',
    description: 'Grade 5 titanium alloy.',
    details: 'Machined to ±0.02mm tolerances. Aerospace-grade precision.',
  },
  {
    id: 'camera',
    title: 'CAMERA SYSTEM',
    description: 'Three integrated lenses.',
    details: 'Advanced computational photography. Low-light mastery.',
  },
  {
    id: 'backglass',
    title: 'BACK GLASS',
    description: 'Ceramic shield with precision coating.',
    details: 'Tougher than traditional glass. 9H hardness.',
  },
  {
    id: 'mainboard',
    title: 'MAIN BOARD',
    description: 'Custom silicon architecture.',
    details: 'A1 chip. 16 cores. Uncompromising performance.',
  },
  {
    id: 'battery',
    title: 'BATTERY',
    description: 'High-density silicon architecture.',
    details: 'Up to 31 hours of video playback. All-day power.',
  },
  {
    id: 'display',
    title: 'DISPLAY',
    description: '6.9" OLED with adaptive refresh.',
    details: '3200 nits peak brightness. 1–120Hz ProMotion.',
  },
];

export const SPECIFICATIONS: SpecCategory[] = [
  {
    title: 'Dimensions',
    specs: [
      { label: 'Height', value: '154.5 mm' },
      { label: 'Width', value: '71.6 mm' },
      { label: 'Thickness', value: '7.8 mm' },
      { label: 'Weight', value: '183 g' },
    ],
  },
  {
    title: 'Display',
    specs: [
      { label: 'Size', value: '6.9" (diagonal)' },
      { label: 'Resolution', value: '2560 × 1440 pixels (2.8K)' },
      { label: 'Refresh Rate', value: '1–120Hz adaptive' },
      { label: 'Brightness', value: '3200 nits (peak)' },
      { label: 'Technology', value: 'OLED, always-on' },
    ],
  },
  {
    title: 'Performance',
    specs: [
      { label: 'Processor', value: 'A1 chip' },
      { label: 'Neural Engine', value: '16-core, 2.1× faster' },
      { label: 'Memory', value: 'Up to 12GB LPDDR5X' },
      { label: 'Storage', value: '256GB, 512GB, 1TB' },
    ],
  },
  {
    title: 'Camera',
    specs: [
      { label: 'Main', value: '50MP, f/1.5 aperture' },
      { label: 'Ultra-Wide', value: '12MP, 120° field of view' },
      { label: 'Telephoto', value: '12MP, 10× optical zoom' },
      { label: 'Night Mode', value: 'Computational astrophotography' },
    ],
  },
  {
    title: 'Battery',
    specs: [
      { label: 'Capacity', value: '4200 mAh' },
      { label: 'Video Playback', value: 'Up to 31 hours' },
      { label: 'Audio Playback', value: 'Up to 48 hours' },
      { label: 'Charging', value: '45W fast charge. MagSafe.' },
    ],
  },
];

export const PRICING = {
  base256: 999,
  base512: 1199,
  base1024: 1399,
  accessories: {
    case: 79,
    charger: 49,
    earbuds: 189,
  },
};

export const AI_PROMPTS = [
  {
    id: 'summarize',
    label: 'Summarize my day',
  },
  {
    id: 'photos',
    label: 'Find my photos',
  },
  {
    id: 'rewrite',
    label: 'Rewrite this message',
  },
  {
    id: 'plan',
    label: 'Plan my trip',
  },
  {
    id: 'document',
    label: 'Analyze this document',
  },
];

export const SCROLL_KEYFRAMES = {
  hero: {
    range: [0, 0.12],
    camera: {
      position: { x: 0, y: 0, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 50,
    },
    model: {
      rotation: { x: -0.1, y: 0.2, z: 0 },
      scale: 1,
    },
  },
  design: {
    range: [0.12, 0.28],
    camera: {
      position: { x: 0, y: -0.3, z: 2.5 },
      rotation: { x: 0.15, y: 0, z: 0 },
      fov: 45,
    },
    model: {
      rotation: { x: -0.2, y: Math.PI * 0.15, z: 0 },
      scale: 1.1,
    },
  },
  explodedView: {
    range: [0.28, 0.5],
    camera: {
      position: { x: 0, y: 0, z: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 55,
    },
    model: {
      rotation: { x: 0, y: 0, z: 0 },
      scale: 0.9,
    },
    explode: 0,
  },
  engineering: {
    range: [0.5, 0.62],
    camera: {
      position: { x: 0, y: 0.1, z: 1.5 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 35,
    },
    model: {
      rotation: { x: 0, y: 0.1, z: 0 },
      scale: 1.2,
    },
  },
  display: {
    range: [0.62, 0.73],
    camera: {
      position: { x: 0.2, y: 0.1, z: 2.2 },
      rotation: { x: 0.1, y: 0.15, z: 0 },
      fov: 48,
    },
    model: {
      rotation: { x: -0.05, y: 0.3, z: 0 },
      scale: 1,
    },
  },
  chip: {
    range: [0.73, 0.83],
    camera: {
      position: { x: 0.15, y: 0.15, z: 2.5 },
      rotation: { x: 0.1, y: 0.2, z: 0 },
      fov: 50,
    },
    model: {
      rotation: { x: 0, y: 0.4, z: 0 },
      scale: 0.95,
    },
  },
  finalShot: {
    range: [0.83, 1.0],
    camera: {
      position: { x: 0, y: 0, z: 3 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 50,
    },
    model: {
      rotation: { x: -0.15, y: Math.PI * 2, z: 0 },
      scale: 1,
    },
  },
};

export const EXPLODE_STAGES = {
  assembledHold: { start: 0.0, end: 0.08 },
  backGlassSeparate: { start: 0.08, end: 0.16 },
  cameraMuduleRise: { start: 0.16, end: 0.23 },
  mainBoardBack: { start: 0.23, end: 0.3 },
  batteryDown: { start: 0.3, end: 0.38 },
  displaySeparate: { start: 0.38, end: 0.45 },
  maxSeparation: { start: 0.45, end: 0.55 },
  reassemblyStart: 0.55,
};

export const SECTION_COPY = {
  hero: {
    headline: 'A new dimension of mobile.',
    subline: 'Precision engineered. Intelligently designed.',
    cta1: 'Explore AURELIS ONE',
    cta2: 'Watch the film',
    scrollIndicator: 'Scroll to explore',
  },
  design: {
    headline: 'Designed around the impossible.',
    callouts: [
      'Aerospace-grade frame',
      'Ceramic shield',
      'Precision-machined buttons',
      'Ultra-thin architecture',
    ],
  },
  engineering: {
    headline: 'Every millimeter has a purpose.',
  },
  display: {
    headline: 'More screen.',
    subline: 'Less distraction.',
  },
  chip: {
    headline: 'Meet A1.',
    subline: 'Intelligence, without compromise.',
  },
  ai: {
    headline: 'Intelligence that stays with you.',
  },
  camera: {
    headline: 'See beyond the frame.',
  },
  battery: {
    headline: 'Power that lasts.',
  },
  thermal: {
    headline: 'Engineered for sustained performance.',
  },
  materials: {
    headline: 'Crafted from the finest materials.',
  },
  colors: {
    headline: 'Choose your AURELIS.',
  },
  final: {
    headline: 'AURELIS ONE',
    subline: 'A new dimension of mobile.',
    cta1: 'Choose your AURELIS',
    cta2: 'Explore specifications',
  },
  finalCTA: {
    headline: 'The future,',
    subline: 'in your hands.',
    cta: 'Buy AURELIS ONE',
  },
};

export type ProductFinish = 'obsidian' | 'silver' | 'aurora' | 'sand';
export type StorageOption = 256 | 512 | 1024;
export type AccessoryId = 'case' | 'charger' | 'earbuds';

export interface ScrollKeyframe {
  range: [number, number];
  camera: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    fov: number;
  };
  model: {
    rotation: { x: number; y: number; z: number };
    scale: number;
  };
  explode?: number;
  colorId?: string;
  materialId?: string;
  lighting?: {
    intensity: number;
    ambientIntensity: number;
  };
}

export interface FinishPreset {
  id: ProductFinish;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
  description: string;
}

export interface MaterialPreset {
  id: string;
  name: string;
  description: string;
  lighting: {
    intensity: number;
    colorTemp: number;
  };
  bgTint: string;
}

export interface CameraZoomLevel {
  label: '1×' | '2×' | '5×' | '10×';
  scale: number;
  focal: { x: number; y: number };
  description: string;
}

export interface ExplodedComponent {
  id: string;
  title: string;
  description: string;
  details: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface SpecCategory {
  title: string;
  specs: Spec[];
}

export interface AIResponse {
  type: 'summary' | 'photos' | 'message' | 'plan' | 'document';
  items?: string[];
  value?: string;
  delay?: number;
}

export interface AurelisConfigContextType {
  finish: ProductFinish;
  setFinish: (finish: ProductFinish) => void;
  storage: StorageOption;
  setStorage: (storage: StorageOption) => void;
  accessories: AccessoryId[];
  toggleAccessory: (id: AccessoryId) => void;
  computedPrice: number;
}

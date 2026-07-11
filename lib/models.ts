import type { ModelId } from "./types";

export type ModelConfig = {
  id: ModelId;
  label: string;
  subject: string;
  path: string;
  scale: string;
  hotspots: string[];
};

export const MODEL_LIBRARY: Record<ModelId, ModelConfig> = {
  heart: {
    id: "heart",
    label: "Beating Heart",
    subject: "Biology",
    path: "/js/1-beating-heart/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Right atrium", "Left ventricle", "Aorta", "Pulmonary artery"]
  },
  bunsen_burner: {
    id: "bunsen_burner",
    label: "Bunsen Burner",
    subject: "Chemistry",
    path: "/js/6-bunsen_burner/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Air hole", "Gas inlet", "Flame cone"]
  },
  sodium: {
    id: "sodium",
    label: "Sodium Atom",
    subject: "Chemistry",
    path: "/js/3-sodium/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Nucleus", "Valence electron", "Electron shell"]
  },
  lithium: {
    id: "lithium",
    label: "Lithium Atom",
    subject: "Chemistry",
    path: "/js/4-lithium/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Protons", "Electron shell", "Valence electron"]
  },
  newtons_cradle: {
    id: "newtons_cradle",
    label: "Newton's Cradle",
    subject: "Physics",
    path: "/js/5-newtons_cradle/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Momentum transfer", "Potential energy", "Impact point"]
  },
  periodic_table: {
    id: "periodic_table",
    label: "3D Periodic Table",
    subject: "Chemistry",
    path: "/js/2-the_3d_periodic_table/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Groups", "Periods", "Atomic number"]
  },
  sodium_chloride: {
    id: "sodium_chloride",
    label: "Sodium Chloride",
    subject: "Chemistry",
    path: "/js/sodium_chloride/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Ionic bond", "Crystal lattice", "Chloride ion"]
  },
  helium: {
    id: "helium",
    label: "Helium Atom",
    subject: "Chemistry",
    path: "/js/helium/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Nucleus", "Electron cloud", "Noble gas shell"]
  },
  carbon: {
    id: "carbon",
    label: "Carbon Atom",
    subject: "Chemistry",
    path: "/js/carbon/scene.gltf",
    scale: "1 1 1",
    hotspots: ["Four valence electrons", "Bonding sites", "Nucleus"]
  }
};

export const MODEL_IDS = Object.keys(MODEL_LIBRARY) as ModelId[];

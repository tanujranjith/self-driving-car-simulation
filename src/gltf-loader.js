import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// The current release ships with procedural fallbacks, but the registry is
// ready for local GLB files as soon as entries in the manifest provide an
// asset path. Keeping the loader optional preserves instant startup offline.
window.SimGLTFLoader = new GLTFLoader();

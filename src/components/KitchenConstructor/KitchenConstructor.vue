<script setup lang="ts">
import * as THREE from 'three';
import {Mesh, Raycaster} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {useBaseConstructor} from "@/components/KitchenConstructor/composables/useBaseConstructor";
import {useKitchenConstructor} from "@/components/KitchenConstructor/composables/useKitchenConstructor";
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore/useKitchenConstructorStore";
import {ROTATIONS} from "@/stores/useKitchenConstructorStore/types";
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { TPanelUserData } from '@/components/NewModuleModal/types.ts'

type TEmits = {
  (e: 'click:dimension', userData: TPanelUserData, event: MouseEvent): void
  (e: 'click:panel', userData: TPanelUserData, event: MouseEvent): void
  (e: 'close'): void
};
const emits = defineEmits<TEmits>();

const scene: THREE.Scene = new THREE.Scene();
let renderer: THREE.WebGLRenderer
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
const raycaster: Raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

const canvas = ref(null);

let lastHoveredDimensions: THREE.Mesh[] = []
let lastHoveredPanels: THREE.Mesh[] = []

const store = useKitchenConstructorStore();

const {
  addFloor,
  initCameraAndControls,
  initLight,
  initRenderer,
  requestRenderIfNotRequested,
  loadAllTextures,
} = useBaseConstructor();

const { updateModel } = useKitchenConstructor()

onMounted(async () => {
  store.panelsCount = 0
  store.totalPanelsAreaSqmm = 0
  store.rearWallAreaSqmm = 0

  scene.background = new THREE.Color(0xffffff);
  addFloor(scene);

  renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas.value!, logarithmicDepthBuffer: true, preserveDrawingBuffer: true});
  initRenderer(renderer);
  await loadAllTextures();
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100000 );
  controls = new OrbitControls(camera, canvas.value)
  initCameraAndControls(camera, controls, () => requestRenderIfNotRequested(renderer, scene, camera, controls))
  const localKitchen = localStorage.getItem('kitchen')
  store.modules = localKitchen ? await JSON.parse(localKitchen) : [{width: 600, height: 800, depth: 670, x: 0, y: 0, z: 0, rotation: ROTATIONS.FRONT, type: 'kitchenLower', hasRearWall: true}]

  initLight(scene);

  updateModel(scene);

  controls.addEventListener('change', () => requestRenderIfNotRequested(renderer, scene, camera, controls));
  window.addEventListener('resize', () => requestRenderIfNotRequested(renderer, scene, camera, controls));
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMousemove)

  requestRenderIfNotRequested(renderer, scene, camera, controls);
})

watch(() => store.selectedModuleIndex, () => {
    updateModel(scene)
    requestRenderIfNotRequested(renderer, scene, camera, controls);
})

onBeforeUnmount(() => {
  controls.dispose();
  document.getElementById('canvas')!.remove()
})

watch(() => store.modules, () => {
  localStorage.setItem('kitchen', JSON.stringify(store.modules))
  updateModel(scene);
  requestRenderIfNotRequested(renderer, scene, camera, controls);
}, { deep: true })

function getDimensionIntersects(): THREE.Intersection[] {
    return raycaster.intersectObject(scene, true).filter(o => ['width', 'height', 'depth'].some(e => e in o.object?.userData));
}

function getPanelIntersects(): THREE.Intersection[] {
    return raycaster.intersectObject(scene, true).filter(o => 'position' in o.object.userData)
}

function handleDimensionHover() {
    const intersects = getDimensionIntersects();

    //@ts-expect-error битый тип
    lastHoveredDimensions.forEach(d => d.material.color.set(0x000000))
    lastHoveredDimensions = []

    if (intersects.length > 0) {
        const object = intersects[0].object as Mesh;
        document.body.style.cursor = 'pointer'
        lastHoveredDimensions.push(object);
        //@ts-expect-error битый тип
        object.material.color.set( 0x555555 );
    }

    return intersects;
}

function handlePanelHover() {
    const intersects = getPanelIntersects();

    lastHoveredPanels.forEach(p => (p.material as THREE.Material).opacity = 0)
    lastHoveredPanels = []

    if (intersects.length > 0) {
        const object = intersects[0].object as Mesh;
        document.body.style.cursor = 'pointer';
        (object.material as THREE.Material).opacity = 0.5;
        lastHoveredPanels.push(object);
    }
    return intersects;
}

function onMousemove(event: MouseEvent) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const dimensionIntersects = handleDimensionHover()
  const panelIntersects = handlePanelHover()
  if (!panelIntersects.length && !dimensionIntersects.length) {
    document.body.style.cursor = 'default'
  }

  requestRenderIfNotRequested(renderer, scene, camera, controls);
}

function onClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const dimensionIntersects = getDimensionIntersects();
  const panelIntersects = getPanelIntersects();

  if (dimensionIntersects.length > 0) {
      const object = dimensionIntersects[0].object;
      emits('click:dimension', object.userData as TPanelUserData, event)
      return;
  }
  if (panelIntersects.length > 0) {
      const object = panelIntersects[0].object;
      emits('click:panel', object.userData as TPanelUserData, event)
      return;
  }
  store.selectedModuleIndex = null
  emits('close')

  requestRenderIfNotRequested(renderer, scene, camera, controls);

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  requestRenderIfNotRequested(renderer, scene, camera, controls);
}
</script>

<template>
  <canvas id="canvas" class="w-full -z-0" ref="canvas" @click="onClick" />
</template>

<style>
body {
  margin: 0;
}
</style>

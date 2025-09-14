<script setup lang="ts">
/**
 * Этот компонент инкапсулирует отрисовку и реагирование на элементы управления.
 * Это нужно для того, чтобы в будущем иметь возможность использовать его для показа готовых моделей
 * на страницах пользователей. Все меню и всю реакцию на клики по размерам/панелям нужно делать
 * на уровень выше
 * */
import * as THREE from 'three';
import {Mesh, Raycaster} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {
  type TUserData,
  useBaseConstructor
} from '@/components/KitchenConstructor/composables/useBaseConstructor'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useKitchenConstructorStore } from '@/stores/useKitchenConstructorStore.ts'

type TEmits = {
  (e: 'click:dimension', userData: TUserData, event: MouseEvent): void
  (e: 'click:panel', userData: TUserData, event: MouseEvent): void
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

const store = useKitchenConstructorStore();

const {
  addFloor,
  initCameraAndControls,
  initLight,
  initRenderer,
  requestRenderIfNotRequested,
  updateModel
} = useBaseConstructor();


onMounted(async () => {

  scene.background = new THREE.Color(0x999999);
  addFloor(scene);

  renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas.value!, logarithmicDepthBuffer: true, preserveDrawingBuffer: true});
  initRenderer(renderer);
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100000 );
  controls = new OrbitControls(camera, canvas.value)
  initCameraAndControls(camera, controls, () => requestRenderIfNotRequested(renderer, scene, camera, controls))

  initLight(scene);

  updateModel(scene);

  controls.addEventListener('change', () => requestRenderIfNotRequested(renderer, scene, camera, controls));
  window.addEventListener('resize', () => requestRenderIfNotRequested(renderer, scene, camera, controls));
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMousemove)

  requestRenderIfNotRequested(renderer, scene, camera, controls);
})

onBeforeUnmount(() => {
  controls.dispose();
  document.getElementById('canvas')!.remove()
})

function getDimensionIntersects(): THREE.Intersection[] {
    return raycaster.intersectObject(scene, true).filter(o => ['width', 'height', 'depth'].some(e => e in o.object?.userData));
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

function onMousemove(event: MouseEvent) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const dimensionIntersects = handleDimensionHover()
  if (!dimensionIntersects.length) {
    document.body.style.cursor = 'default'
  }

  requestRenderIfNotRequested(renderer, scene, camera, controls);
}

function onClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const dimensionIntersects = getDimensionIntersects();

  if (dimensionIntersects.length > 0) {
      const object = dimensionIntersects[0].object;
      emits('click:dimension', object.userData, event)
      return;
  }
  emits('close')

  requestRenderIfNotRequested(renderer, scene, camera, controls);

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  requestRenderIfNotRequested(renderer, scene, camera, controls);
}

watch([() => store.width, () => store.height], () => {
  updateModel(scene);
  requestRenderIfNotRequested(renderer, scene, camera, controls)
})
</script>

<template>
  <canvas id="canvas" class="w-full -z-0" ref="canvas" @click="onClick" />
</template>

<style>
body {
  margin: 0;
}
</style>

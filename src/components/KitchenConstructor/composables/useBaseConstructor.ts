import * as THREE from "three";
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore/useKitchenConstructorStore";
// @ts-expect-error битый тип
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { Texture } from 'three'

/**
 * Здесь инкапсулирована низкоуровневая, доменно-независимая логика отрисовки сцены:
 * - Настройки камера, сцены, света
 * - Загрузка текстур и контроль за используемыми материалами для оптимизации памяти
 * - Очистка и обновление сцены
 * */
export const useBaseConstructor = () => {
  const store = useKitchenConstructorStore();
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  function clearScene(scene: THREE.Scene, full = false) {
    store.totalPanelsAreaSqmm = 0;
    store.rearWallAreaSqmm = 0;
    store.panelsCount = 0;
    for(let i = scene.children.length - 1; i >= 0; i--) {
      const obj = scene.children[i];
      if (full) {
        scene.remove(obj);
        return;
      }

      // @ts-expect-error битый тип
      if (obj.geometry?.type === 'PlaneGeometry' && obj.userData.static) {
        return;
      }

      if (['Mesh', 'Line'].includes(obj.type)) {
        scene.remove(obj);
      }
    }
  }


  function addFloor(scene: THREE.Scene) {
    const floorGeometry = new THREE.PlaneGeometry(6000, 3000);
    const floorTexture = loader.load( '/textures/laminate-texture.jpg' );
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 6, 3 );
    floorTexture.minFilter = THREE.NearestFilter
    const floorMaterial = new THREE.MeshBasicMaterial({
      map: floorTexture,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true
    floor.castShadow = true
    floor.receiveShadow = true
    floor.rotation.x = -Math.PI /2
    floor.position.z = 1500
    floor.userData = {static: true}
    scene.add(floor);


    const wallGeometry = new THREE.PlaneGeometry(6000, 3000);
    const wallTexture = loader.load( '/textures/wall.avif' );
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set( 6, 3 );
    const wallMaterial = new THREE.MeshBasicMaterial({
      map: wallTexture,
    });

    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.receiveShadow = true
    wall.castShadow = true
    wall.position.y = 1500
    wall.position.z = -5
    wall.receiveShadow = true
    wall.userData = {static: true}
    scene.add(wall);
  }

  async function loadTexture(path: string): Promise<Texture | null> {
    return new Promise((resolve) => {
      loader.load(path, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.repeat.set(1, 1);
        texture.minFilter = THREE.NearestFilter

        resolve(texture);
      });
    })
  }

  async function loadAllTextures() {
    await Promise.all(store.listOptions.map(async (list) => {
      const texture = await loadTexture(list.textureUrl)
      if (!texture) return;
      store.textures[list.id] = texture
    }));
  }

  function initCameraAndControls(camera: THREE.PerspectiveCamera, controls: OrbitControls, render: () => unknown) {
    controls.target.set(0, store.totalHeight/2, 0);
    camera.position.set(-store.totalWidth, store.totalHeight, 0)
    zoomToFit(camera, controls, render);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI/2 - 0.1
    controls.minDistance = 100
    controls.maxDistance = 7500
    controls.minAzimuthAngle = -Math.PI/2 + 0.01
    controls.maxAzimuthAngle = Math.PI/2 - 0.01
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.screenSpacePanning = true; // if true, pan in screen-space
    controls.keyPanSpeed = 70;	// pixels moved per arrow key push
    controls.keys = {
      LEFT: 'ArrowLeft', //left arrow
      UP: 'ArrowUp', // up arrow
      RIGHT: 'ArrowRight', // right arrow
      BOTTOM: 'ArrowDown' // down arrow
    }
    // Touch fingers
    // controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.PAN };
    controls.update();
    controls.listenToKeyEvents(window)

    const minPan = new THREE.Vector3( -1000, 0, 0 );
    const maxPan = new THREE.Vector3( 1000, 4000, 6000 );
    const _v = new THREE.Vector3();

    controls.addEventListener("change", function() {
      _v.copy(controls.target);
      controls.target.clamp(minPan, maxPan);
      _v.sub(controls.target);
      camera.position.sub(_v);
    })
  }

  function zoomToFit(camera: THREE.PerspectiveCamera, controls: OrbitControls, render: () => unknown) {
    // get the max side of the bounding box (fits to width OR height as needed )
    const maxDim = Math.max( store.totalWidth, store.totalHeight );
    let cameraZ = Math.abs( maxDim * Math.tan( camera.fov * 2 ));

    cameraZ *= 1.2; // zoom out a little so that objects don't fill the screen

    camera.position.z = cameraZ;

    camera.updateProjectionMatrix();
    controls.update();
    render();
  }

  function initLight(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight( 0x404040, 3 ); // soft white light
    scene.add( ambientLight );

    //Create a DirectionalLight and turn on shadows for the light
    const light = new THREE.DirectionalLight( 0xffffff, 3 );
    light.position.set( -1, 2, 3 ); //default; light shining from top
    light.castShadow = true; // default false
    scene.add( light );
    const light2 = new THREE.DirectionalLight( 0xffffff, 3 );
    light2.position.set( 2, -2, 3 ); //default; light shining from top
    light2.castShadow = true; // default false
    scene.add( light2 );

    //Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
  }

  let renderRequested = false
  function render (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    renderRequested = false;
    renderer.render(scene, camera);
    controls.update();
  }

  function requestRenderIfNotRequested(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    if (!renderRequested) {
      renderRequested = true;
      requestAnimationFrame(() => render(renderer, scene, camera, controls));
      controls.update();
    }
  }

  function initRenderer(renderer: THREE.WebGLRenderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  return {
    clearScene,
    addFloor,
    initCameraAndControls,
    loadAllTextures,
    initLight,
    initRenderer,
    requestRenderIfNotRequested,
    render
  }
}

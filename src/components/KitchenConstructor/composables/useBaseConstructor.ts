import * as THREE from "three";
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore.ts";
// @ts-expect-error битый тип
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// @ts-expect-error не типизирован
import {Text} from 'troika-three-text'
import { ref } from 'vue'

export type TUserData = {
  width?: boolean
  height?: boolean
}

const DOOR_THICKNESS = 64
const PADDING = 6
const DOORCASE_THICKNESS = 128
const MEASUREMENTS_HEIGHT = 64
const TEXT_OFFSET = MEASUREMENTS_HEIGHT + 48
const AUX_PADDING = 2 // Нужен, чтобы размеры и сами панели не конфликтовали.

/**
 * Здесь инкапсулирована низкоуровневая, доменно-независимая логика отрисовки сцены:
 * - Настройки камера, сцены, света
 * - Загрузка текстур и контроль за используемыми материалами для оптимизации памяти
 * - Очистка и обновление сцены
 * */
export const useBaseConstructor = () => {
  const store = useKitchenConstructorStore();
  const loader = new THREE.TextureLoader();
  const doorTexture = ref<THREE.Texture>();
  loader.setCrossOrigin("anonymous");

  function clearScene(scene: THREE.Scene, full = false) {
    for (let i = scene.children.length - 1; i >= 0; i--) {
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
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true
    floor.castShadow = true
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
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
    });

    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.receiveShadow = true
    wall.castShadow = true
    wall.position.y = 1500
    wall.position.z = 0
    wall.userData = {static: true}
    scene.add(wall);
  }


  function initCameraAndControls(camera: THREE.PerspectiveCamera, controls: OrbitControls, render: () => unknown) {
    controls.target.set(0, store.height/2, 0);
    camera.position.set(-store.width, store.height, 0)
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
    const maxDim = Math.max( store.width, store.height );
    let cameraZ = Math.abs( maxDim * Math.tan( camera.fov * 2 ));

    cameraZ *= 1.2; // zoom out a little so that objects don't fill the screen

    camera.position.z = cameraZ;

    camera.updateProjectionMatrix();
    controls.update();
    render();
  }

  function initLight(scene: THREE.Scene) {
    console.log('initLight', scene);
    doorTexture.value = loader.load( '/textures/ldsp_sherman.avif' );
    // const ambientLight = new THREE.AmbientLight( 0x404040, 3 ); // soft white light
    // scene.add( ambientLight );

    const light2 = new THREE.DirectionalLight( 0xffffff, 3 );
    light2.position.set( 300, 200, 1000 );
    light2.target.position.set( 0, 0, 0 );
    light2.castShadow = true; // default false

    light2.shadow.camera.near = 0.5; // default
    light2.shadow.camera.far = 5000; // default
    light2.shadow.camera.left = -1000;
    light2.shadow.camera.bottom = -300;
    light2.shadow.camera.top = 2500;
    light2.shadow.camera.right = 700;
    console.log('light2.shadow.camera', light2.shadow.camera)
    scene.add( light2 );
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

  function xMeasurements(len: number, height: number, offsetX: number, offsetY: number, offsetZ: number = 0, flip = false) {
    const material = new THREE.LineBasicMaterial( { color: 0x333333 } );

    const points = [];
    points.push( new THREE.Vector3(offsetX, offsetY, offsetZ));
    points.push( new THREE.Vector3(offsetX, offsetY + (flip ? -1 : 1) * height, offsetZ));
    points.push( new THREE.Vector3(offsetX + len, offsetY + (flip ? -1 : 1) * height, offsetZ));
    points.push( new THREE.Vector3(offsetX + len, offsetY, offsetZ ));
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    return new THREE.Line( geometry, material );
  }

  function yMeasurements(len: number, height: number, offsetX: number, offsetY: number, offsetZ: number = 0, flip = false) {
    const material = new THREE.LineBasicMaterial( { color: 0x333333 } );

    const points = [];
    points.push( new THREE.Vector3(offsetX - store.width/2, offsetY, offsetZ));
    points.push( new THREE.Vector3(offsetX + (flip ? 1 : -1) * height - store.width/2, offsetY, offsetZ ) );
    points.push( new THREE.Vector3(offsetX + (flip ? 1 : -1) * height - store.width/2, offsetY + len, offsetZ ) );
    points.push( new THREE.Vector3(offsetX - store.width/2, offsetY + len, offsetZ ) );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    return new THREE.Line( geometry, material );
  }

  function addText(text: string | number, offsetX: number, offsetY: number, offsetZ: number, userData?: TUserData, vertical = false, flat = false) {
    const myText = new Text()
    myText.text = text
    myText.textAlign = 'center'
    myText.fontSize = 36
    myText.color = 0x000000
    myText.userData = userData;
    myText.position.set(offsetX - text.toString().length * myText.fontSize /1.6/2, offsetY, offsetZ)
    if (vertical) {
      myText.position.set(offsetX - store.width/2, offsetY - text.toString().length * myText.fontSize /1.6/2, offsetZ)
      myText.rotation.z = Math.PI / 2;
    } else if (flat) {
      myText.rotation.x = -Math.PI / 2;
      myText.position.set(offsetX - text.toString().length * myText.fontSize /1.6/2 - store.width/2, offsetY, offsetZ)
    } else {
      myText.position.set(offsetX - text.toString().length * myText.fontSize /1.6/2 - store.width/2, offsetY, offsetZ)
    }
    myText.sync()

    return myText
  }

  function addPanel(width: number, height: number, offsetX: number, offsetY: number) {
    const doorGeo = new THREE.BoxGeometry(width, height, DOOR_THICKNESS);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xa3760b,
      map: doorTexture.value,
      roughness: 1,
      roughnessMap: doorTexture.value
    });
    const door = new THREE.Mesh( doorGeo, doorMat );
    door.position.set( offsetX, offsetY, 300 );
    door.castShadow = true
    door.receiveShadow = true

    return door;
  }

  function updateModel(scene: THREE.Scene) {
    clearScene(scene);

    const cubeGeometry = new THREE.BoxGeometry( 100, 100, 100 );
    const cubeMaterial = new THREE.MeshStandardMaterial( {color: 0x00ff00} );
    const cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
    cube.position.set( 0, 50, 500 );
    cube.castShadow = true
    cube.receiveShadow = true
    scene.add(cube);

    const sphereGeo = new THREE.SphereGeometry( 120 );
    const sphereMat = new THREE.MeshStandardMaterial( {color: 0x00ff00} );
    const sphere = new THREE.Mesh( sphereGeo, sphereMat );
    sphere.position.set( 300, 120, 500 );
    sphere.castShadow = true
    sphere.receiveShadow = true
    scene.add(sphere);

    scene.add(addPanel(store.width, store.height, 100, store.height/2));
    scene.add(addPanel(DOORCASE_THICKNESS, store.height + PADDING,  100 - PADDING - DOORCASE_THICKNESS/2 - store.width/2, store.height/2 + PADDING/2));
    scene.add(addPanel(DOORCASE_THICKNESS, store.height + PADDING,  100 + PADDING + DOORCASE_THICKNESS/2 + store.width/2, store.height/2 + PADDING/2));
    scene.add(addPanel(store.width + DOORCASE_THICKNESS*2 + PADDING*2, DOORCASE_THICKNESS,  100, store.height + DOORCASE_THICKNESS/2 + PADDING));
    scene.add(xMeasurements(store.width, MEASUREMENTS_HEIGHT, 100 - store.width/2, store.height, 300 + DOOR_THICKNESS/2 + AUX_PADDING));
    scene.add(addText(store.width, 100 + store.width/2, store.height + TEXT_OFFSET, 300 + DOOR_THICKNESS/2 + AUX_PADDING, { width: true }));
    scene.add(yMeasurements(store.height, MEASUREMENTS_HEIGHT, 100, 0, 300 + DOOR_THICKNESS/2 + AUX_PADDING));
    scene.add(addText(store.height, 100 - TEXT_OFFSET, store.height/2, 300 + DOOR_THICKNESS/2 + AUX_PADDING, { height: true }, true));
  }

  return {
    addFloor,
    initCameraAndControls,
    initLight,
    initRenderer,
    requestRenderIfNotRequested,
    render,
    updateModel
  }
}

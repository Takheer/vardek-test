//@ts-expect-error не типизирован
import {Text} from 'troika-three-text'
import * as THREE from "three";
import {Vector3} from "three";
import {useBaseConstructor} from './useBaseConstructor';
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore/useKitchenConstructorStore";
import {ROTATIONS, type TFurnitureModule} from "@/stores/useKitchenConstructorStore/types";
import type {TPanelUserData} from "@/components/NewModuleModal/types";
import { ref } from 'vue'

export const useKitchenConstructor = () => {
  const store = useKitchenConstructorStore()

  const scene = ref()

  const { clearScene } = useBaseConstructor();

  function rotatePanel(panel: THREE.Mesh, rotationPoint: THREE.Vector3, rotationAngle: ROTATIONS): THREE.Mesh {
    const delta = panel.position.clone().sub(rotationPoint);

    delta.applyEuler(new THREE.Euler(0, rotationAngle / 90 * Math.PI/2, 0));

    const newPos = delta.clone().add(rotationPoint)
    panel.rotateOnWorldAxis(new Vector3(0,1,0), rotationAngle / 90 * Math.PI / 2);
    panel.position.set(newPos.x, newPos.y, newPos.z)

    return panel
  }

  function translateRotatedPanel(panel: THREE.Mesh, rotationAngle: ROTATIONS, width: number, depth: number): THREE.Mesh {
    switch (rotationAngle) {
      case ROTATIONS.LEFT:
        panel.position.set(panel.position.x + depth, panel.position.y, panel.position.z);
        break;
      case ROTATIONS.BACK:
        panel.position.set(panel.position.x + width, panel.position.y, panel.position.z + depth);
        break;
      case ROTATIONS.RIGHT:
        panel.position.set(panel.position.x, panel.position.y, panel.position.z + width);
        break;
    }

    return panel;
  }

  function addHorizontalPanel(
    dimensions: { length: number, width: number, offsetX: number, offsetY: number, offsetZ: number },
    options: { thickness?: number, materialId?: number, moduleIndex?: number } = {}
  ): THREE.Mesh | null {
    if (!scene.value) {
      return null;
    }
    options.thickness ??= 16
    const geometry = new THREE.BoxGeometry(dimensions.length, options.thickness, dimensions.width);

    const material = new THREE.MeshStandardMaterial({
      map: store.textures[options.materialId ?? 1],
    });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(dimensions.length/2 + dimensions.offsetX - store.totalWidth/2, options.thickness/2 + dimensions.offsetY, dimensions.width/2 + dimensions.offsetZ);
    panel.castShadow = true
    panel.receiveShadow = true

    addEdges(panel, options.moduleIndex === store.selectedModuleIndex);

    return panel
  }

  function addHorizontalHoverMesh(
    dimensions: { length: number, width: number, offsetX: number, offsetY: number, offsetZ: number },
    { position, module, index, clickToOpen }: TPanelUserData
  ) {
    const ROTATION_FACTOR = position === 'top' ? -1 : 1;

    const geometry = new THREE.PlaneGeometry(dimensions.length - 32, dimensions.width - 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true });
    const panel = new THREE.Mesh(geometry, material);
    panel.userData = { position, module, index, clickToOpen };
    panel.rotateX(ROTATION_FACTOR * Math.PI/2)
    panel.position.set(dimensions.length/2 + dimensions.offsetX - store.totalWidth/2, dimensions.offsetY, dimensions.width/2 + dimensions.offsetZ);

    return panel
  }

  function addVerticalHoverMesh(
    dimensions: { height: number, width: number, offsetX: number, offsetY: number, offsetZ: number },
    { position, module, index, clickToOpen }: Omit<TPanelUserData, "position"> & {position: 'left'|'right'}
  ) {
    const ROTATION_FACTOR = position === 'left' ? -1 : 1;

    const geometry = new THREE.PlaneGeometry(dimensions.width - 32, dimensions.height - 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true });
    const panel = new THREE.Mesh(geometry, material);
    panel.userData = { position, module, index, clickToOpen };
    panel.rotateY(ROTATION_FACTOR * Math.PI/2)
    panel.position.set(dimensions.offsetX - store.totalWidth/2, dimensions.height/2 + dimensions.offsetY, dimensions.width/2 + dimensions.offsetZ);

    return panel
  }

  function addFrontalHoverMesh(
    dimensions: { height: number, width: number, offsetX: number, offsetY: number, offsetZ: number },
    {module, index, clickToOpen}: Omit<TPanelUserData, "position">
  ) {

    const geometry = new THREE.PlaneGeometry(dimensions.width - 32, dimensions.height - 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xeeeeee, opacity: 0, transparent: true });
    const panel = new THREE.Mesh(geometry, material);
    panel.userData = { position: 'front', module, index, clickToOpen };
    panel.position.set(dimensions.width/2 + dimensions.offsetX - store.totalWidth/2, dimensions.height/2 + dimensions.offsetY, dimensions.offsetZ);

    return panel
  }

  function addVerticalPanel(
    dimensions: { length: number, width: number, offsetX: number, offsetY: number, offsetZ: number },
    options: {thickness?: number, materialId?: number, moduleIndex?: number} = {}
  ): THREE.Mesh | null {
    if (!scene.value) {
      return null;
    }
    options.thickness ??= 16
    const geometry = new THREE.BoxGeometry(options.thickness, dimensions.length, dimensions.width);

    const material = new THREE.MeshStandardMaterial({
      map: store.textures[options.materialId ?? 1],
    });

    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(options.thickness / 2 + dimensions.offsetX - store.totalWidth / 2, dimensions.length / 2 + dimensions.offsetY, dimensions.width / 2 + dimensions.offsetZ)
    panel.castShadow = true
    panel.receiveShadow = true

    addEdges(panel, options.moduleIndex === store.selectedModuleIndex);

    return panel
  }

  function addFrontalPanel(
    dimensions: {length: number, width: number, offsetX: number, offsetY: number, offsetZ: number},
    options: {thickness?: number, materialId?: number, moduleIndex?: number} = {}
  ) {
    if (!scene.value) {
      return;
    }
    options.thickness ??= 16
    const geometry = new THREE.BoxGeometry(dimensions.width, dimensions.length, options.thickness);

    const material = new THREE.MeshStandardMaterial({
      map: store.textures[options.materialId ?? 1],
    });

    console.log({material, id: options.materialId})

    const panel = new THREE.Mesh(geometry, material);
    panel.position.set( dimensions.width / 2 + dimensions.offsetX - store.totalWidth / 2, dimensions.length / 2 + dimensions.offsetY, options.thickness / 2 + dimensions.offsetZ)
    panel.castShadow = true
    panel.receiveShadow = true

    addEdges(panel, options.moduleIndex === store.selectedModuleIndex);

    return panel;
  }

  function addRearWall(height: number, width: number, offsetX: number, offsetY: number, offsetZ: number) {
    if (!scene.value) {
      return;
    }
    const depth = 3
    const geometry = new THREE.BoxGeometry(width - 4, height - 4, depth);
    const material = new THREE.MeshStandardMaterial({
      map: store.textures[store.selectedListOption.id ?? 1],
    });

    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(offsetX + width/2 - store.totalWidth/2, offsetY + height/2, offsetZ + depth / 2 + 1);
    panel.castShadow = true
    panel.receiveShadow = true

    addEdges(panel);

    return panel;
  }

  function addXMeasurements(len: number, height: number, offsetX: number, offsetY: number, offsetZ: number = 0, flip = false) {
    const material = new THREE.LineBasicMaterial( { color: 0x333333 } );

    const points = [];
    points.push( new THREE.Vector3(offsetX - store.totalWidth/2, offsetY, offsetZ));
    points.push( new THREE.Vector3(offsetX - store.totalWidth/2, offsetY + (flip ? -1 : 1) * height, offsetZ));
    points.push( new THREE.Vector3(offsetX + len - store.totalWidth/2, offsetY + (flip ? -1 : 1) * height, offsetZ));
    points.push( new THREE.Vector3(offsetX + len - store.totalWidth/2, offsetY, offsetZ ));
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    return new THREE.Line( geometry, material );
  }

  function addYMeasurements(len: number, height: number, offsetX: number, offsetY: number, offsetZ: number = 0, flip = false) {
    const material = new THREE.LineBasicMaterial( { color: 0x333333 } );

    const points = [];
    points.push( new THREE.Vector3(offsetX - store.totalWidth/2, offsetY, offsetZ));
    points.push( new THREE.Vector3(offsetX + (flip ? 1 : -1) * height - store.totalWidth/2, offsetY, offsetZ ) );
    points.push( new THREE.Vector3(offsetX + (flip ? 1 : -1) * height - store.totalWidth/2, offsetY + len, offsetZ ) );
    points.push( new THREE.Vector3(offsetX - store.totalWidth/2, offsetY + len, offsetZ ) );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    return new THREE.Line( geometry, material );
  }

  function addZMeasurements(len: number, height: number, offsetX: number, offsetY: number, offsetZ: number = 0, flip = false) {
    const material = new THREE.LineBasicMaterial( { color: 0x333333 } );

    const points = [];
    points.push( new THREE.Vector3(offsetX - store.totalWidth/2, offsetY, offsetZ));
    points.push( new THREE.Vector3(offsetX + (flip ? -1 : 1) * height - store.totalWidth/2, offsetY, offsetZ ) );
    points.push( new THREE.Vector3(offsetX + (flip ? -1 : 1) * height - store.totalWidth/2, offsetY, offsetZ + len ) );
    points.push( new THREE.Vector3(offsetX - store.totalWidth/2, offsetY, offsetZ + len ) );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    return new THREE.Line(geometry, material)
  }

  function addEdges(panel: THREE.Mesh, active?: boolean) {
    const edgesGeometry = new THREE.EdgesGeometry( panel.geometry ); // or WireframeGeometry
    const edgesMaterial = new THREE.LineBasicMaterial( { color: active ? 0xffcc00 : 0xcccccc } );
    const edges = new THREE.LineSegments( edgesGeometry, edgesMaterial );
    panel.add(edges);
  }

  function addText(text: string | number, offsetX: number, offsetY: number, offsetZ: number, userData?: unknown, vertical = false, flat = false) {
    const myText = new Text()
    myText.text = text
    myText.textAlign = 'center'
    myText.fontSize = 36
    myText.color = 0x000000
    myText.userData = userData;
    myText.position.set(offsetX - text.toString().length * myText.fontSize /1.6/2, offsetY, offsetZ)
    if (vertical) {
      myText.position.set(offsetX - store.totalWidth/2, offsetY - text.toString().length * myText.fontSize /1.6/2, offsetZ)
      myText.rotation.z = Math.PI / 2;
    } else if (flat) {
      myText.rotation.x = -Math.PI / 2;
      myText.position.set(offsetX - text.toString().length * myText.fontSize /1.6/2 - store.totalWidth/2, offsetY, offsetZ)
    } else {
      myText.position.set(offsetX - text.toString().length * myText.fontSize /1.6/2 - store.totalWidth/2, offsetY, offsetZ)
    }
    myText.sync()

    return myText
  }

  // ------------ MODULES ------------

  function addBasicModule(module: TFurnitureModule, moduleIndex: number): THREE.Mesh[] {
    return [
      module.hasRearWall ? addRearWall(module.height, module.width, module.x, module.y, module.z) : null,
      addHorizontalPanel(
        { length: module.width, width: module.depth, offsetX: module.x, offsetY: module.y, offsetZ: module.z },
        {materialId: module.materialId, moduleIndex}
      ),
      addHorizontalHoverMesh(
        { length: module.width, width: module.depth, offsetX: module.x, offsetY: module.y, offsetZ: module.z },
        { position: "bottom", module, index: moduleIndex}
      ),
      addHorizontalPanel(
        { length: module.width, width: module.depth, offsetX: module.x, offsetY: module.y + module.height - store.listThickness, offsetZ: module.z },
        { materialId: module.materialId, moduleIndex }
      ),
      addHorizontalHoverMesh(
        { length: module.width, width: module.depth, offsetX: module.x, offsetY: module.y + module.height + 0.1, offsetZ: module.z },
        { position: "top", module, index: moduleIndex}
      ),
      addVerticalPanel(
      { length: module.height-store.listThickness*2, width: module.depth, offsetX: module.x, offsetY: module.y + store.listThickness, offsetZ: module.z },
      {materialId: module.materialId, moduleIndex}
      ),
      addVerticalHoverMesh(
        { height: module.height, width: module.depth, offsetX: module.x-0.1, offsetY: module.y, offsetZ: module.z },
        { position: 'left', module, index: moduleIndex}
      ),
      addVerticalPanel(
        { length: module.height-store.listThickness*2, width: module.depth, offsetX: module.x + module.width - store.listThickness, offsetY: module.y + store.listThickness, offsetZ: module.z },
        {materialId: module.materialId, moduleIndex}
      ),
      addVerticalHoverMesh(
        { height: module.height, width: module.depth, offsetX: module.x+module.width+0.01, offsetY: module.y, offsetZ: module.z },
        { position: 'right', module, index: moduleIndex}
      ),
      addFrontalHoverMesh(
        { height: module.height, width: module.width, offsetX: module.x, offsetY: module.y, offsetZ: module.z + module.depth + 0.1 + (module.facade?.thickness ?? 0) },
        { module, index: moduleIndex, clickToOpen: true }
      ),
      module.facade?.enabled ? addFrontalPanel(
        { length: module.height - 4, width: module.width - 4, offsetX: module.x + 2, offsetY: module.y + 2, offsetZ: module.z + module.depth },
        { materialId: module.facade.materialId, thickness: module.facade.thickness, moduleIndex }
      ) : null,
      addText(module.width, module.x + module.width/2, module.y + module.height + 80 + 60, module.z + module.depth, {width: true, moduleIndex }),
      addXMeasurements(module.width, 80, module.x, module.y+module.height, module.z + module.depth + 2),

      addText(module.height, module.x - 64 - 48, module.y + module.height/2, module.z + module.depth + 2, {height: true, moduleIndex }, true),
      addYMeasurements(module.height, 64, module.x - 2, module.y, module.z + module.depth + 2),
      addText(module.depth, module.x + module.width + 64, module.y + module.height + 48, module.z + module.depth/2, {depth: true, moduleIndex }),
      addZMeasurements(module.depth, 32, module.x + module.width + 2, module.y + module.height, module.z),
    ]
  }

  function addTableTop(module: TFurnitureModule, i: number): (THREE.Mesh | null)[] {
    return [
      addHorizontalPanel(
        { length: module.width, width: module.depth + 50, offsetX: module.x, offsetY: module.y, offsetZ: module.z },
        { materialId: module.materialId, thickness: module.height, moduleIndex: i }
      ),
      addHorizontalHoverMesh(
        { width: module.depth + 50, length: module.width, offsetX: module.x, offsetY: module.y + module.height + 0.1, offsetZ: module.z },
        { position: "top", index: i, module, clickToOpen: true }
      )
    ];
  }

  const kitchenTypeToBuilderMap: Record<string, (module: TFurnitureModule, i: number) => (THREE.Mesh | null)[]> = {
    'tableTop': addTableTop,
    'default': addBasicModule,
  }


  function updateModel(_scene: THREE.Scene) {
    scene.value = _scene
    clearScene(_scene);
    for (const [i, module] of store.modules.entries()) {
      const panels = kitchenTypeToBuilderMap[module.type || 'default'](module, i)
      scene.value.add(
        ...panels
        .filter(p => !!p)
        .map(p => rotatePanel(p, new Vector3(module.x - store.totalWidth/2, module.y, module.z), module.rotation || ROTATIONS.FRONT))
        .map(p => translateRotatedPanel(p, module.rotation || ROTATIONS.FRONT, module.width, module.depth))
      );
    }
  }

  return { updateModel }
}

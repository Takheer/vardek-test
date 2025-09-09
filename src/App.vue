<script setup lang="ts">
import {PhListChecks, PhPencilRuler} from "@phosphor-icons/vue";
import DimensionChangeMenu from "@/components/DimensionChangeMenu.vue";
import KitchenConstructor from "@/components/KitchenConstructor/KitchenConstructor.vue";
import type {TPanelUserData} from "@/components/NewModuleModal/types";
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore/useKitchenConstructorStore";
import {
  ROTATIONS,
  type TFurnitureModule,
  type TFurnitureModuleCreationType
} from "@/stores/useKitchenConstructorStore/types"
import { computed, ref } from 'vue'
import SidebarMenuButton from '@/components/SidebarMenuButton.vue'
import ModuleActionsMenu from '@/components/ModuleActionsMenu.vue'
import NewModuleModal from '@/components/NewModuleModal/NewModuleModal.vue'
import ModuleCreationMenu from '@/components/ModuleCreationMenu.vue'

const store = useKitchenConstructorStore();

const activeMenu = ref<"module"|"dimension"|"config"|"options"|"newModule"|"actions"| null>(null);
const userDataRef = ref();
const constructor = ref();
const moduleIndex = ref();
const selectedModule = ref();
const clickedPanel = ref<TPanelUserData["position"] | null>(null);

// тут была более развернутая логика для большего количества модулей
const newModuleOptions = ref<Record<TPanelUserData["position"], TFurnitureModuleCreationType[]>>({
  'top': ['default', 'tableTop'],
  'bottom': ['default'],
  'left': ['default'],
  'right': ['default'],
  'front': ['default']
})

function setDimensionChangeMenu(userData: TPanelUserData, event: MouseEvent) {
  const root = document.documentElement;
  root.style.setProperty('--mouse-x', event.clientX + "px");
  root.style.setProperty('--mouse-y', event.clientY + "px");
  userDataRef.value = userData
  activeMenu.value = 'dimension';
}

function calculateCopiedModuleParams(module: TFurnitureModule, position: TPanelUserData["position"]): TFurnitureModule {
  let newModuleX: number, newModuleY: number, newModuleZ: number

  const basePointCoordsMultiplier = getBasePointFromPosition(position)
  switch (module.rotation) {
    case ROTATIONS.RIGHT:
      newModuleX = module.x;
      newModuleY = module.y + module.height * basePointCoordsMultiplier[1];
      newModuleZ = module.z - module.width * basePointCoordsMultiplier[0]
      break;
    case ROTATIONS.LEFT:
      newModuleX = module.x
      newModuleY = module.y + module.height * basePointCoordsMultiplier[1];
      newModuleZ = module.z + module.width * basePointCoordsMultiplier[0]
      break;
    case ROTATIONS.FRONT:
    default:
      newModuleX = module.x + module.width * basePointCoordsMultiplier[0];
      newModuleY = module.y + module.height * basePointCoordsMultiplier[1];
      newModuleZ = module.z
      break;
  }


  return {
    ...module,
    facade: module.facade ? {
      ...module.facade
    } : undefined,
    x: newModuleX,
    y: newModuleY,
    z: newModuleZ,
  }
}

function getRotationFromOrientation(orientation: 'front' | 'back' | 'right' | 'left') {
  const map = {
    front: ROTATIONS.BACK,
    back: ROTATIONS.FRONT,
    right: ROTATIONS.LEFT,
    left: ROTATIONS.RIGHT,
  }
  return map[orientation] ?? ROTATIONS.FRONT;
}

function getBasePointFromPosition(position: TPanelUserData["position"]) {
  // xy базового вектора, который указывает на направление создания нового модуля
  const map = {
    right: [1,0],
    left: [-1,0],
    top: [0,1],
    bottom: [0,-1],
    front: [0,0]
  }

  return map[position]
}

function handlePanelClick(userData: TPanelUserData, event: MouseEvent) {
  store.selectedModuleIndex = userData.index
  if (userData.clickToOpen) {
    moduleIndex.value = userData.index
    activeMenu.value = 'module'
    return;
  }
  const root = document.documentElement;
  root.style.setProperty('--mouse-x', event.clientX + "px");
  root.style.setProperty('--mouse-y', event.clientY + "px");
  userDataRef.value = userData

  selectedModule.value = userData.module
  clickedPanel.value = userData.position
  activeMenu.value = 'actions'
}

function openAddMenu() {
  activeMenu.value = 'newModule'
}

function handleRotate() {
  let rotation = selectedModule.value.rotation || ROTATIONS.FRONT;
  switch (rotation) {
    case ROTATIONS.FRONT:
      rotation = ROTATIONS.LEFT;
      break;
    case ROTATIONS.LEFT:
      rotation = ROTATIONS.BACK;
      break;
    case ROTATIONS.BACK:
      rotation = ROTATIONS.RIGHT;
      break;
    case ROTATIONS.RIGHT:
      rotation = ROTATIONS.FRONT;
      break;
  }
  selectedModule.value.rotation = rotation;
}

function handleClose() {
  activeMenu.value = null
  selectedModule.value = null
  clickedPanel.value = null
}

const dimensionInputValue = computed(() => 'width' in userDataRef.value
  ? +store.modules[userDataRef.value.moduleIndex].width
  : 'height' in userDataRef.value
    ? +store.modules[userDataRef.value.moduleIndex].height
    : +store.modules[userDataRef.value.moduleIndex].depth);

function updateValue(val: number) {
  const module = store.modules[userDataRef.value.moduleIndex]
  return 'width' in userDataRef.value
    ? module.width = +val
    : 'height' in userDataRef.value
      ? module.height = +val
      : module.depth = +val
}

function handleModuleCreation(type: TFurnitureModuleCreationType) {
  if (!clickedPanel.value) return;
  switch (type) {
    case 'copy':
      store.addModule(calculateCopiedModuleParams(selectedModule.value, clickedPanel.value))
      break;
    case 'tableTop':
      store.addModule({
        ...calculateCopiedModuleParams(selectedModule.value, clickedPanel.value),
        type,
        height: 32,
        facade: undefined,
      })
      break;
    case 'corner':
      if (clickedPanel.value === 'top' || clickedPanel.value === 'bottom') return;
      store.addModule({
        ...calculateCopiedModuleParams(
          {...selectedModule.value, width: clickedPanel.value === 'left' ? selectedModule.value.depth : selectedModule.value.width},
          clickedPanel.value
        ),
        type,
        width: selectedModule.value.depth * 1.6,
        cornerIntermediateDepth: selectedModule.value.depth,
        facade: undefined,
        options: { orientation: clickedPanel.value },
        rotation: getRotationFromOrientation(clickedPanel.value)
      })
      break;
    case 'kitchenLower':
    default:
      store.addModule({
        ...calculateCopiedModuleParams(selectedModule.value, clickedPanel.value),
        type: type || 'default'
      })
      break;
  }
  moduleIndex.value = store.modules.length - 1
  store.selectedModuleIndex = moduleIndex.value
  activeMenu.value = 'module'
}
</script>

<template>
  <div class="fixed">
    <div class="fixed top-0 bottom-0 flex flex-col justify-center">
      <div class="h-fit flex flex-col justify-center p-6 gap-4">
        <SidebarMenuButton class="drop-shadow-lg hover:drop-shadow-xl transition-all" @click="activeMenu = 'config'" popup-text="Размеры">
          <PhPencilRuler size="24"/>
        </SidebarMenuButton>
        <SidebarMenuButton class="drop-shadow-lg hover:drop-shadow-xl transition-all" @click="activeMenu='options'" popup-text="Опции">
          <PhListChecks size="24"/>
        </SidebarMenuButton>
      </div>
      <DimensionChangeMenu
        v-if="activeMenu === 'dimension'"
        class="absolute rounded shadow-xl position-under-cursor"
        @close="handleClose"
        @update:model-value="updateValue"
        :model-value="dimensionInputValue"
        :user-data="userDataRef"
      />
      <ModuleCreationMenu
        v-if="clickedPanel && activeMenu === 'newModule'"
        :module-options="newModuleOptions[clickedPanel]"
        class="absolute rounded shadow-xl position-under-cursor"
        @close="handleClose"
        @selectModuleType="handleModuleCreation"
      />
      <ModuleActionsMenu
        v-if="activeMenu === 'actions'"
        class="absolute rounded shadow-xl position-under-cursor"
        @copy="() => handleModuleCreation('copy')"
        @rotate="handleRotate"
        @add="openAddMenu"
      />
    </div>

    <div class="fixed top-0 bottom-0 right-0 -translate-x-full flex flex-col justify-center">
      <NewModuleModal
        v-if="activeMenu === 'module'"
        @close="handleClose"
        :user-data="userDataRef"
        class="absolute right-0 top-0 rounded shadow-xl overflow-auto h-full"
        :module-index="moduleIndex"
        ref="newModuleModal"
      />
    </div>

    <KitchenConstructor
      ref="constructor"
      @click:dimension="(userData, e) => setDimensionChangeMenu(userData, e)"
      @click:panel="(userData, e) => handlePanelClick(userData, e)"
      @close="handleClose"
    />
  </div>
</template>

<style lang="scss">

</style>

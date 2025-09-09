import {
  ROTATIONS,
  type TFurnitureModule,
  type TMaterial
} from '@/stores/useKitchenConstructorStore/types'
import { defineStore } from 'pinia'
import { Texture } from 'three'

export const listOptions: TMaterial[] = [
  {
    id: 1,
    title: 'Белый стандарт',
    price: 2848,
    area: 2800*2070,
    textureUrl: '/textures/ldsp_white.jpg',
    thickness: 16,
    manufacturer: 'Cronospan',
    manufacturer_code: 'h111',
    color: 'white',
    type: 'ldsp',
    is_available: true,
    slug: ''
  },
  {
    id: 2,
    title: 'Белый базовый',
    price: 3498,
    area: 2800*2070,
    textureUrl: '/textures/ldsp_white.jpg',
    thickness: 16,
    manufacturer: 'Egger',
    manufacturer_code: 'h222',
    color: 'white',
    type: 'ldsp',
    is_available: true,
    slug: ''
  },
  {
    id: 3,
    title: 'Дуб бардолино',
    price: 3907,
    area: 2800*2070,
    textureUrl: '/textures/ldsp_bardolino.avif',
    thickness: 16,
    manufacturer: 'Egger',
    manufacturer_code: 'u234',
    color: 'white',
    type: 'ldsp',
    is_available: true,
    slug: ''
  },
  {
    id: 6,
    title: 'Серый графит',
    price: 3395,
    area: 2800*2070,
    textureUrl: '/textures/ldsp_grey_graphite.avif',
    thickness: 16,
    manufacturer: 'Egger',
    manufacturer_code: 'h111',
    color: 'white',
    type: 'ldsp',
    is_available: true,
    slug: ''
  },
];

const materials: TMaterial[] = [
  {
    id: 1,
    thickness: 16,
    manufacturer: 'Hardware',
    manufacturer_code: 'H111',
    type: 'ldsp',
    is_available: true,
    slug: 'Hardware',
    title: 'Белый стандарт',
    price: 2848,
    area: 2800*2070,
    textureUrl: '/textures/ldsp_white.jpg',
    color: 'white'
  },
  {
    id: 2,
    thickness: 3,
    manufacturer: 'Hardware',
    manufacturer_code: 'H111',
    type: 'hdf',
    is_available: true,
    slug: 'Hardware',
    title: 'Антрацит',
    price: 1053,
    area: 2800*2070,
    textureUrl: '/textures/ldsp_bardolino.avif',
    color: 'white'
  }
]

export const useKitchenConstructorStore = defineStore('kitchenConstructor', {
  state: () => ({
    modules: [
      { depth: 670, height: 800, width: 600, x: 0, y: 0, hasRearWall: true },
      { depth: 670, height: 800, width: 600, x: 600, y: 0, hasRearWall: true },
      { depth: 670, height: 400, width: 600, x: 600, y: 800, hasRearWall: true },
    ] as TFurnitureModule[],
    selectedModuleIndex: null as number | null,
    listThickness: 16,
    baseListThickness: 16,
    totalPanelsAreaSqmm: 0,
    rearWallAreaSqmm: 0,
    panelsCount: 0,
    selectedListOption: materials[0],
    selectedRearWallOption: materials[1],
    hasRearWall: true,
    materials,
    textures: {} as Record<number, Texture>,
    collidingModules: [],
    listOptions,
  }),
  getters: {
    totalPrice: (state) => (
      state.totalPanelsAreaSqmm / state.selectedListOption.area! * state.selectedListOption.price
      + (state.hasRearWall ? (state.rearWallAreaSqmm / state.selectedRearWallOption.area! * state.selectedRearWallOption.price) : 0)
      + state.panelsCount * 100) * 2,
    totalHeight: (state) => {
      let maxY = 0;
      let maxYModule = state.modules[0];
      state.modules.forEach((module) => {
        if (module.y >= maxY) {
          maxYModule = module;
          maxY = module.y;
        }
      })

      if (!maxYModule) return 0;

      return maxYModule.y + maxYModule.height
    },
    totalWidth: (state) => {
      let maxX = Number.NEGATIVE_INFINITY;
      let minX = Number.POSITIVE_INFINITY
      let maxXModule: TFurnitureModule|null = state.modules[0];
      state.modules.forEach((module) => {
        if (module.x >= maxX) {
          maxXModule = module;
          maxX = module.x;
        }
        if (module.x <= minX) {
          minX = module.x;
        }
      })

      if (!maxXModule) return 0;

      return maxX + minX + ([ROTATIONS.LEFT, ROTATIONS.RIGHT].includes(maxXModule.rotation!) ? maxXModule.depth : maxXModule.width)
    },
    usedMaterials: (state) => Array.from(new Set(state.modules.map(m => ([m.materialId, m.facade?.materialId])).flat())).filter(i => !!i),
    isOrderButtonEnabled: (state) => state.collidingModules.length === 0,
  },
  actions: {
    addModule(module: TFurnitureModule) {
      this.modules.push(module);
    },
    removeModule(i: number) {
      this.modules.splice(i, 1)
    }
  },
})

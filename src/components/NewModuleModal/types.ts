import type {TFurnitureModule} from "@/stores/useKitchenConstructorStore/types";

export type TPanelUserData = {
  module: TFurnitureModule
  position: 'top'|'bottom'|'left'|'right'|'front'
  clickToOpen?: boolean
  index: number
}

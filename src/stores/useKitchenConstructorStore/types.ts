export type TFurnitureModuleTypeName = "default" | "kitchenLower" | "kitchenDrawers" | "tableTop" | "corner"
export type TFurnitureModuleCreationType = "copy" | TFurnitureModuleTypeName

export type TMaterial = {
  id: number,
  title: string,
  price: number,
  area?: number,
  textureUrl: string,
  thickness: number,
  manufacturer: string,
  manufacturer_code: string,
  color: string,
  type: string
  is_available: boolean
  slug: string
}


export type TKitchenConstructorAction = "rotate" | "copy" | "add"
export enum ROTATIONS {
    FRONT = 0,
    RIGHT = 90,
    BACK = 180,
    LEFT = -90,
}

export type TFurnitureModule = {
    height: number
    width: number
    depth: number
    cornerIntermediateDepth?: number
    x: number
    y: number
    z: number,
    rotation?: ROTATIONS
    materialId: number
    type?: string
    facade?: {
        enabled: boolean
        type: string
        materialId: number
        thickness: number
    }
    hasRearWall?: boolean
    base?: {
        height: number
    }
    options: Record<string, any>
}

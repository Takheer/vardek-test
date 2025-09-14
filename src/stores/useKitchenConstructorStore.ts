import { defineStore } from 'pinia'

export const useKitchenConstructorStore = defineStore('kitchenConstructor', {
  state: () => ({
    width: 1200,
    height: 2300
  }),
})

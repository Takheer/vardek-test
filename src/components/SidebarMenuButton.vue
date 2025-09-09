<script setup lang="ts">
import { ref } from 'vue'

type TProps = {
  popupText?: string
};
defineProps<TProps>();

const popupShowed = ref(false)
</script>

<template>
  <div class="relative">
    <div
      @mouseover="popupShowed=true"
      @mouseleave="popupShowed=false"
      class="p-4 flex justify-center items-center bg-yellow-300 hover:bg-yellow-400 rounded-full transition-all cursor-pointer">
      <slot/>
    </div>
    <div v-show="popupShowed" class="absolute left-20 top-2">
      <div class="rounded bg-gray-700 py-2 px-6 text-white text-nowrap">{{ popupText }}</div>
    </div>
  </div>
</template>

<style lang="scss">

</style>

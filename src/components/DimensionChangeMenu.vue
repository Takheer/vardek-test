<script setup lang="ts">

import {PhX} from "@phosphor-icons/vue";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { TPanelUserData } from '@/components/NewModuleModal/types.ts'
type TProps = {
  userData: TPanelUserData
};
const props = defineProps<TProps>();

type TEmits = {
  (e: 'close'): void
  (e: 'update:modelValue', val: number): void
};
const emits = defineEmits<TEmits>();

const input = ref<HTMLInputElement>()

const model = defineModel()

function onEscPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
        emits('close')
    }
}

onMounted(() => {
    input.value!.focus()
    input.value!.select()
    window.addEventListener('keyup', onEscPress)
})

onBeforeUnmount(() => {
    window.removeEventListener('keyup', onEscPress)
})

watch(() => props.userData, async () => {
  input.value!.focus()
  await nextTick();
  input.value!.select()
}, {deep: true})
</script>

<template>
  <div class="flex flex-col px-4 py-2 bg-gray-200">
    <div class="flex flex-row justify-between mb-6 items-baseline">
      <h2>{{'height' in userData ? 'Высота секции' : 'width' in userData ? 'Ширина секции' : 'Глубина'}}</h2>
      <PhX size="16" class="cursor-pointer" @click="emits('close')"/>
    </div>
    <input ref="input" v-model="model" @keydown.enter="emits('close')">
  </div>
</template>

<style lang="scss">

</style>

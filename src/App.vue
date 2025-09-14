<script setup lang="ts">
/**
 * Всё управление и реагирование на ввод в конструктор происходит здесь
 * Тут нужно прописывать всю бизнес-логику того, как модули собираются вместе и реагируют на действия
 * над ними. В будущем это позволит использовать один и тот же движок для разных применений
 * */
import DimensionChangeMenu from "@/components/DimensionChangeMenu.vue";
import KitchenConstructor from "@/components/KitchenConstructor/KitchenConstructor.vue";
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore.ts";
import { computed, ref } from 'vue'

const store = useKitchenConstructorStore();

const activeMenu = ref<boolean>(false);
const userDataRef = ref();
const constructor = ref();

function setDimensionChangeMenu(userData: unknown, event: MouseEvent) {
  const root = document.documentElement;
  root.style.setProperty('--mouse-x', event.clientX + "px");
  root.style.setProperty('--mouse-y', event.clientY + "px");
  userDataRef.value = userData
  activeMenu.value = true;
}

function handleClose() {
  activeMenu.value = false
}

const dimensionInputValue = computed(() => 'width' in userDataRef.value ? +store.width : +store.height);

function updateValue(val: number) {
  return 'width' in userDataRef.value
    ? store.width = +val
    : store.height = +val
}
</script>

<template>
  <div class="fixed">
    <div class="fixed top-0 bottom-0 flex flex-col justify-center">
      <DimensionChangeMenu
        v-if="activeMenu"
        class="absolute rounded shadow-xl position-under-cursor"
        @close="handleClose"
        @update:model-value="updateValue"
        :model-value="dimensionInputValue"
        :user-data="userDataRef"
      />
    </div>

    <KitchenConstructor
      ref="constructor"
      @click:dimension="(userData, e) => setDimensionChangeMenu(userData, e)"
      @close="handleClose"
    />
  </div>
</template>

<style lang="scss">

</style>

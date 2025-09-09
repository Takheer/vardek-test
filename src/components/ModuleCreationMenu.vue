<template>
    <div class="flex flex-col px-4 py-2 bg-gray-200">
        <div class="flex flex-row justify-between mb-6 items-baseline">
            <h2>Новый модуль</h2>
            <PhX size="16" class="cursor-pointer" @click="emits('close')"/>
        </div>
        <div class="flex flex-col gap-2">
            <IKButton block @click="() => emits('selectModuleType', 'copy')" class="flex flex-row gap-2 items-center" size="sm">
                <PhCopy size="24" />
                Копировать&nbsp;выбранный
            </IKButton>
            <IKButton
                v-for="option of moduleOptions"
                :key="option"
                @click="() => emits('selectModuleType', option)"
                full-width
                class="flex flex-row gap-2 items-center"
                size="sm"
            >
                {{ option }}
            </IKButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IKButton } from "insola-tech-ui-kit";
import { PhCopy, PhX } from "@phosphor-icons/vue";
import type {TFurnitureModuleCreationType} from "@/stores/useKitchenConstructorStore/types.ts";
import { onBeforeUnmount, onMounted } from 'vue'

type TProps = {
    moduleOptions: TFurnitureModuleCreationType[];
};
defineProps<TProps>();

type TEmits = {
  (e: 'close'): void
  (e: 'selectModuleType', val: TFurnitureModuleCreationType): void
};
const emits = defineEmits<TEmits>();

function onEscPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
        emits('close')
    }
}

onMounted(() => {
    window.addEventListener('keyup', onEscPress)
})

onBeforeUnmount(() => {
    window.removeEventListener('keyup', onEscPress)
})
</script>

<style lang="scss">

</style>

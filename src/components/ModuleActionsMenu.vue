<template>
    <div class="flex flex-col px-4 py-2 bg-gray-200">
        <div class="flex flex-col gap-2">
            <div class="flex flex-row gap-2">
                <IKButton
                    block
                    variant="outline"
                    @click="() => emits('copy')" class="flex flex-row gap-2 items-center" size="sm"
                >
                    <PhCopy size="24" />
                </IKButton>
                <IKButton
                    block
                    variant="outline"
                    @click="() => emits('add')" class="flex flex-row gap-2 items-center" size="sm"
                >
                    <PhPlus size="24" />
                </IKButton>
                <IKButton
                    block
                    variant="outline"
                    @click="() => emits('rotate')" class="flex flex-row gap-2 items-center" size="sm"
                >
                    <PhArrowClockwise size="24" />
                </IKButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IKButton } from "insola-tech-ui-kit";
import { PhArrowClockwise, PhCopy, PhPlus } from "@phosphor-icons/vue";
import type { TKitchenConstructorAction } from "@/stores/useKitchenConstructorStore/types";
import { onBeforeUnmount, onMounted } from 'vue'

type TEmits = {
    (e: 'close'): void
    (e: TKitchenConstructorAction): void
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

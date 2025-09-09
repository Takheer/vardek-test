<template>
    <div class="flex flex-col px-6 py-4 gap-2 bg-gray-200 min-w-80">
        <div class="flex flex-row justify-between mb-4 items-baseline">
            <h2>Модуль</h2>
            <PhX size="16" class="cursor-pointer" @click="emits('close')"/>
        </div>
        <IKTextInput
            label="Высота"
            dense
            as-number
            v-model="selectedModule.height"
        />
        <IKTextInput
            label="Ширина"
            dense
            as-number
            v-model="selectedModule.width"
        />
        <IKTextInput
            label="Глубина"
            dense
            as-number
            v-model="selectedModule.depth"
        />
        <div class="flex flex-col mt-4">
            <p>Отступ</p>
            <div class="flex flex-row gap-2">
                <IKTextInput
                    label="В"
                    dense
                    as-number
                    v-model="selectedModule.y"
                />
                <IKTextInput
                    label="Ш"
                    dense
                    as-number
                    v-model="selectedModule.x"
                />
                <IKTextInput
                    label="Г"
                    dense
                    as-number
                    v-model="selectedModule.z"
                />
            </div>
        </div>
        <IKCheckbox label="Задняя стенка" v-model="selectedModule.hasRearWall" class="" />
        <IKCheckbox
            label="Фасад"
            class=""
            :model-value="selectedModule.facade?.enabled"
            @update:model-value="e => selectedModule.facade ? selectedModule.facade.enabled = e : null"
        />
        <IKButton
            full-width
            variant="outline"
            class="mt-2 flex flex-row items-center gap-2"
            size="sm"
            :disabled="store.modules.length === 1"
            @click="deleteModule"
        >
            <PhTrash size="24" /> Удалить
        </IKButton>
    </div>
</template>

<script setup lang="ts">
import {IKTextInput, IKButton, IKCheckbox} from "insola-tech-ui-kit";
import {PhTrash, PhX} from "@phosphor-icons/vue";
import {useKitchenConstructorStore} from "@/stores/useKitchenConstructorStore/useKitchenConstructorStore";
import { computed } from 'vue'

type TEmits = {
  (e: 'close'): void
  (e: 'openMaterialSelectModal'): void
};
const emits = defineEmits<TEmits>();

type TProps = {
    moduleIndex: number
};
const props = defineProps<TProps>();

const store = useKitchenConstructorStore()

const selectedModule = computed(() => store.modules[props.moduleIndex])

function onClose() {
    emits('close');
}

function deleteModule() {
    if (store.modules.length === 1) return;
    store.removeModule(props.moduleIndex)
    onClose()
}
</script>

<style lang="scss">

</style>

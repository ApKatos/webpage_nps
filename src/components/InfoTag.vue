<template>
    <div>
        <v-tooltip v-model="show">
            <template v-slot:activator="{ props }">
                <v-icon v-bind="props" color="black" class="tag" icon="mdi-information" size="large" @click="show = !show">
                </v-icon>
            </template>
            <slot></slot>
        </v-tooltip>
    </div>
</template>


<script>
export default {
    data() {
        return {
            show: false,
        }
    },
}
</script>
<style scoped>
.tag {
    padding: 5px;
    display: inline-flex;
    position: relative;
    cursor: pointer;
}
</style>
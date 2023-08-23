<template>
    <div>
        <v-tooltip>
            <template v-slot:activator="{ props }">
                <v-icon v-bind="props" color="black" class="tag" icon="mdi-information" size="large">
                </v-icon>
            </template>
            <slot></slot>
        </v-tooltip>
    </div>
</template>


<script>
export default {

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
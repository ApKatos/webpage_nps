<template>
    <div class="tag" @mouseover=" hover = true" @mouseleave="hover = false">
        <v-icon class="tag-icon" color="black" icon="mdi-information" size="large">
        </v-icon>
        <div class="tag-text" v-if="hover">
            <!-- TODO: add the gaps at the beginning and end of each line -->
            <!-- &nbsp; &nbsp; -->
            <slot>
            </slot>
            <!-- &nbsp; &nbsp; -->
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            hover: false
        }
    },
}
</script>

<style scoped>
.tag {
    padding: 5px;
    display: flex;
}

.tag-icon {
    cursor: pointer;
}

.tag-text {
    /* position: absolute; */
    background: whitesmoke;
    /* border: dashed; */
    /* border-width: 2px 4px; */
    border-radius: 30px;
    white-space: pre-wrap;
    color: black;
}
</style>

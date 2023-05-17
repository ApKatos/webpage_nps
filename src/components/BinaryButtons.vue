<template>
    <v-radio-group v-model="valueData" inline>
        <v-radio style="color:rgba(0, 0, 0, 0.4)" :label="labels[0].toString()" color="green" :value="0"></v-radio>
        <v-radio style="color:rgba(0, 0, 0, 0.4)" :label="labels[1].toString()" color="green" :value="1"></v-radio>
    </v-radio-group>
</template>

<script>
export default {
    props: {
        labels: {
            type: Array,
            required: true
        },
        thrs: {
            type: Array,
            required: true,
        },
        value: {
            default: "",
        }
    },
    data() {
        return {
            // valueData: this.value
        }
    },
     computed: {
        valueData: {
            get() {
                return this.value; // Set the selected value based on the prop value
            },
            set(newValue) {
                this.$emit('update:value', newValue); // Emit the updated value to the parent component
            },
        }
    },
    watch: {
        valueData: {
            handler(val) {
                this.$emit('update:value', val)
            }
        },
    }
}
</script>
<style>
.v-radio-group {
    display: flex !important;
    width: fit-content !important;
}
</style>
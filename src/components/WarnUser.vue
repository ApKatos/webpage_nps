<template>
    <v-sheet class="d-flex align-center justify-center flex-wrap text-center mx-auto" elevation="4" height="250" rounded
        max-width="800" width="100%">
        <div style="padding: 1em;">
            <h2 class="text-h4 font-weight-black text-orange">ALERTING REMINDER</h2>

            <div class="text-h5 font-weight-medium mb-2" style="padding: 05px 50px 0px 50px">
                You are using network phenotyping strategy that calculates predictions for patients with HPC!
            </div>

            <p class="text-body-2 mb-4">
                Please keep in mind that this is not to be played with by setting random values and adjusting the evaluation
                for patient.
            </p>

            <v-btn @click="$emit('closingWarning')" variant="text" color="orange">I UNDERSTAND</v-btn>
        </div>
    </v-sheet>
</template>

<script >
export default {
    methods: {
        close() {
            this.$emit("closingWarning")
        }
    }
}
</script>

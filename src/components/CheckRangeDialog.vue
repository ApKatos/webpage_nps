<template>
  <!-- Dialog Component -->
  <v-dialog v-model="visibility" persistent width="auto" scroll-strategy="reposition">
    <!-- Dialog Content -->
    <v-card>
      <v-card-title class="text-h7">
        Is the inputted parameter value for {{ this.variableName }} correct?
      </v-card-title>
      <v-card-text>
        {{ this.getDialogMessage }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green-darken-1" variant="text" @click="this.$emit('update:checked', false)">
          No, I am going to change it
        </v-btn>
        <v-btn color="green-darken-1" variant="text" @click=" this.$emit('update:checked', true)">
          Yes, it is correct
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    visibility: { Boolean },
    valueData: { Number },
    observedMin: { Number },
    observedMax: { Number },
    variableName: { String },
  },
  methods: {
    calculateMultiple(value, total) {
      return Number(parseFloat(value) / parseFloat(total)).toFixed(1);
    },
  },
  computed: {
    getDialogMessage() {
      let num;
      let extremeSide;
      let size;
      if (this.valueData >= this.observedMax) {
        num = this.calculateMultiple(this.valueData, this.observedMax);
        extremeSide = "maximum";
        size = "larger"
      } else if (this.valueData <= this.observedMin) {
        num = this.calculateMultiple(this.observedMin, this.valueData);
        extremeSide = "minimum";
        size = "smaller"
      }
      let message =
        "You have inputted value (" +
        this.valueData + ") that is " +
        num +
        " times " +
        size +
        " than the " +
        extremeSide +
        " observed value in training dataset. Is the value correcly set? ";
      return message;
    }
  },
};
</script>

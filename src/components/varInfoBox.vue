<template>
  <div class="grid-container">
    <div
      class="grid-item"
      v-for="variable in variables"
      :id="'button-' + variable.index"
      :key="variable"
      :style="{
        backgroundColor: evaluatedColor(
          variable.value,
          variable.alert_high,
          variable.alert_low
        ),
      }"
    >
      <div>
        {{ variable.varname }}
      </div>
      <div>
        {{ variable.value }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    variables: {
      Array,
      required: true,
    },
  },
  computed: {
    evaluatedColor() {
      return function (varval, high, low) {
        if (varval == null) {
          return "red";
        } else if (varval < high && varval > low) {
          return "green";
        } else {
          return "#FF8000";
        }
      };
    },
  },
  // watch: {
  // valueData: {
  //   handler(val) {
  //     this.$emit('update:value', val)

  //     // ASI TO JE POMALE KED JE TO TU STALE
  //     if (val != null && (val <= this.label95qLower || val >= this.label95qUpper)) {
  //       this.color = this.colorWarn
  //     } else if (val != null && val < this.label95qUpper && val > this.label95qLower) {
  //       this.color = this.colorFine
  //     }
  //   }
  // },
};
</script>


<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(17, auto);
  background-color: #838383;
  padding: 5px;
}

.grid-item {
  background-color: #ff4500;
  border: 2px solid rgba(0, 0, 0);
  padding: 5px;
  text-align: center;
}
</style>
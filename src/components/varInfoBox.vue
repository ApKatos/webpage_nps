<template>
  <div class="grid-container">
    <div class="grid-item" v-for="variable in variables" :id="'label-' + variable.index" :key="variable" :style="{
      backgroundColor: evaluatedColor(
        variable.value,
        variable.alert_high,
        variable.alert_low
      ),
    }" @click="scrollToGraph(variable.index)">
      <div>
        <div class="column" style="padding-left: 1em; font-size: 1.15vw;">
          {{ variable.varname }}
        </div>
        <div class="column" style="text-align: right; padding-right: 1em; font-size: 1vw;">
          {{ variable.value }}
        </div>
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
  methods: {
    scrollToGraph(index) {
      const graphElement = document.getElementById('input-graph-' + index);
      if (graphElement) {
        graphElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "start" });
      }
    },
  },
  computed: {
    evaluatedColor() {
      return function (varval, high, low) {
        if (varval == null) {
          // undefined
          // return "#779A75";
          // return "#A1AFA0"
          return "#3E4A3D"
        } else if (varval < high && varval > low) {
          // good range
          return "#2AA63D";
        } else {
          // outside the rande
          return "#D3A350"
        }
      };
    },
  },
};
</script>


<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: 1;
  grid-template-rows: repeat(17, auto);
  height: 93.5vh;
  width: 15vw;
  /* background-color: #838383; */
  /* padding: 3px; */
}

.grid-item {
  /* background-color: #ff4500; */
  color: white;
  text-shadow: - 10px 10px 10 black,
    10px 10px 10 black,
    10px -10px 10 black,
    -10px -10px 10 black;
  ;
  border: 0.1em solid rgba(0, 0, 0);
  padding: 0.2em;
}

.column {
  float: left;
  width: 50%;
}

.column value {
  text-align: right;
}
</style>
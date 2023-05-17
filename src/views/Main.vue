<template>
  <div class="bg-success">
    <div id="container" v-for="variable in  variables " :key="variable.varname">
      <div>
        <p>{{ variable.value }}</p>
        <HistogramC2 :labelsInp="variable.labels" :dataInp="variable.data" :dataName="variable.varname"
          v-on:update:value="variable.value = $event" :value="variable.value">
        </HistogramC2>
        <div v-if="variable.categ">
          <BinaryButtons :labels="variable.labels" v-on:update:value="variable.value = $event" :value="variable.value"
            :thrs="variable.thrs">
          </BinaryButtons>
        </div>
        <div v-else>
          <MySlider :label95q-lower="variable.alert_low" :label95q-upper="variable.alert_high" :maxim="variable.max"
            :minim="variable.min" :relevant-thresholds="variable.thrs" :categorial="variable.categ"
            :value="variable.value" v-on:update:value="variable.value = $event">
          </MySlider>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import HistogramC2 from "../components/Histogram_C2.vue";
import jsonData from "../json/pats_json_lower_upper_bounds.json";
import MySlider from "../components/Slider.vue";
import BinaryButtons from "@/components/BinaryButtons.vue";

export default {
  components: { HistogramC2, MySlider, BinaryButtons },
  data() {
    return {
      alertUser: true,
      variables: [],
    };
  },
  methods: {
    loadData() {
      Object.entries(jsonData).forEach(([_, value]) => {
        value["value"] = null;
        this.variables.push(value);
      });
    },
  },
  mounted() {
    this.loadData();
  },
};
</script>

<style scoped>
#container {
  display: flex;
  justify-content: center;
}

#container div {
  background-color: white;
  margin-top: 3px;
  margin-bottom: 3px;
  padding: 3px;
  width: 40%;
  display: flex;
  flex-wrap: wrap;
}

p {
  color: black;
  text-align: center;
}
</style>
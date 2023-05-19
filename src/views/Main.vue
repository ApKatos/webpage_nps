<template>
  <div class="bg-success">
    <!-- here div with box items -->
    <var-box :variables="variables" app density="compact"></var-box>
    <div id="container" v-for="variable in variables " :key="variable.varname">
      <div :id="variable.index">
        <p>{{ variable.value }}</p>
        <p> {{ allVarsSubmitted }}</p>
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
    <!-- TODO -->
    <!-- <v-btn :active="allVarsSubmitted" @click="createJSONfromVariables('Form cannot be submitted yet.', allVarsSubmitted)"
      block>SUBMIT & COMPUTE</v-btn> -->
  </div>
</template>

<script type="module">
import HistogramC2 from "../components/Histogram_C2.vue";
import jsonData from "../json/pats_fixedbug_intervals.json";
import MySlider from "../components/Slider.vue";
import BinaryButtons from "@/components/BinaryButtons.vue";
import VarBox from '../components/varInfoBox.vue';
import getRes from '../utils/client.ts';

// prepisat  labels z 0,1 na NO, YES
export default {
  components: { HistogramC2, MySlider, BinaryButtons, VarBox },
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
    // createJSONfromVariables(message, event) {
    //   if (event) {
    //     let arr = {};
    //     for (let variable in this.variables) {
    //       console.log(variable)
    //       arr[variable.varname] = variable.value
    //     }
    //     console.log(arr)
    //     let JSONoutput = JSON.stringify(arr)
    //     let computed = getRes(JSONoutput)
    //     console.log(computed)
    //     return JSONoutput;
    //   } else {
    //     alert(message)
    //   }
    // }
  },
  mounted() {
    this.loadData();
  },
  computed: {
    allVarsSubmitted() {
      for (let variable of this.variables) {
        if (variable.value == null) {
          return false
        }
      }
      return true
    },
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
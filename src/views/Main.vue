<template>
  <div class="bg-success">
    <div class="varbox">
      <infoTag>{{ this.variablesinfo }}</infoTag>
      <var-box :variables="variables" app density="compact"></var-box>
    </div>
    <div>
      <div class="container" v-for="variable in variables " :key="variable.varname">
        <div class="graph" :id="'input-graph-' + variable.index">

          <p>{{ variable.value }}</p>
          <infoTag>{{ variable.decription }}</infoTag>
          <HistogramC2 :labelsInp="variable.labels" :dataInp="variable.data" :dataName="variable.varname"
            @update:value="variable.value = $event" :value="variable.value">
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
      <div class="endbutton">
        <v-btn @click="callModel()" :disabled="!allVarsSubmitted" :loading="pressedButton">
          SUBMIT
        </v-btn>
        <infoTag v-if="allVarsSubmitted"> Check if all values in the left panel are correct and submit</infoTag>
        <infoTag v-else> Fill all variables before submitting the input parameters</infoTag>
      </div>
    </div>
  </div>
</template>

<script>
import HistogramC2 from "../components/Histogram_C2.vue"
import jsonData from "../json/pats_fixedbug_intervals.json"
import MySlider from "../components/Slider.vue"
import BinaryButtons from "@/components/BinaryButtons.vue"
import VarBox from '../components/varInfoBox.vue'
import infoTag from '../components/InfoTag.vue'
import { ModelWrapper } from '../utils/Model.ts';

// prepisat  labels z 0,1 na NO, YES
// upravit max range pri AFP (?) na nizsie cislo
// pridat steps 1 k premennym AGE, TUMOR_NODULES 
export default {
  components: { HistogramC2, MySlider, BinaryButtons, VarBox, infoTag },
  data() {
    return {
      variables: [],
      model: [],
      pressedButton: false,
      resultJSON: "",
      variablesinfo: "Color of the parameter informs you about the prevalence of chosen value in population this model was trained on.\nRed - unfilled value\nOrange - Very scarcely observed value\nGreen - average value\nPressing the variable name will navigate you to input value for the field."
    };
  },
  methods: {
    loadData() {
      Object.entries(jsonData).forEach(([_, value]) => {
        // value["value"] = null;
        value["value"] = 1; // TODO back to null
        this.variables.push(value);
      });
    },
    createJSONfromVariables(message, event) {
      if (event && this.allVarsSubmitted) {

        let arr = {};
        for (let i = 0; i < this.variables.length; i++) {
          let variable = this.variables[i]
          arr[variable.varname] = variable.value
        }
        console.log(arr)
        let JSONModelInput = JSON.stringify(arr)
        return JSONModelInput;
      } else {
        alert(message)
      }
    },
    initModel() {
      this.model = new ModelWrapper()
    },
    callModel() {
      let inputJSON = this.createJSONfromVariables('Form cannot be submitted yet.', this.allVarsSubmitted);
      let resultJSON = this.model.process(inputJSON)
      this.resultJSON = resultJSON;
      this.$router.push({ name: 'Result', query: { result: resultJSON } });

    }
  },
  mounted() {
    this.loadData();
    this.initModel()
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
}
</script>

<style scoped>
.varbox {
  position: fixed;
}

/* .bg {
  background-image: linear-gradient(0.35turn, gray, lightgreen);
  
} */

.container {
  display: flex;
  justify-content: center;
  box-shadow: 0 0 2rem hsl(129, 62%, 20%);
}

.container div {
  /* border: 5px solid green; */
  /* background-color: white; */
  margin-top: 2vh;
  margin-bottom: 2vh;
  /* padding: 1vw 0 1vw 0; */
  width: 38svw;
  display: flex;
  flex-wrap: wrap;
  display: flex;
  justify-content: center;
}

.graph {
  opacity: 0.88;
  border: 3px solid green;
  background-color: white;
  transition:
    opacity 0s ease,
    width 0s ease-in-out box-shadow 0.3s linear,
    background-color 0s ease;
}

.graph:hover {
  /* border: 1px solid black; */
  opacity: 1;
  width: 45vw;
  /* text-shadow: 0 0 0.375rem black; */
  box-shadow: 0 0 5rem hsl(300, 40%, 5%);
}

.endbutton {
  display: flex;
  justify-content: center;
}

.endbutton:hover {
  background-color: darkgreen;
}

p {
  color: black;
  text-align: center;
}
</style>
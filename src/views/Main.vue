<template>
  <div class="bg">
    <div class="varbox">
      <infoTag style="position: fixed; top: 55px; left: 15vw; margin - top: -38px;">
        <span v-html="variablesInfoText.outerHTML"></span>
      </infoTag>
      <var-box :variables="variables" app density="compact"></var-box>
    </div>
    <div>
      <div class="container" v-for="  variable   in   variables  " :key="variable.varname">
        <div class="graph" :id="'input-graph-' + variable.index">
          <!-- <p>{{ variable.value }}</p> -->
          <infoTag style="position: absolute; width:10px; margin-left: 32%; margin-top: 2px;">{{ variable.decription }}
          </infoTag>
          <HistogramC2 :labelsInp="variable.labels" :unitTickMove="variable.unitTickMove" :dataInp="variable.data"
            :dataName="variable.varname" :unit="variable.unit" @update:value="variable.value = $event"
            :value="variable.value" :scaleLog="variable.log">
          </HistogramC2>
          <div v-if="variable.categ">
            <BinaryButtons :labels="variable.labels" v-on:update:value="variable.value = $event" :value="variable.value"
              :thrs="variable.thrs">
            </BinaryButtons>
          </div>
          <div v-else>
            <MySlider :label95q-lower="variable.alert_low" :label95q-upper="variable.alert_high" :minim="variable.min"
              :relevant-thresholds="variable.thrs" :categorial="variable.categ" :value="variable.value"
              :observedMin="variable.observed_min" :observedMax="variable.observed_max"
              :unitTickMove="variable.unitTickMove" v-on:update:value="variable.value = $event">
            </MySlider>
          </div>
        </div>
      </div>
      <div class="endbutton">
        <v-btn @click="callModel()" :disabled="!allVarsInputed" :loading="pressedButton">
          SUBMIT
        </v-btn>
        <infoTag v-if="allVarsInputed" style=" margin-left: 5px; margin-top: 5px;"> Check if all values in the left
          panel are correct and submit</infoTag>
        <infoTag v-else style="margin-left: 5px; margin-top: 5px;">Fill all variables before submitting the input
          parameters</infoTag>
      </div>
    </div>
  </div>
</template>

<script>
import HistogramC2 from "../components/Histogram_C2.vue";
import jsonData from "../json/pats_fixedbug_intervals.json";
import MySlider from "../components/Slider.vue";
import BinaryButtons from "@/components/BinaryButtons.vue";
import VarBox from "../components/varInfoBox.vue";
import infoTag from "../components/InfoTag.vue";
import { ModelWrapper } from "../utils/Model.ts";
export default {
  components: { HistogramC2, MySlider, BinaryButtons, VarBox, infoTag },
  data() {
    return {
      variables: [],
      model: [],
      pressedButton: false,
      resultJSON: "",
    };
  },
  methods: {
    loadData() {
      Object.entries(jsonData).forEach(([_, value]) => {
        value["value"] = 1;
        value["checkedBeforeSubmit"] = false;
        this.variables.push(value);
      });
    },
    createJSONfromVariables(message, event) {
      if (event && this.allVarsInputed) {
        let arr = {};
        for (let i = 0; i < this.variables.length; i++) {
          let variable = this.variables[i];
          arr[variable.varname] = variable.value;
        }
        let JSONModelInput = JSON.stringify(arr);
        return JSONModelInput;
      } else {
        alert(message);
      }
    },
    initModel() {
      this.model = new ModelWrapper();
    },
    calculatePercentageFraction(value, total) {
      return Number(parseFloat(value) / parseFloat(total) * 100).toFixed(1)
    },
    callModel() {
      this.variables.forEach(variable => {
        if (!variable.checkedBeforeSubmit) {
          // check if out of range
          if (variable.value > variable.observed_max || variable.value < variable.observed_min) {
            // yes
            let confirmText;
            if (variable.value > variable.observed_max) {
              // * check upper range
              confirmText = variable.varname + " has value " + this.calculatePercentageFraction(variable.value, variable.observed_max) + "% larger than the maximum observed value in training dataset"
            } else {
              // * check lower range
              confirmText = variable.varname + " has value " + this.calculatePercentageFraction(variable.value, variable.observed_min) + "% smaller than the minimum observed value in training dataset"
            }

            const res = confirm(confirmText)
            if (res) {
              console.log("ze vraj OK")
              variable.checkedBeforeSubmit = true
            } else {
              console.log("Nastavim na -1")
              variable.value = "-1"
              variable.checkedBeforeSubmit = false
              // console.log(" neni to OK, zoomujem")
              // const graphElement = document.getElementById('input-graph-' + variable.index);
              // if (graphElement) {
              //   console.log("zooming done")
              //   graphElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "start" });
              // }
            }
          } else {
            // no
            variable.checkedBeforeSubmit = true
          }
        }
      });
      console.log("result of allvarschecked", this.allVarsChecked)
      if (this.allVarsChecked) {
        console.log("vsetky premnne su checknute")
        let inputJSON = this.createJSONfromVariables(
          "Some parameters have invalid value. Can not be submitted .",
          this.allVarsInputed
        );
        let resultJSON = this.model.process(inputJSON);
        this.resultJSON = resultJSON;
        this.$router.push({ name: "Result", query: { result: resultJSON } });
      }
    },

  },
  mounted() {
    this.loadData();
    this.initModel();
  },
  computed: {
    allVarsChecked() {
      let res = true;
      this.variables.forEach(variable => {
        if (!variable.checkedBeforeSubmit) {
          res = false
        }
      })
      return res;
    },
    allVarsInputed() {
      for (let variable of this.variables) {
        if (variable.value == -1) {
          return false;
        }
      }
      return true;
    },
    variablesInfoText() {
      var label = document.createElement('p');
      label.innerHTML = `Color of the parameter informs you about the prevalence of chosen value in population this model was trained on. <ul type="square" style="margin-left:15px"><li style="color: rgb(13, 15, 12); font-weight: bold;">Unfilled value</li><li style="color: #D3A350; font-weight: bold;">Very scarcely observed value</li><li style="color: #2AA63D; font-weight: bold;">Average value </li><li style="color: rgb(219, 29, 15); font-weight: bold;">Chosen value is critically outside the range observed in training dataset</li></ul>Pressing the variable name will navigate you to input value for the field.`;
      return label
    }
  },
};
</script>

<style scoped>
.varbox {
  position: fixed;
  z-index: 99;
}

.bg {
  background: linear-gradient(0.35turn, gray, lightgreen) center top no-repeat fixed;
}

.container {
  display: flex;
  justify-content: center;
}

.container div {
  margin-top: 2vh;
  margin-bottom: 2vh;
  width: 38svw;
  display: flex;
  flex-wrap: wrap;
  display: flex;
  justify-content: center;
}

.graph {
  opacity: 0.88;
  padding: 15px;
  border: 3px solid green;
  background-color: white;
  transition: box-shadow 0.2s ease-in-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.graph:hover {
  opacity: 1;
  box-shadow: 0 5px 45px rgba(0, 0, 0, 0.45);
}

.endbutton {
  padding-bottom: 5px;
  display: flex;
  justify-content: center;
}

p {
  color: black;
  text-align: center;
}
</style>

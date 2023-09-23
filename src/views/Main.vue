<template>
  <div class="bg">
    <div class="varbox">
      <infoTag style="position: fixed; top: 55px; left: 15vw; margin - top: -38px;">
        <span v-html="variablesInfoText.outerHTML"></span>
      </infoTag>
      <var-box :variables="variables" app density="compact"></var-box>
    </div>
    <div>
      <div class="container" v-for="  variable   in        variables       " :key="variable.varname">
        <div class="graph" :id="'input-graph-' + variable.index" @mouseleave="this.ifToShowDialog(variable)">
          <!-- <p>{{ variable.value }}</p> -->
          <infoTag style="position: absolute; width:10px; margin-left: 32%; margin-top: 2px;">{{ variable.decription }}
          </infoTag>
          <HistogramC2 :labelsInp="variable.labels" :unitTickMove="variable.unitTickMove" :dataInp="variable.data"
            :dataName="variable.varname" :unit="variable.unit"
            @update:value="(newValue) => this.updateVariableValue(variable, newValue)" :value="variable.value"
            :scaleLog="variable.log">
          </HistogramC2>
          <div v-if="variable.categ">
            <BinaryButtons :labels="variable.labels"
              @update:value="(newValue) => this.updateVariableValue(variable, newValue)" :value="variable.value"
              :thrs="variable.thrs">
            </BinaryButtons>
          </div>
          <div v-else>
            <MySlider :label95q-lower="variable.alert_low" :label95q-upper="variable.alert_high" :minim="variable.min"
              :categorial="variable.categ" :value="variable.value" :observedMin="variable.observed_min"
              :observedMax="variable.observed_max" :unitTickMove="variable.unitTickMove"
              v-on:update:value="(newValue) => this.updateVariableValue(variable, newValue)">
            </MySlider>
          </div>
        </div>
        <check-range-dialog-vue :visibility="variable.dialogVisible" :valueData="variable.value"
          :observedMax="variable.observed_max" :observedMin="variable.observed_min"
          @update:checked="(response) => { this.toggleDialogVisibility(variable, response) }"
          :variableName="variable.varname"></check-range-dialog-vue>
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
import jsonData from "../json/pats_json_thrs_percentages.json";
import MySlider from "../components/Slider.vue";
import BinaryButtons from "@/components/BinaryButtons.vue";
import VarBox from "../components/varInfoBox.vue";
import infoTag from "../components/InfoTag.vue";
import CheckRangeDialogVue from "../components/CheckRangeDialog.vue";
import { ModelWrapper } from "../utils/Model.ts";
export default {
  components: { HistogramC2, MySlider, BinaryButtons, VarBox, infoTag, CheckRangeDialogVue },
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
        value["value"] = -1;
        value["checkedBeforeSubmit"] = false;
        value["dialogVisible"] = false;
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
      this.checkAllVars()
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
    toggleDialogVisibility(variable, response) {
      // this.$emit('update:checked:variable', response)
      if (response) {
        variable.checkedBeforeSubmit = true
      } else {
        variable.checkedBeforeSubmit = false
      }
      variable.dialogVisible = false
    },
    ifToShowDialog(variable) {
      // If the variable is unchecked or was evaluated to be checked again
      if (!variable.checkedBeforeSubmit) {
        // If the value set has already been confirmed, then do not ask again for the confirmation
        if (variable.value > variable.observed_max || variable.value < variable.observed_min && variable.value != -1) {
          variable.dialogVisible = true;
          variable.checkedBeforeSubmit = false
        } else {
          variable.checkedBeforeSubmit = true
        }
      }
    },
    updateVariableValue(variable, newValue) {
      variable.value = newValue;
      variable.checkedBeforeSubmit = false;
    },
    checkAllVars() {
      this.variables.forEach(variable => {
        if (!variable.checkedBeforeSubmit) {
          console.log("variable is wrong ", variable.varname)
          variable.dialogVisible = true
        } else {
          console.log("variable: ", variable.varname, " is checked and correct")
        }
      })
    }
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
      // Method that enables visibility of the SUBMIT button. Each value MUST be set.
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
  watch: {

  }
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

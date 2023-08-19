<template>
  <Bar :data="passData" :options="passOptions" v-model="valueData" />
</template>

<script>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export default {
  name: "HistogramC",
  components: { Bar },
  data() {
    return {
      // TODO - ono to nebude cislo ked nacitam z JSON a nastavim na null, problem, nastavit na -1????
      // TODO - na zaciatku problem kliknut na NO ale na YES to berie
      valueData: Number(this.value),
      labelDataVals: this.dataInp,
    };
  },
  props: {
    labelsInp: {
      Array,
      required: true,
    },
    dataInp: {
      Array,
      required: true,
    },
    dataName: {
      String,
      require: true,
    },
    value: {
      default: "",
    },
    unit: {
      default: "",
      require: false,
    }
  },
  methods: {
    handleChartClick(event, elements, labelsInp) {
      if (elements.length > 0) {
        const clickedBarIndex = elements[0].index;
        // For example, emit an event or update a variable in the parent component
        this.handleBarClick(clickedBarIndex, labelsInp.data.labels);
      }
    },
    handleBarClick(index, labelData) {
      // Handle the bar click event here
      if (labelData.length == 2) {
        console.log("it is categorical")
        let val = labelData[index];
        console.log(val, " value")
        if (val == "NO" || val == "MALE") {
          this.valueData = 0;
          console.log(this.valueData);
        } else if (val == "YES" || val == "FEMALE") {
          this.valueData = 1;
          console.log(this.valueData);
        }
      } else {
        let upval = labelData[index].split("=")[1];
        let downval = labelData[index].split("<")[0];
        console.log(downval);
        console.log(upval);
        console.log(typeof this.valueData)
        if (
          this.valueData == "" ||
          this.valueData >= upval ||
          this.valueData <= downval
        ) {
          console.log("Prepisujem")
          this.valueData = Number(
            (Number.parseFloat(upval) + Number.parseFloat(downval)) / 2
          ).toFixed(1);
        }

        // console.log("this is this.valuedata po prepisani: " + this.valueData)
        // console.log("Clicked bar index:", index);
        console.log("value set on ", this.valueData);
      }
    },
  },
  computed: {
    passData() {
      return {
        labels: this.labelsInp,
        datasets: [
          {
            data: this.dataInp,
            label: "observed count",
            barPercentage: 1, //aligns bars next to each other
            categoryPercentage: 1, //aligns bars next to each other
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            minBarLength: 5,
            borderColor: "rgba(0, 0, 0)",
            borderWidth: 1,
            hoverBackgroundColor: "#013519",
            hoverBorderColor: "rgba(0, 0, 0)",
            hoverBorderWidth: 5,
            hoverBorderRadius: 1,
          },
        ],
      };
    },
    passOptions() {
      return {
        // this will be passed as one object in the attribute options
        scales: {
          x: {
            display: true,
            ticks: {
              callback: function (value, index, ticks) {
                // return this.getLabelForValue(value)
                const label = this.getLabelForValue(value).toString();
                const num1 = label.split("<")[0];
                return num1;
              },
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.dataName + "  " + this.unit,
            padding: {
              top: 10,
              bottom: 10,
            },
            font: {
              weight: "bold",
              size: 14,
              family: "Helvetica",
            },
          },
        },
        responsive: true,
        onClick: this.handleChartClick,
      };
    },
  },
  watch: {
    valueData: {
      handler(val, oldVal) {
        console.log("   Hodnota valueDataje zmenena z " + oldVal + " na hodnotu " + val)
        this.$emit("update:value", val);
      },
    },
    value: {
      handler(val, oldVal) {
        // console.log("Hodnota vstupneho propu je zmenena z " + oldVal + " na hodnotu " + val)
        this.valueData = Number(val)
      }
    }
  },
};
</script>
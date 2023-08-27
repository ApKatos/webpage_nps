<template>
  <Bar ref="histChart" :data="passData" :options="passOptions" v-model="valueData" />
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
  LogarithmicScale
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  LogarithmicScale
);

export default {
  name: "HistogramC",
  components: { Bar },
  data() {
    return {
      valueData: Number(this.value),
      labelDataVals: this.dataInp,
      highlightenedIndex: -1,
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
    },
    scaleLog: {
      default: false
    },
    unitTickMove: {
      Number,
      default: 0.1,
    }
  },
  methods: {
    setHighlightBarIndexByValue(value) {
      if (this.labelsInp.length == 2) {
        if (value == "MALE" || value == "0")
          this.highlightenedIndex = 0
        else if (value = "FEMALE" || value == "1")
          this.highlightenedIndex = 1
      } else {
        for (let i = 0; i < this.labelsInp.length; i++) {
          const vals = this.labelsInp[i].split("<x<=")
          if (value > vals[0] && value <= vals[1]) {
            this.highlightenedIndex = i
          }
        }
      }
    },
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
        let val = labelData[index];
        if (val == "NO" || val == "MALE") {
          this.valueData = 0;
        } else if (val == "YES" || val == "FEMALE") {
          this.valueData = 1;
        }
      } else {
        let upval = labelData[index].split("=")[1];
        let downval = labelData[index].split("<")[0];
        if (
          this.valueData == "" ||
          this.valueData >= upval ||
          this.valueData <= downval
        ) {
          this.valueData =
            ((Number.parseFloat(upval) + Number.parseFloat(downval)) / 2).toFixed(this.roundSensitivity);
        }
      }
    },
  },
  computed: {
    backgroundColorArr() {
      let arr = Array(this.labelsInp.length).fill("rgba(0, 0, 0, 0.4)")
      if (this.highlightenedIndex == -1) {
        return arr
      } else {
        arr[this.highlightenedIndex] = "#013519"
        return arr
      }
    },
    passData() {
      return {
        labels: this.labelsInp,
        datasets: [
          {
            data: this.dataInp,
            label: "observed count",
            barPercentage: 1, //aligns bars next to each other
            categoryPercentage: 1, //aligns bars next to each other
            backgroundColor: this.backgroundColorArr,
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
            gridLines: {
              display: false
            },
            display: true,
            ticks: {
              callback: function (value, index, ticks) {
                const label = this.getLabelForValue(value).toString();
                const num1 = label.split("<")[0];
                return num1;
              },
              font: {
                family: "Helvetica",
                size: 11,
                style: 'initial',
              },
              align: 'end',
              labelOffset:-10,
                // crossAlign: 'far',
                // autoSkip: false,
                autoSkipPadding: 3, // minimum distance between ticks deciding how many will be skipped
              maxRotation: 75,
              minRotation: 0,
            },
          },
          y: {
            type: this.yScaleType,
            display: true,
            title: {
              display: true,
              text: 'Number of patients',
              font: {
                size: 11,
                family: "Helvetica"
              }
            },
            ticks: {
              font: {
                family: "Helvetica",
                size: 11,
                style: 'initial',
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
    yScaleType() {
      if (this.scaleLog == true) {
        return "logarithmic"
      } else if (this.scaleLog == false) {
        return "linear"
      }
    },
    roundSensitivity() {
      return Math.log10(1 / this.unitTickMove)
    }
  },
  watch: {
    valueData: {
      handler(val, oldVal) {
        this.$emit("update:value", val);
        this.setHighlightBarIndexByValue(val);
      },
    },
    value: {
      handler(val, oldVal) {
        this.valueData = Number(val)
      }
    }
  },
};
</script>
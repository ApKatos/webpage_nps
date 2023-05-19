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
      // valueData: this.value,
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
  },
  methods: {
    handleChartClick(event, elements, labelsInp) {
      if (elements.length > 0) {
        const clickedBarIndex = elements[0].index;
        // Perform your desired action with the clicked bar index
        // For example, emit an event or update a variable in the parent component
        this.handleBarClick(clickedBarIndex, labelsInp.data.labels);
      }
    },
    handleBarClick(index, labelData) {
      // Handle the bar click event here
      if (labelData.length == 2) {
        let val = labelData[index];
        if (val == "NO") {
          this.valueData = 0;
          console.log(this.valueData);
        } else if (val == "YES") {
          this.valueData = 1;
          console.log(this.valueData);
        }
        console.log(val);
        console.log(this.valueData);
      } else {
        let upval = labelData[index].split("=")[1];
        console.log(upval);
        let downval = labelData[index].split("<")[0];
        console.log(downval);

        if (
          this.valueData == "" ||
          this.valueData > upval ||
          this.valueData <= downval
        ) {
          this.valueData = Number(
            (Number.parseFloat(upval) + Number.parseFloat(downval)) / 2
          ).toFixed(1);
        }
        console.log("Clicked bar index:", index);
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
            // inflateAmount: 1,
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
          // y: {
          //   display: true,
          //   type: 'logarithmic',
          // }
        },
        plugins: {
          title: {
            display: true,
            text: this.dataName,
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
    valueData: {
      get() {
        return this.value; // Set the selected value based on the prop value
      },
      set(newValue) {
        this.$emit("update:value", newValue); // Emit the updated value to the parent component
      },
    },
  },
  watch: {
    valueData: {
      handler(val) {
        this.$emit("update:value", val);
      },
    },
  },
};
</script>
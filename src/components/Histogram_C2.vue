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
      // valueData: Number(this.value),
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
          // The assignation into interval that looks like x1<=x<x2 !!
          const vals = this.labelsInp[i].split("<=x<")
          if (value >= vals[0] && value < vals[1]) {
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
        // interval is in this form x1<=x<x2
        let upval = labelData[index].split("<")[2];
        let downval = labelData[index].split("<")[0];
        if (
          this.valueData == -1 ||
          this.valueData >= upval ||
          this.valueData <= downval
        ) {
          this.valueData =
            ((Number.parseFloat(upval) + Number.parseFloat(downval)) / 2);
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
            data: this.dataInp, // Those are labels to be used on string axis - represented as strings x1<x2<=x3
            label: "Percentage",
            barPercentage: 1, //aligns bars next to each other
            categoryPercentage: 1, //aligns bars next to each other
            backgroundColor: this.backgroundColorArr, // uses computed property to highlight where actual value belongs
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
            // type: this.ScaleType,
            gridLines: {
              display: false
            },

            display: true,
            ticks: {
              callback: function (value, index, ticks) {
                // TODO probably look at this so that the values can be logarithmically set
                // The labels are in form x1<=x2<x3
                const label = this.getLabelForValue(value).toString();

                // After splitting the label by expected char
                // variable numOfSplittedItems serves as indicator of categorical variable
                // categ variables have only YES/NO, MALE/FEMALE options (result of split of size 1)
                const splittedItems = label.split("<")
                const numOfSplittedItems = splittedItems.length

                let labelToUse = splittedItems[0];

                if (numOfSplittedItems == 1)
                  return labelToUse;
                else {
                  return Number(labelToUse)
                }
              },
              font: {
                family: "Helvetica",
                size: 11,
                style: 'initial',
              },
              align: 'end',
              labelOffset: -30, //shifting of x labels - TODO - https://jsfiddle.net/Syncd/8z6rm9ck/
              autoSkipPadding: 3, // minimum distance between ticks deciding how many will be skipped
              maxRotation: 75,
              minRotation: 0,
            },
          },
          y: {
            min: 0,
            max: 100,// Your absolute max value

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
              callback: function (value) {
                return (value).toFixed(0) + '%'; // convert it to percentage
              },
              font: {
                family: "Helvetica",
                size: 11,
                style: 'initial',
              },
            },
          },
        },
        plugins: {
          customBars: {
            width: 100, // Adjust the width of bars as needed
          },
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
          tooltip: {
            enabled: true,
            callbacks: {
              // label: (tooltipItem) => `Percentage: ${tooltipItem.parsed.y}%`
              label: (items) => `${items.parsed.y}%`,
              // title: (items) => {
              //   console.log(items)
              // }
            }
          }
        },
        responsive: true,
        onClick: this.handleChartClick,
      };
    },
    ScaleType() {
      if (this.scaleLog == true) {
        return "logarithmic"
      } else if (this.scaleLog == false) {
        return "category"
      }
    },
    valueData: {
      get() {
        return Number(this.value);
      },
      set(newValue) {
        this.$emit('update:value', newValue);
        this.setHighlightBarIndexByValue(newValue);
      },
    },
  },
  watch: {
    valueData: {
      handler(val, oldVal) {
        this.setHighlightBarIndexByValue(val)
        // this.setHighlightBarIndexByValue(val);
      },
    },
  },
};
</script>
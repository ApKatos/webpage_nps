<template>
  <v-card style="padding: 20px 0px 0px 0px; width: calc(100% - 18px);">

    <v-slider v-model="valueData" :step=this.unitTickMove density='compact' :color="color" thumb-size=7
      thumb-label="always" :min="minim" :max="observedMax">

      <template v-slot:thumb-label="{ modelValue }">
        {{ modelValue=valueData }}
      </template>

      <template v-slot:prepend>
        <v-btn size="small" variant="text" icon="mdi-minus" color="red" @mousedown="startDecrement"
          @mouseup="stopDecrement()" @mouseleave="stopDecrement()"></v-btn>
      </template>

      <template v-slot:append>
        <v-btn size="small" variant="text" icon="mdi-plus" color="green" @mousedown="startIncrement"
          @mouseup="stopIncrement()" @mouseleave="stopIncrement()"></v-btn>
      </template>

    </v-slider>
  </v-card>
</template>

<script>
import CheckRangeDialogVue from './CheckRangeDialog.vue';
export default {
  components: { CheckRangeDialogVue },
  data() {
    return {
      isTouchActive: false,
      incrementInterval: null,
      decrementInterval: null,
      incrementSpeed: 300, // Initial interval
      decrementSpeed: 300,  // Initial interval
      dialogVisible: false, // Controls dialog visibility
    }
  },
  props: {
    minim: {
      Number,
      required: true,
    },
    label95qLower: {
      Number,
      required: true,
    },
    label95qUpper: {
      Number,
      required: true,
    },
    value: {
      // default: "",
      Number,
      required: true,
    },
    unitTickMove: {
      Number,
      default: 0.1,
    },
    observedMin: {
      Number,
      required: false
    },
    observedMax: {
      Number: false
    },
  },
  methods: {
    startIncrement() {
      this.incrementSpeed = 300; // Reset speed
      this.incrementValue();
    },
    stopIncrement() {
      clearInterval(this.incrementInterval);
    },
    incrementValue() {
      this.valueData += this.unitTickMove;
      this.incrementSpeed = Math.max(20, this.incrementSpeed - 20); // Speed up
      this.incrementInterval = setTimeout(this.incrementValue, this.incrementSpeed);
    },


    startDecrement() {
      this.decrementSpeed = 300; // Reset speed
      this.decrementValue();
    },
    stopDecrement() {
      clearInterval(this.decrementInterval);
    },
    decrementValue() {
      this.valueData -= this.unitTickMove;
      this.decrementSpeed = Math.max(20, this.decrementSpeed - 20); // Speed up
      this.decrementInterval = setTimeout(this.decrementValue, this.decrementSpeed);
    },
  },
  computed: {
    valueData: {
      get() {
        return Number(this.value);
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      },
    },
    color: function () {
      if (this.valueData != -1 && this.valueData < this.observedMin / this.$warningOnMultiple || this.valueData > this.observedMax * this.$warningOnMultiple) {
        return this.colorUnobserved
      } else if (this.valueData != -1 && (this.valueData <= this.label95qLower || this.valueData >= this.label95qUpper)) {
        return this.colorWarn
      } else if (this.valueData != -1 && this.valueData < this.label95qUpper && this.valueData > this.label95qLower) {
        return this.colorFine
      } else {
        return "#a9a9a9"
      }
    },
    colorWarn: {
      get() {
        return "#D3A350"
      }
    },
    colorFine: {
      get() {
        return "#2AA63D"
      }
    },
    colorUnobserved: {
      get() {
        return "rgb(219, 29, 15)"
      }
    },
  },
};
</script>

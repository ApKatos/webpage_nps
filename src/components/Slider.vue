<template>
  <v-card style="padding: 20px 0px 0px 0px; width: calc(100% - 18px);">

    <v-slider v-model="valueData" step=0.1 density='compact' :color="color" thumb-size=10 thumb-label="always" hight=70
      :min="minim" :max="maxim">

      <template v-slot:prepend>
        <v-btn size="small" variant="text" icon="mdi-minus" color="red" @mousedown="startDecrement"
          @mouseup="stopDecrement" @mouseleave="stopDecrement" @touchstart="startDecrement" @touchend="stopDecrement"
          @touchmove="stopDecrement" @touchcancel="stopDecrement"></v-btn>
      </template>

      <template v-slot:append>
        <v-btn size="small" variant="text" icon="mdi-plus" color="green" @mousedown="startIncrement"
          @mouseup="stopIncrement" @mouseleave="stopIncrement" @touchstart="startIncrement" @touchend="stopIncrement"
          @touchup="stopIncrement" @touchcancel="stopIncrement"></v-btn>
      </template>

    </v-slider>

  </v-card>
</template>

<script>
export default {
  data() {
    return {
      valueData: this.value,
      color: "#a9a9a9",
      isIncrementing: false,
      isDecrementing: false,
    }
  },
  props: {
    minim: {
      Number,
      required: true,
    },
    maxim: {
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
      default: "",
    }
  },
  methods: {
    startIncrement() {
      this.isIncrementing = true;
      this.incrementValue();
    },
    stopIncrement() {
      this.isIncrementing = false;
    },
    incrementValue() {
      if (this.isIncrementing) {
        this.valueData++;
        setTimeout(this.incrementValue, 200); // Adjust the interval as needed
      }
    },

    startDecrement() {
      this.isDecrementing = true;
      this.decrementValue();
    },
    stopDecrement() {
      this.isDecrementing = false;
    },
    decrementValue() {
      if (this.isDecrementing) {
        this.valueData--;
        setTimeout(this.decrementValue, 200); // Adjust the interval as needed
      }
    }
  },
  computed: {
    colorWarn: {
      get() {
        return "#D3A350"
      }
    },
    colorFine: {
      get() {
        return "#2AA63D"
      }
    }

  },
  watch: {
    valueData: {
      handler(val) {
        this.$emit('update:value', val)
        if (val != null && (val <= this.label95qLower || val >= this.label95qUpper)) {
          this.color = this.colorWarn
        } else if (val != null && val < this.label95qUpper && val > this.label95qLower) {
          this.color = this.colorFine
        }
      }
    },
    value: {
      handler(val, oldVal) {
        this.valueData = Number(val).toFixed(1);
      }
    }

  }
};
</script>

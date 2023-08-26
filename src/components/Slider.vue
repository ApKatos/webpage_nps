<template>
  <v-card style="padding: 20px 0px 0px 0px; width: calc(100% - 18px);">

    <v-slider v-model="valueData" step=0.1 density='compact' :color="color" thumb-size=10 thumb-label="always" hight=70
      :min="minim" :max="maxim">

      <template v-slot:prepend>
        <v-btn size="small" variant="text" icon="mdi-minus" color="red" @click="decrementValue"
          @touchstart="startTouchDecrement" ></v-btn>
      </template>

      <template v-slot:append>
        <v-btn size="small" variant="text" icon="mdi-plus" color="green" @click="incrementValue"
          @touchstart="startTouchIncrement"></v-btn>
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
      isTouchActive: false,
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
    },
    unitTickMove: {
      Number,
      default: 0.1,
    }
  },
  methods: {

    incrementValue() {
      if (this.valueData < this.maxim) {
        this.valueData = this.valueData + this.unitTickMove;
      }
    },

    decrementValue() {
      if (this.valueData > this.minim) {
        this.valueData = this.valueData - this.unitTickMove;
      }
    },


    startTouchIncrement(event) {
      event.preventDefault();
      this.valueData += this.unitTickMove;
    },

    startTouchDecrement(event) {
      event.preventDefault();
      this.valueData -= this.unitTickMove;
    },

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
        if (val != -1 && (val <= this.label95qLower || val >= this.label95qUpper)) {
          this.color = this.colorWarn
        } else if (val != -1 && val < this.label95qUpper && val > this.label95qLower) {
          this.color = this.colorFine
        }
      }
    },
    value: {
      handler(val, oldVal) {
        let numOfDecimals;
        if (this.unitTickMove == 1.0) {
          numOfDecimals = 0
        } else if (this.unitTickMove == 0.1) {
          numOfDecimals = 1
        } else {
          numOfDecimals = 2
        }
        this.valueData = parseFloat(Number(val).toFixed(numOfDecimals));
        if (this.valueData < this.minim) {
          this.valueData = this.minim
        } else if (this.valueData > this.maxim) {
          this.valueData = this.maxim
        }
      }
    }

  }
};
</script>

<template>
  <div class="d-flex flex-column">
    <v-card width=600px style="padding: 20px 0px 0px 0px">
      <div>

        <v-slider v-model="valueData" step=0.1 density='compact' :color="color" thumb-size=10 thumb-label="always"
          hight=50 :max="maxim" :min="minim">

          <template v-slot:prepend>
            <v-btn size="small" variant="text" icon="mdi-minus" color="red" @click="decrement(1)"
              @dblclick="decrement(10)" @mousedown="startDecrement()" @mouseup="stopDecrement" @mouseleave="stopDecrement"></v-btn>
          </template>

          <!-- BUTTON 2 -->
          <template v-slot:append>
            <v-btn size="small" variant="text" icon="mdi-plus" color="green" @click="increment(1)"
              @dblclick="increment(10)"  @mousedown="startIncrement()" @mouseup="stopIncrement" @mouseleave="stopIncrement"></v-btn>
          </template>

        </v-slider>

      </div>
    </v-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // valueData: this.value,
      // clickTimeout: null, //https://blog.logrocket.com/building-a-long-press-directive-in-vue-3408d60fb511/
      color: "#a9a9a9",
      incrementInterval: null, // Variable to hold the interval ID
      decrementInterval: null // Variable to hold the interval ID
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
    increment(times) {
      this.valueData = Number((this.valueData + (0.1*times)).toFixed(1));
    },
    decrement(times) {
      this.valueData = Math.max(0, Number((this.valueData - (0.1 * times)).toFixed(1)));
    },
    startIncrement() {
      this.incrementInterval = setInterval(() => {
        this.increment(10); // Increment the variable value
      }, 50); // Adjust the interval duration as per your preference
    },
    stopIncrement() {
      clearInterval(this.incrementInterval); // Stop the increment when the button is released or the cursor leaves the button area
      this.incrementInterval = null;
    },
    startDecrement() {
      this.decrementInterval = setInterval(() => {
        this.decrement(10); // Increment the variable value
      }, 50); // Adjust the interval duration as per your preference
    },
    stopDecrement() {
      clearInterval(this.decrementInterval); // Stop the increment when the button is released or the cursor leaves the button area
      this.decrementInterval = null;
    },
  },
  computed: {
    valueData: {
      get() {
        return this.value; // Set the selected value based on the prop value
      },
      set(newValue) {
        this.$emit('update:value', newValue); // Emit the updated value to the parent component
      },
    },
    colorWarn: {
      get() {
        return "#FF8000"
      }
    },
    colorFine: {
      get() {
        return "#a9a9a9"
      }
    }

  },
  watch: {
    valueData: {
      handler(val) {
        this.$emit('update:value', val)

        // ASI TO JE POMALE KED JE TO TU STALE
        if (val != null && (val <= this.label95qLower || val >= this.label95qUpper)) {
          this.color = this.colorWarn
        } else if (val != null && val < this.label95qUpper && val > this.label95qLower) {
          this.color = this.colorFine
        }
      }
    },
  }
};
</script>

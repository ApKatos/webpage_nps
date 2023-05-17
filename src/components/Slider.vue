<template>
  <div class="d-flex flex-column">
    <v-card width=600px style="padding: 20px 0px 0px 0px">
      <div>

        <v-slider v-model="valueData" step=0.1 density='compact' :color="color" thumb-size=10 thumb-label="always"
          hight=50 :max="maxim" :min="minim">

          <template v-slot:prepend>
            <v-btn size="small" variant="text" icon="mdi-minus" color="red" @click="decrement"
              @dblclick="this.valueData--"></v-btn>
          </template>

          <!-- BUTTON 2 -->
          <template v-slot:append>
            <v-btn size="small" variant="text" icon="mdi-plus" color="green" @click="increment"
              @dblclick="this.valueData++"></v-btn>
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
    increment() {
      this.valueData = Number((this.valueData + 0.1).toFixed(1));
    },
    decrement() {
      this.valueData = Number((this.valueData - 0.1).toFixed(1));
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
    color1: {
      get() {
        return "#FF8000"
      }
    },
    color2: {
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
          this.color = this.color1
        } else if (val != null && val < this.label95qUpper && val > this.label95qLower) {
          this.color = this.color2
        }
      }
    },
  }
};
</script>

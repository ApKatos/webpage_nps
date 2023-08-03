<template>
  <div class="container">
    <h1>Welcome to the Network Phenotyping Strategy</h1>
    <div class="child" v-show="open">
      <warning @closingWarning="this.open = false"></warning>
    </div>
    <div class="child">
      <v-btn to="main" :disabled="open" center> START </v-btn>
    </div>
  </div>
</template>

<script>
import warning from "../components/WarnUser.vue";

export default {
  components: { warning },
  data() {
    return {
      open: true,
    };
  },
};
</script>

<style scoped>
/* @keyframes color-transition {
  0% {
    background-color: #ff0000;
  }

  50% {
    background-color: #00ff00;
  }

  100% {
    background-color: #0000ff;
  }
}

.main {
  animation: color-transition 1s infinite alternate;
} */

.container {
  display: flex;
  /* Use flexbox */
  flex-direction: column;
  /* Stack elements vertically */
  justify-content: center;
  align-items: center;
  height: 100%;

  background-image: linear-gradient(0.35turn, gray, lightgreen);
}

.child {
  padding: 1em;
}

/* .container:hover {
  background-color: linear-gradient(to right, #ff0000, #00ff00, #0000ff);
  ;
} */
</style>

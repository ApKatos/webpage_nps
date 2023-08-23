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
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: linear-gradient(0.35turn, gray, lightgreen);
}

.child {
  padding: 1em;
}
</style>

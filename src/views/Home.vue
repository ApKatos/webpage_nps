<template>
  <div>
    <h1>Welcome to the NPS - network phenotyping strategy</h1>
    <warning @close="open = false" :v-show="open"></warning>
    <v-btn to="main" center> START </v-btn>
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

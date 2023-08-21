<template>
	<div>
		<v-app-bar :elevation="5" border=true color="brown-lighten-5" density="compact">
			<!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
			<!-- <svg-icon @click="$router.push({ name: 'Home' });" type="mdi" :path="path" -->
			<!-- style="margin-left: 1em;cursor: pointer;"></svg-icon> -->
			<v-toolbar-title @mouseover="toolbarTitle = 'Network Phenotyping Strategy'" @mouseleave="toolbarTitle = 'NPS'"
				style="cursor: pointer; font-weight: bold;" @click="$router.push({ name: 'Home' });">{{
					toolbarTitle }}</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn v-if="$route.name != 'Home'" @click="callMainPage()" elevation=5 color="black">NEW PATIENT</v-btn>
		</v-app-bar>
	</div>
</template>

<script lang="ts">

export default {
	data: () => ({
		toolbarTitle: "NPS",
	}),
	methods: {
		callMainPage() {
			if (this.$route.name === 'Main') {
				this.$router.go(0)
			} else {
				this.$router.push({ name: 'Main' })
			}
		}
	},
};
</script>
<template>
	<div>
		<v-app-bar :elevation="5" border=true color="brown-lighten-5" density="compact">
			<!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
			<svg-icon @click="$router.push({ name: 'Home' });" type="mdi" :path="path" style="margin-left: 1em;cursor: pointer;"></svg-icon>
			<v-toolbar-title @mouseover="toolbarTitle = 'Network Phenotyping Strategy'" @mouseleave="toolbarTitle = 'NPS'"
				style="cursor: pointer; font-weight: bold;" @click="$router.push({ name: 'Home' });">{{
					toolbarTitle }}</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn v-if="$route.name != 'Home'" @click="callMainPage()" elevation=5 color="black">NEW PATIENT</v-btn>
		</v-app-bar>

		<!-- <v-navigation-drawer v-model="drawer" location="top" temporary>
			<v-list :items="items"></v-list>
			<v-select label="Select language" :items="['English', 'Turkey']" variant="solo">
			</v-select>
		</v-navigation-drawer> -->
	</div>
</template>

<script lang="ts">
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiPulse } from '@mdi/js'

export default {
	components: {
		SvgIcon
	},
	data: () => ({
		drawer: false,
		group: null,
		toolbarTitle: "NPS",
		path: mdiPulse,
		items: [
			{
				title: "Foo",
				value: "foo",
			}
		],
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

	watch: {
		group() {
			this.drawer = false;
		},
	},


};
</script>
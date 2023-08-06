<template>
	<div>
		<v-app-bar color="grey" density="compact">
			<!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
			<svg-icon type="mdi" :path="path"></svg-icon>
			<v-toolbar-title @mouseover="toolbarTitle = 'Network Phenotyping Strategy'" @mouseleave="toolbarTitle = 'NPS'"
				style="cursor: pointer;" @click="$router.push({ name: 'Home' });">{{
					toolbarTitle }}</v-toolbar-title>
			<v-label clickable @click="callMainPage" text="NEW PATIENT"></v-label>
			<!-- //TODO treba vyriesit ze nieco ako reset toho mainu ked som na maine   -->
			<v-spacer></v-spacer>
			<!-- <v-btn variant="text" icon="mdi-cog" @click.stop="drawer = !drawer"></v-btn> -->
			<!-- <v-btn variant="text" icon="mdi-dots-vertical"></v-btn> -->
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
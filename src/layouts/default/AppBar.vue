<template>
	<div>
		<v-app-bar color="grey" density="compact">
			<v-app-bar-nav-icon></v-app-bar-nav-icon>
			<v-toolbar-title>NPS</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn variant="text" icon="mdi-cog" @click.stop="drawer = !drawer"></v-btn>
			<v-btn variant="text" icon="mdi-dots-vertical"></v-btn>

		</v-app-bar>

		<!-- <v-card class="information-box" outlined></v-card> -->

		<v-navigation-drawer v-model="drawer" location="top" temporary>
			<v-list :items="items"></v-list>
			<v-select 
				label="Select"
				:items="['EN', 'CZ', 'SK', 'Georgia', 'Texas', 'Wyoming']"
				variant="solo" >
			</v-select>
		</v-navigation-drawer>
	</div>
</template>
<!-- v-app-bar(color="grey" prominent) -->
	<!-- v-app-bar-nav-icon  -->
	<!-- v-toolbar-title Network Phenotyping strategy  -->
	<!-- v-spacer -->
	<!-- v-btn(variant="text" icon="mdi-cog" @click.stop="drawer = !drawer")
	v-btn(variant="text" icon="mdi-dots-vertical") -->

<!-- v-card( class="information-box" outlined) -->

<!-- v-navigation-drawer(v-model="drawer" location="top" temporary)
	//- v-list(:items="items")
	v-select(
		label="Select"
  		:items="['EN', 'CZ', 'SK', 'Georgia', 'Texas', 'Wyoming']"
 		variant="solo"
	) -->



<script lang="ts">
export default {
	data: () => ({
		drawer: false,
		group: null,
		items: [
			{
				title: "Foo",
				value: "foo",
			},
			{
				title: "Bar",
				value: "bar",
			},
			{
				title: "Fizz",
				value: "fizz",
			},
			{
				title: "Buzz",
				value: "buzz",
			},
		],
	}),

	watch: {
		group() {
			this.drawer = false;
		},
	},


};
</script>
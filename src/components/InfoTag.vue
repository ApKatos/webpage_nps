<!-- <template>
    <div class="tag" @mouseover="hover = true" @mouseleave="hover = false">
        <v-icon class="tag-icon" color="black" icon="mdi-information" size="large">
        </v-icon>
        <div class="tag-text" v-show="hover" :class="positionClass">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            hover: false,
            displayOnTop: false,
            displayOnLeft: false,
            positionClass: "",
        };
    },
    computed: {

    },
    methods: {
        updateTagPosition() {

            const tagText = this.$el.querySelector(".tag-text");
            // const tagText = this.$refs.tagText
            const tagIcon = this.$el.querySelector(".tag-icon");
            // const tagIcon = this.$refs.tagIcon

            if (tagText && tagIcon) {
                const iconRect = tagIcon.getBoundingClientRect();
                const textRect = tagText.getBoundingClientRect();

                this.displayOnTop = (iconRect.top - window.innerHeight + 250) > window.innerHeight;
                this.displayOnLeft = iconRect.right > (window.innerWidth - (textRect.right - textRect.left));

                // console.log(this.displayOnTop);
                console.log(window.innerHeight)
                console.log(textRect.innerHeight)
                console.log(iconRect.top)

                if (this.displayOnTop)
                    this.positionClass = "tag-text-top";
                else if (this.displayOnLeft && !this.displayOnTop)
                    this.positionClass = "tag-text-left";
                else if (!this.displayOnLeft && !this.displayOnTop)
                    this.positionClass = "tag-text-right";
            }
        },
        calculateInitialPosition() {
            const tagIcon = this.$refs.tagIcon;
            if (tagIcon) {
                this.$nextTick(() => {
                    const iconRect = tagIcon.getBoundingClientRect();
                    const tagText = this.$refs.tagText
                    if (tagText) {
                        const textRect = tagText.getBoundingClientRect();
                        this.displayOnTop = (window.innerHeight + 250) > window.innerHeight;
                        this.displayOnLeft = iconRect.right > (window.innerWidth - (textRect.right - textRect.left));
                    }
                });
                if (this.displayOnTop)
                    this.positionClass = "tag-text-top";
                else if (this.displayOnLeft && !this.displayOnTop)
                    this.positionClass = "tag-text-left";
                else if (!this.displayOnLeft && !this.displayOnTop)
                    this.positionClass = "tag-text-right";
            }
        }
    },
    watch: {
        hover: "updateTagPosition",
    },
    beforeMount() { this.calculateInitialPosition(); },
    mounted() {

        // this.updateTagPosition(); // Call this method once to set initial position
        window.addEventListener("resize", this.updateTagPosition);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.updateTagPosition);
    },
}
</script>

<style scoped>
.tag {
    padding: 5px;
    display: inline-flex;
    position: relative;

}

.tag-icon {
    cursor: pointer;
}

.tag-text {
    position: absolute;
    z-index: 100;
    margin: 15px;
    background: whitesmoke;
    border: solid black;
    border-width: 2px 4px;
    border-radius: 30px;
    white-space: pre-wrap;
    color: black;
    padding: 10px;
    min-width: 262px;
    max-width: 300px;
    text-align: center;
    max-height: 100px;
}

.tag-text-top {
    bottom: calc(100% + 1px);
}

.tag-text-left {
    right: calc(100% + 1px);
    left: auto;
}

.tag-text-right {
    left: calc(100% + 1px);
}
</style> -->

<template>
    <div>
        <v-tooltip>
            <template v-slot:activator="{ props }">
                <!-- <v-btn v-bind=" props"></v-btn> -->
                <v-icon v-bind="props" color="black" class="tag" icon="mdi-information" size="large">
                </v-icon>
            </template>
            <slot></slot>
        </v-tooltip>
    </div>
</template>


<script>
export default {

}
</script>
<style scoped>
.tag {
    padding: 5px;
    display: inline-flex;
    position: relative;
    cursor: pointer;
}
</style>
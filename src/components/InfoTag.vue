<template>
    <div class="tag" @mouseover="hover = true" @mouseleave="hover = false">
        <v-icon class="tag-icon" color="black" icon="mdi-information" size="large">
        </v-icon>
        <div class="tag-text" v-if="hover" :class="tagTextClasses">
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
        };
    },
    computed: {
        tagTextClasses() {
            return {
                "tag-text-top": this.displayOnTop,
                "tag-text-left": this.displayOnLeft && !this.displayOnTop,
                "tag-text-right": !this.displayOnLeft && !this.displayOnTop,
            };
        },
    },
    methods: {
        updateTagPosition() {

            const tagText = this.$el.querySelector(".tag-text");
            const tagIcon = this.$el.querySelector(".tag-icon");
            if (tagText && tagIcon) {
                const iconRect = tagIcon.getBoundingClientRect();
                const textRect = tagText.getBoundingClientRect();

                console.log("text rect: ", textRect)
                this.displayOnTop = iconRect.bottom > (window.innerHeight - (textRect.bottom - textRect.top));
                this.displayOnLeft = iconRect.right > (window.innerWidth - (textRect.right - textRect.left));

                console.log("top: ", this.displayOnTop, " left: ", this.displayOnLeft)
                let newX, newY;

                if (this.displayOnLeft) {
                    newX = iconRect.left - textRect.width - 10;
                    newY = iconRect.top;
                } else if (this.displayOnTop) {
                    newX = iconRect.left;  // Adjusted this line to use iconRect.left
                    newY = iconRect.top - textRect.height - 10;  // Adjusted this line to use iconRect.top minus textRect.height
                } else {
                    newX = iconRect.left;
                    newY = iconRect.bottom + 10;
                }

                tagText.style.left = `${Math.max(0, Math.min(newX, window.innerWidth - textRect.width))}px`;
                tagText.style.top = `${Math.max(0, newY)}px`;
            }
        },
        calculateInitialPosition() {
            const tagIcon = this.$el.querySelector(".tag-icon");
            if (tagIcon) {
                this.$nextTick(() => {
                    const iconRect = tagIcon.getBoundingClientRect();
                    const tagText = this.$el.querySelector(".tag-text");
                    if (tagText) {
                        const textRect = tagText.getBoundingClientRect();
                        this.displayOnTop = iconRect.bottom > (window.innerHeight - (textRect.bottom - textRect.top));
                        this.displayOnLeft = iconRect.right > (window.innerWidth - (textRect.right - textRect.left));
                    }
                });
            }
        }
    },
    watch: {
        hover: "updateTagPosition",
    },
    mounted() {
        this.updateTagPosition(); // Call this method once to set initial position
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
}

.tag-text-top {
    bottom: calc(100% + 10px);
}

.tag-text-left {
    right: calc(100% + 10px);
    left: auto;
}

.tag-text-right {
    left: calc(100% + 10px);
}
</style>

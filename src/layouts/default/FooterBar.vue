<template>
    <v-footer color="grey" density="compact" fixed>
        <div>
            <!-- <v-btn v-for="item in resources" :key="item.obj" class="mx-4" :icon="item.icon" variant="text"></v-btn> -->
            <v-col>
                {{ new Date().getFullYear() }} — <strong>Network phenotyping strategy</strong>
            </v-col>
        </div>
    </v-footer>
</template>
<script>
import { PxArticleMultiple } from "oh-vue-icons/icons";
import { SiSpringCreators } from "oh-vue-icons/icons";
import { RiComputerLine } from "oh-vue-icons/icons";
export default {
    components: { PxArticleMultiple },
    data() {
        return {
            resources: [
                { icon: PxArticleMultiple, obj: "article", value: "https://aacrjournals.org/cancerres/article/70/8_Supplement/2010/562508/Abstract-2010-A-Network-Phenotyping-Strategy-NPS" },
                { icon: SiSpringCreators, obj: "algorithm", value: "Petr Pančoška, Jaroslav Nešetřil" },
                { icon: RiComputerLine, obj: "webpage", value: "Patrícia Sotáková" },
            ]
        }
    }
}
</script>
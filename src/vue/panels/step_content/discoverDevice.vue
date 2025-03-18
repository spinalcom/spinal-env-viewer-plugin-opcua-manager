<template>
    <div class="step_content">
        <div class="initial_state" v-if="state === STATES.initial">
            <md-button class="md-raised md-primary" @click="goToDiscovering"> Discover </md-button>
            <md-button class="md-raised md-accent" @click="goBack"> Back </md-button>
        </div>

        <div class="discovering_state" v-else-if="state === STATES.discovering">
            <md-progress-bar style="width: 100%" md-mode="determinate" :md-value="percent"></md-progress-bar>
            <div class="md-layout md-gutter progress_info">
                <div class="md-layout-item md-alignment-center">Gateway discovered : {{ progress.finished }}</div>
                <div class="md-layout-item md-alignment-center">Gateway failed : {{ progress.failed }}</div>
            </div>
            <md-button class="md-raised md-accent" @click="cancelDiscovering"> Cancel </md-button>
        </div>


        <div v-else-if="state === STATES.error">
            <div class="error_content">
                <div>Something went wrong, please</div>
                <md-button class="md-primary" flat @click="retry">try again</md-button>
                <div>or</div>
                <md-button class="md-accent" flat @click="goBack">go back</md-button>
            </div>
        </div>

        <div v-else-if="state === STATES.pending && asking">
            <div>A previous result for this discovery exists. Would you like to use it?</div>
            <div>
                <md-button class="md-raised md-primary" @click="askResult(CHOICES.yes)">Yes</md-button>
                <md-button class="md-raised md-accent" @click="askResult(CHOICES.no)">No</md-button>
            </div>
        </div>


    </div>
</template>

<script>

import { OPCUA_ORGAN_STATES, OPCUA_ORGAN_USER_CHOICE } from "spinal-model-opcua";
import { TreeViewComponent } from "@syncfusion/ej2-vue-navigations";


export default {
    name: "DiscoverStep",
    components: {
        "ejs-treeview": TreeViewComponent,
    },
    props: {
        stepName: { required: true },
        state: { required: true },
        asking: { required: false, default: false },
        progress: { required: false, default: () => ({ total: 0, finished: 0, failed: 0 }) }
    },
    data() {
        this.STATES = OPCUA_ORGAN_STATES;
        this.CHOICES = OPCUA_ORGAN_USER_CHOICE;

        return {
            checkedNodes: []
        }
    },

    methods: {

        goToDiscovering() {
            this.$emit("discover");
        },

        nextStep() {
            this.$emit("nextStep", this.stepName);
        },

        goBack() {
            this.$emit("goBack", this.stepName);
        },

        cancelDiscovering() {
            this.$emit("cancel");
        },

        retry() {
            this.$emit("retry");
        },

        askResult(useResult) {
            this.$emit("askResult", useResult);
        }
    },
    watch: {
        state(newVal) {
            if (newVal === OPCUA_ORGAN_STATES.discovered) {
                this.nextStep();
            }
        }
    },
    computed: {
        percent() {
            return this.progress.total === 0 ? 0 : ((this.progress.finished + this.progress.failed) / this.progress.total) * 100;
        }
    }
}
</script>

<style scoped>
.error_content {
    display: flex;
    align-items: center;
}

.progress_info {
    width: 100% !important;
    margin: 10px;
}
</style>
<template>
    <div class="step_content">
        <div class="initial_state" v-if="state === STATES.initial">
            <md-button class="md-raised md-primary" @click="goToDiscovering"> Discover </md-button>
            <md-button class="md-raised md-accent" @click="goBack"> Back </md-button>
        </div>

        <div class="discovering_state" v-else-if="state === STATES.discovering">
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
            <md-button class="md-raised md-accent" @click="cancelDiscovering"> Cancel </md-button>
        </div>

        <div class="discovered_state" v-else-if="state === STATES.discovered">
            <div class="control_wrapper">
                <v-treeview dark selectable open-on-click hoverable transition item-text="displayName" item-key="nodeId"
                    selected-color="primary" v-model="checkedNodes" :items="treeFields.children">
                </v-treeview>
            </div>

            <div>
                <md-button class="md-raised md-primary" @click="nextStep"
                    :disabled="checkedNodes.length === 0">Next</md-button>
                <md-button class="md-raised md-accent" @click="goBack"> Back </md-button>
            </div>
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


        <!-- <div class="disocered_content"></div> -->
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
        treeFields: { required: true },
        asking: { required: false, default: false }
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
            this.$emit("nextStep", { stepName: this.stepName, checkedNodes: this.checkedNodes });
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
    }
}
</script>

<style scoped>
.error_content {
    display: flex;
    align-items: center;
}
</style>
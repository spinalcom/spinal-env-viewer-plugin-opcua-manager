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
              <!-- <ejs-treeview id='treeview' :fields="treeFields" :showCheckBox='true' :checkedNodes='checkedNodes'></ejs-treeview> -->

              <v-treeview
                dark
                selectable
                open-on-click
                hoverable
                transition
                item-text="displayName"
                item-key="nodeId"
                selected-color="primary"
                v-model="checkedNodes"
                :items="treeFields.children"
              ></v-treeview>
            </div>

            <div>
              <md-button
                class="md-raised md-primary"
                @click="nextStep" :disabled="checkedNodes.length === 0">Next</md-button>
              <md-button
                class="md-raised md-accent"
                @click="goBack"> Back </md-button>
            </div>
          </div>
          <!-- <div class="disocered_content"></div> -->
    </div>
</template>

<script>

import { OPCUA_ORGAN_STATES } from "spinal-model-opcua";
import { TreeViewComponent } from "@syncfusion/ej2-vue-navigations";


export default {
    name : "DiscoverStep",
    components: {
        "ejs-treeview": TreeViewComponent,
    },
    props: {
        stepName : {required : true},
        state : {required : true },
        treeFields: {required: true},
    },
    data() {
        this.STATES = OPCUA_ORGAN_STATES;
        return {
            checkedNodes: []
        }
    },

    methods : {

        goToDiscovering() {
            this.$emit("discover");
        },

        nextStep() {
            this.$emit("nextStep", { stepName : this.stepName, checkedNodes: this.checkedNodes });
        },

        goBack() {
            this.$emit("goBack", this.stepName);
        },

        cancelDiscovering() {
            this.$emit("cancel");
        },
    }
}
</script>

<style>

</style>
<template>
    <div class="step_content" v-if="state === STATES.creating">
        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
    </div>

    <div class="step_content" v-else-if="state === STATES.created">
        Created !
    </div>

    <div class="step_content" v-else>
        <md-button class="md-raised md-primary" @click="createNodes">Create nodes</md-button>
        <md-button class="md-raised md-accent" @click="goBack">Back</md-button>
    </div>
</template>

<script>
import { OPCUA_ORGAN_STATES, SpinalOPCUADiscoverModel } from "spinal-model-opcua";

export default {
    name : "CreateNodeStep",
        props: {
        stepName : {required : true},
        state : {required : true },
    },
    data() {
        this.STATES = OPCUA_ORGAN_STATES;

        return {}
    },
    methods : {
        createNodes() {
            this.$emit("create");
        },
        
        goBack() {
            this.$emit("goBack", this.stepName);
        },
    }
}
</script>

<style>

</style>
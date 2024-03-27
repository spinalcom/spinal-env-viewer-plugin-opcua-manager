<template>
    <div class="step_content">

        <div class="tabs">
            <div class="radios">
                <md-radio v-model="selectEntry" :value="true">Select EntryPoint</md-radio>
                <md-radio v-model="selectEntry" :value="false">Discover All</md-radio>
            </div>

            <div class="tree" v-if="selectEntry">
                Tree
            </div>
        </div>

        <div>
            <md-button class="md-raised md-primary" @click="nextStep" :disabled="selectEntry" > 
                Next
            </md-button>

            <md-button class="md-raised md-accent" @click="goBack"> 
                Back
            </md-button>

        </div>
    </div>
</template>

<script>


export default {
    name: "EntryPointStep",
    props: {
        treeFields: {required: true},
        stepName : {required : true} 
    },
    data() {
        return {
            selectEntry: false
        }
    },
    methods: {

        nextStep() {
            this.$emit("nextStep", this.stepName);
        },

        goBack() {
            this.$emit("goBack", this.stepName);
        }
    }
}
</script>

<style>

</style>
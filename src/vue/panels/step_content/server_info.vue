<template>
    <div class="step_content">
        <div class="form">
            <md-field>
                <label>Network Name</label>
                <md-input v-model="serverInfo.name"></md-input>
            </md-field>

            <md-field>
                <label>OPCUA Server ip address</label>
                <md-input v-model="serverInfo.ip"></md-input>
            </md-field>

            <md-field>
                <label>OPCUA Server port</label>
                <md-input type="number" v-model="serverInfo.port"></md-input>
            </md-field>

            <md-field>
                <label>url endpoint</label>
                <md-input v-model="serverInfo.endpoint"></md-input>
            </md-field>

        </div>

        <md-button
            class="md-raised md-primary"
            @click="nextStep"
            :disabled="disabled">
            Next
        </md-button>
    </div>
</template>

<script>
export default {
    name: "ServerInfoStep",
    props: {
        serverInfo : {required : true},
        stepName : {required : true} 
    },
    methods: {
        nextStep() {
            this.$emit("nextStep", this.stepName);
        }
    },
    computed: {
        disabled() {
            if (this.serverInfo.name.trim().length == 0 || this.serverInfo.ip.trim().length == 0 || this.serverInfo.port.toString().length == 0)
                return true;
            return false;
        }
    }

}
</script>

<style>

</style>
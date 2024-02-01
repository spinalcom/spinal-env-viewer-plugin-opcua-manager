<template>
    <div class="_panel_container">
        <md-steppers class="stepper_container" :md-active-step.sync="step" md-vertical md-linear >

            <!-- Step 1 -->
             <md-step :id="getId(STEPS.serverInfo)" md-label="Server Info" md-description="Enter OPC Server information" :md-editable="false" :md-done="step > STEPS.serverInfo">
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
                    </div>

                    <md-button class="md-raised md-primary" @click="nextStep(STEPS.serverInfo)" :disabled="disableServerInfoBtn()">Continue</md-button>
                </div>
            </md-step>

            <!-- Step 2 -->
            <md-step :id="getId(STEPS.discovering)" md-label="Discovering" md-description="select the nodes to create" :md-editable="false" :md-done="step > STEPS.discovering">
                <div class="step_content">

                    <div class="initial_state" v-if="state === STATES.initial">
                        <md-button class="md-raised md-primary" @click="goToDiscovering">Discover</md-button>
                        <md-button class="md-raised md-accent" @click="goBack(STEPS.discovering)">Back</md-button>
                    </div>

                    <div class="discovering_state" v-else-if="state === STATES.discovering">
                        <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
                        <md-button class="md-raised md-accent" @click="cancelDiscovering(STEPS.discovering)">Cancel</md-button>
                    </div>

                    <div class="discovered_state" v-else-if="state === STATES.discovered">
                        <md-button class="md-raised md-primary" @click="nextStep(STEPS.discovering)">Continue</md-button>
                        <md-button class="md-raised md-accent" @click="goBack(STEPS.discovering)">Back</md-button>
                    </div>
                    <!-- <div class="disocered_content"></div> -->

                    
                </div>
            </md-step>

            <!-- Step 3 -->
            <md-step :id="getId(STEPS.creation)" md-label="Create Nodes" md-description="Node creation" :md-editable="false">
                <div class="step_content">

                    <md-button class="md-raised md-accent" @click="goBack(STEPS.creation)">Back</md-button>
                </div>
            </md-step>

        </md-steppers>
    </div>
</template>

<script>
import { DISCOVER_OPCUA_PANEL } from "../../constants";
import { OPCUA_ORGAN_STATES } from "spinal-model-opcua";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";


export default {
    name: DISCOVER_OPCUA_PANEL,
    data() {
        this.STATES = OPCUA_ORGAN_STATES;

        this.spinalDiscover;
        this.context;
        this.graph;
        this.organ;
        this.devicesBindProcess;

        this.STEPS = Object.freeze({
            serverInfo: "1",
            discovering: "2",
            creation: "3"
        })
    
        return {
            state: this.STATES.initial,
            step: this.STEPS.serverInfo,
            serverInfo: {
                name: "",
                ip: "",
                port: 1234
            },
            
        }
    },
    methods: {
        async opened(params) {
            this.graph = params.graph;
            this.context = params.context.get();
            this.organ = await this.getOrganModel(params.selectedNode.id.get());

            if (typeof this.spinalDiscover !== "undefined") {
                this.spinalDiscover = undefined;
                this.state = OPCUA_ORGAN_STATES.initial;
            }
        },

        closed() { },

        getId(id) {
            return id.toString();
        },

        getOrganModel(nodeId) {
            const realNode = SpinalGraphService.getRealNode(nodeId);
            return realNode.getElement();
        },

        // step
        nextStep(step) {
            switch (step) {
                case this.STEPS.serverInfo :
                case this.STEPS.discovering :
                    this.step = (Number(step) + 1).toString();
                    break;
            }
        },

        goBack(step) {
            switch (step) {
                case this.STEPS.discovering :
                case this.STEPS.creation :
                    this.step = (Number(step) - 1).toString();
                    break;
            }
        },

        //step end


        // discover
        goToDiscovering() {
            this.state = OPCUA_ORGAN_STATES.discovering;

            setInterval(() => {
                this.state = OPCUA_ORGAN_STATES.discovered;
            }, 5000);
        },

        cancelDiscovering() {
            this.state = OPCUA_ORGAN_STATES.initial;
        },

        goToDiscovered() {
            this.state = OPCUA_ORGAN_STATES.discovered;
        },

        

        // discover end

        disableServerInfoBtn() {
            if (this.serverInfo.name.trim().length == 0 || this.serverInfo.ip.trim().length == 0 || this.serverInfo.port.toString().length == 0) return true;
            return false;
        }
    
    },

    beforeDestroy() {
        this.spinalDiscover.remove(this.graph);
    },
}
</script>

<style lang="scss" scoped>
    ._panel_container {
        width: 100%;
        height: 100%;

        .stepper_container {
            width: 100%;
            height: calc(100% - 30px);
            background: transparent !important;
            .form {
                width: 90%;
                .md-field {
                    min-height: unset !important;
                }
            }

            .initial_state {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .discovering_state {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            .discovered_state {}
        }
    }

</style>

<style lang="scss">
    ._panel_container {
        .stepper_container {
            .md-steppers-wrapper {
                width: 100%;
                height: 100%;
                .md-steppers-container {
                    width: 100%;
                    height: 100%;
                    .md-stepper-content.md-active {
                        width: calc(100% - 60px);
                        min-height: 390px;
                    }
                }
            }
            
        }
        
    }
</style>
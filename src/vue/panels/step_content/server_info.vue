<template>
    <div class="step_content">
        <div class="form">
            <md-field class="nameField">
                <label>Network Name</label>
                <md-input v-model="serverInfo.name"></md-input>
            </md-field>
            <div class="content" v-if="!loading">
                <div class="header">
                    <md-button class="md-dense md-primary" @click="addGateway">
                        add gateway
                    </md-button>

                    <md-button class="md-dense md-primary" @click="upload">
                        upload gateways excel file
                    </md-button>
                </div>
                <div class="ips_container">
                    <div class="gateway_entry" v-for="item in serverInfo.gateways" :key="item.id">
                        <div class="action" v-if="item.id > 0">
                            <md-button class="md-icon-button md-accent" @click="removeGateway(item)">
                                <md-icon>remove</md-icon>
                            </md-button>
                        </div>

                        <div class="ips_cols">
                            <div class="ips_col">
                                <md-field md-inline>
                                    <label>ip address</label>
                                    <md-input v-model="item.address"></md-input>
                                </md-field>
                            </div>

                            <div class="ips_col">
                                <md-field md-inline>
                                    <label>port</label>
                                    <md-input type="number" v-model="item.port"></md-input>
                                </md-field>
                            </div>

                            <div class="ips_col">
                                <md-field md-inline>
                                    <label>endpoint</label>
                                    <md-input v-model="item.endpoint"></md-input>
                                </md-field>
                            </div>

                        </div>

                        <div class="ips_cols">
                            <md-field class="entry-point" md-inline>
                                <label>entryPoint Path</label>
                                <md-input v-model="item.entryPoint"></md-input>
                            </md-field>
                        </div>

                        <div class="ips_cols">
                            <md-checkbox class="discovery-mode" v-model="item.useLastResult">
                                Use Last Result (if Exists)
                            </md-checkbox>
                        </div>
                    </div>
                </div>
            </div>

            <div class="loading" v-else-if="loading">
                <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
            </div>

        </div>

        <md-button class="md-raised md-primary" @click="nextStep" :disabled="disabled" v-if="!loading">
            Next
        </md-button>
    </div>
</template>

<script>
export default {
    name: "ServerInfoStep",
    props: {
        serverInfo: { required: true },
        stepName: { required: true },
        loading: { required: true }
    },
    methods: {
        nextStep() {
            this.$emit("nextStep", this.stepName);
        },

        addGateway() {
            this.$emit("addGateway");
        },

        removeGateway(item) {
            this.$emit("removeGateway", item);
        },

        upload() {
            this.$emit("upload");
        }
    },
    computed: {
        disabled() {
            // if (this.serverInfo.name.trim().length == 0 || this.serverInfo.address.trim().length == 0 || this.serverInfo.port.toString().length == 0)
            if (this.serverInfo.name.trim().length == 0) return true
            const validIps = this.serverInfo.gateways.filter(el => el.address.trim().length > 0 && el.port.toString().length > 0);
            if (validIps.length === 0) return true;

            return false;
        }
    }

}
</script>

<style scoped>
.nameField {
    margin-bottom: 10px !important;
}

.loading {
    width: 100%;
    height: 300%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.content {
    width: 100%;
    height: 300px;
}

.content .header {
    width: 100%;
    height: 50px;
    margin: 15px 0;
    display: flex;
}

.content .ips_container {
    width: 100%;
    height: 220px;
    padding: 5px 0;
    overflow: hidden;
    overflow-y: auto;
}

.content .ips_container .ips_cols {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.content .ips_container .gateway_entry {
    margin-bottom: 20px;
    background: #131212;
    border-radius: 10px;
    padding: 10px;
}

.content .ips_container .discovery-mode {
    margin: 0 8px;
}

/* .content .ips_container .entry-point {
    margin: 0 8px;
} */

.content .ips_container .ips_cols .ips_col {
    width: 29%;
    margin-right: 5px;
}

.ips_container .action {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}
</style>
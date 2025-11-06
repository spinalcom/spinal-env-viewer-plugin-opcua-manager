
import Vue from "vue";
const { SpinalMountExtention } = require("spinal-env-viewer-panel-manager-service");
import { CONFIG_MONITORING_PROFILE_DIALOG, GENERATE_PROFILE_DIALOG, LINK_PROFILE_TO_DEVICE_DIALOG, CREATE_SUBNETWORK_DIALOG_IN_OPCUA } from "../../js/constants";

import ConfigProfileDialog from "./configProfileDialog.vue";
import GenerateProfileDialog from "./generateProfileDialog.vue";
import LinkDeviceToProfile from "./linkProfileToDevice.vue";
import CreateSubNetworkDialogInOpcua from "./createSubNetwork.vue";

const dialogs = [
    {
        name: CREATE_SUBNETWORK_DIALOG_IN_OPCUA,
        vueMountComponent: Vue.extend(CreateSubNetworkDialogInOpcua),
        parentContainer: document.body
    },
    {
        name: CONFIG_MONITORING_PROFILE_DIALOG,
        vueMountComponent: Vue.extend(ConfigProfileDialog),
        parentContainer: document.body
    },
    {
        name: GENERATE_PROFILE_DIALOG,
        vueMountComponent: Vue.extend(GenerateProfileDialog),
        parentContainer: document.body
    },
    {
        name: LINK_PROFILE_TO_DEVICE_DIALOG,
        vueMountComponent: Vue.extend(LinkDeviceToProfile),
        parentContainer: document.body
    }
]


for (let index = 0; index < dialogs.length; index++) {
    SpinalMountExtention.mount(dialogs[index]);
}
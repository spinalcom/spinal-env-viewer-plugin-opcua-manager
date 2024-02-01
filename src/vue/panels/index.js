import Vue from "vue";
import { SpinalForgeExtention } from "spinal-env-viewer-panel-manager-service_spinalforgeextention";
import { DISCOVER_OPCUA_PANEL } from "../../constants";

// Vue
import DiscoverNetworkPanel from "./discoverOPCUAPanel.vue";


const panels = [
    {
        name: DISCOVER_OPCUA_PANEL,
        vueMountComponent: Vue.extend(DiscoverNetworkPanel),
        panel: {
            title: "Discover OPCUA network",
            closeBehaviour: "hide",
        },
        style: {
            minWidth: '600px',
            height: "670px",
            left: "400px",
        },
    }
];



for (const element of panels) {
    const panelExtension = SpinalForgeExtention.createExtention(element);
    SpinalForgeExtention.registerExtention(element.name, panelExtension);
}
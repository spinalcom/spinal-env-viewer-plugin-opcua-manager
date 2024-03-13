import Vue from "vue";
import { SpinalForgeExtention } from "spinal-env-viewer-panel-manager-service_spinalforgeextention";
import { DISCOVER_OPCUA_PANEL, MONITORING_PANEL_NAME } from "../../js/constants";

// Vue
import DiscoverNetworkPanel from "./discoverOPCUAPanel.vue";
import MonitorNetworkPanel from "./monitoringPanel.vue";

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
    },
    {
        name: MONITORING_PANEL_NAME,
        vueMountComponent: Vue.extend(MonitorNetworkPanel),
        panel: {
            title: "Monitor network",
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
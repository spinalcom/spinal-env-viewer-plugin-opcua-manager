import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { OPCUA_ORGAN_TYPE } from "spinal-model-opcua";
import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { MONITORING_PANEL_NAME, SIDEBAR } from "../js/constants";
import utilities from "../js/utilities";



class MonitoringOPCUABtn extends SpinalContextApp {
    constructor() {
        super("Monitor OPCUA Server", "This button allows to manage opcua network monitoring", {
            icon: "personal_video",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
        });
    }

    async isShown(option) {
        const typeSelected = option.selectedNode.type.get();
        const id = option.selectedNode.id.get();
        const contextId = option.context.id.get();

        // if (typeSelected === OPCUA_ORGAN_TYPE) return true;

        if (typeSelected === SpinalBmsNetwork.nodeTypeName || typeSelected === SpinalBmsDevice.nodeTypeName) {
            const organNode = await utilities.getOrgan(id, contextId);
            const organ = organNode && await organNode.getElement(true);
            return organ && organ.type.get() == OPCUA_ORGAN_TYPE ? true : -1;
        }

        return -1;
    }

    async action(option) {
        const typeSelected = option.selectedNode.type.get();
        const id = option.selectedNode.id.get();
        const contextId = option.context.id.get();

        const organ = await utilities.getOrgan(id, contextId);
        let network = typeSelected === SpinalBmsNetwork.nodeTypeName ? SpinalGraphService.getRealNode(id) : await utilities.findNetwork(organ.getId().get(), contextId, id);


        const param = {
            graph: option.graph,
            context: SpinalGraphService.getRealNode(option.context.id.get()),
            selectedNode: SpinalGraphService.getRealNode(option.selectedNode.id.get()),
            organ,
            network
        }

        spinalPanelManagerService.openPanel(MONITORING_PANEL_NAME, param);
    }
}



const monitoringOPCUABtn = new MonitoringOPCUABtn()

spinalContextMenuService.registerApp(SIDEBAR, monitoringOPCUABtn, [3]);

export default monitoringOPCUABtn;
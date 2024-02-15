import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { OPCUA_ORGAN_TYPE } from "spinal-model-opcua";
import { SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { DISCOVER_OPCUA_PANEL, SIDEBAR } from "../constants";
import utilities from "../js/utilities";


class DiscoverOPCUABtn extends SpinalContextApp {
    constructor() {
        super("Discover OPCUA Server", "This button allows to discover opcua network and create", {
            icon: "network_check",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
        });
    }

    async isShown(option) {
        const typeSelected = option.selectedNode.type.get();
        const id = option.selectedNode.id.get();
        const contextId = option.context.id.get();

        if (typeSelected === OPCUA_ORGAN_TYPE) return true;

        if (typeSelected === SpinalBmsNetwork.nodeTypeName) {
            const organ = await utilities.getOrgan(id, contextId);

            return organ && organ.type.get() == OPCUA_ORGAN_TYPE ? true : -1;
        }


        return -1;
    }

    action(option) {
        const param = {
            graph: option.graph,
            context: SpinalGraphService.getRealNode(option.context.id.get()),
            selectedNode: SpinalGraphService.getRealNode(option.selectedNode.id.get()),
        }
        spinalPanelManagerService.openPanel(DISCOVER_OPCUA_PANEL, param);
    }
}



const discoverOPCUABtn = new DiscoverOPCUABtn()

spinalContextMenuService.registerApp(SIDEBAR, discoverOPCUABtn, [3]);

export default discoverOPCUABtn;
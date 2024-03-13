import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { OPCUA_ORGAN_TYPE } from "spinal-model-opcua";
import { LINK_PROFILE_TO_DEVICE_DIALOG, SIDEBAR } from "../js/constants";
import utilities from "../js/utilities";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";


class LinkProfileToDevice extends SpinalContextApp {
    constructor() {
        super("Link Profile to device", "This button allows to link opcua  Profile to Device", {
            icon: "dataset_linked",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
        });
    }

    async isShown(option) {
        const typeSelected = option.selectedNode.type.get();
        const id = option.selectedNode.id.get();
        const contextId = option.context.id.get();
        if (typeSelected !== SpinalBmsDevice.nodeTypeName) return -1;

        const organNode = await utilities.getOrgan(id, contextId);

        const organ = organNode && await organNode.getElement(true);;
        return organ && organ.type.get() == OPCUA_ORGAN_TYPE ? true : -1;


        // return -1;
    }

    async action(option) {
        const id = option.selectedNode.id.get();
        const contextId = option.context.id.get();

        const param = {
            graph: option.graph,
            context: SpinalGraphService.getRealNode(option.context.id.get()),
            selectedNode: SpinalGraphService.getRealNode(option.selectedNode.id.get()),
        }

        spinalPanelManagerService.openPanel(LINK_PROFILE_TO_DEVICE_DIALOG, param);
    }
}



const linkProfileToDevice = new LinkProfileToDevice()

spinalContextMenuService.registerApp(SIDEBAR, linkProfileToDevice, [3]);

export default linkProfileToDevice;
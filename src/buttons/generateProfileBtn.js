import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { OPCUA_ORGAN_TYPE } from "spinal-model-opcua";
import { GENERATE_PROFILE_DIALOG, SIDEBAR } from "../js/constants";
import utilities from "../js/utilities";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";


class GenerateProfile extends SpinalContextApp {
    constructor() {
        super("Generate OPCUA Profile", "This button allows to Generate opcua monitoring Profile", {
            icon: "transform",
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

        spinalPanelManagerService.openPanel(GENERATE_PROFILE_DIALOG, param);
    }
}



const generateProfile = new GenerateProfile()

spinalContextMenuService.registerApp(SIDEBAR, generateProfile, [3]);

export default generateProfile;
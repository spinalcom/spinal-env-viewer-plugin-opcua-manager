import { SpinalContextApp, spinalContextMenuService } from "spinal-env-viewer-context-menu-service";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
const { spinalPanelManagerService } = require("spinal-env-viewer-panel-manager-service");
import { OPCUA_ORGAN_TYPE } from "spinal-model-opcua";
import { CONFIG_MONITORING_PROFILE_DIALOG, SIDEBAR } from "../js/constants";
import utilities from "../js/utilities";
import { PROFILE_TYPE } from "../js/profile_service";


class ConfigProfilBtn extends SpinalContextApp {
    constructor() {
        super("Configure monitoring Profile", "This button allows to configure opcua network monitoring profile", {
            icon: "display_settings",
            icon_type: "in",
            backgroundColor: "#FF0000",
            fontColor: "#FFFFFF"
        });
    }

    async isShown(option) {
        const typeSelected = option.selectedNode.type.get();
        // const id = option.selectedNode.id.get();
        // const contextId = option.context.id.get();

        return typeSelected === PROFILE_TYPE ? true : -1;
        // if (contextId === id || typeSelected === OPCUA_ORGAN_TYPE) return -1;

        // const organNode = await utilities.getOrgan(id, contextId);

        // const organ = organNode && await organNode.getElement(true);;
        // return organ && organ.type.get() == OPCUA_ORGAN_TYPE ? true : -1;


        // return -1;
    }

    async action(option) {
        const id = option.selectedNode.id.get();
        const contextId = option.context.id.get();

        // const organ = await utilities.getOrgan(id, contextId);

        const param = {
            graph: option.graph,
            context: SpinalGraphService.getRealNode(option.context.id.get()),
            selectedNode: SpinalGraphService.getRealNode(option.selectedNode.id.get()),
            // organ
        }

        spinalPanelManagerService.openPanel(CONFIG_MONITORING_PROFILE_DIALOG, param);
    }
}



const configProfilBtn = new ConfigProfilBtn()

spinalContextMenuService.registerApp(SIDEBAR, configProfilBtn, [3]);

export default configProfilBtn;
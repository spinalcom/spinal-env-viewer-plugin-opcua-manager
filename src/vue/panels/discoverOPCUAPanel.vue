<template>
  <div class="_panel_container">
    <md-steppers class="stepper_container" :md-active-step.sync="step" md-vertical md-linear>
      <!-- Step 1 -->
      <md-step :id="getId(STEPS.serverInfo)" md-label="Server Info" md-description="Enter OPC Server information"
        :md-editable="false" :md-done="step > STEPS.serverInfo">

        <server-info-step :serverInfo="serverInfo" :stepName="STEPS.serverInfo" @nextStep="nextStep"
          @addGateway="addGateway" @removeGateway="removeGateway" @upload="uploadGateways" :loading="isLoading" />
      </md-step>

      <!-- Step 2 -->
      <!-- <md-step
        :id="getId(STEPS.selectEntryPoint)"
        md-label="Entry point"
        md-description="Select the entry point"
        :md-editable="false"
        :md-done="step > STEPS.selectEntryPoint">

          <entry-point-step 
            :treeFields="entryPointTreeFields"
            :stepName="STEPS.selectEntryPoint" 
            @nextStep="nextStep" 
            @goBack="goBack" />

      </md-step> -->

      <!-- Step 3 -->
      <md-step :id="getId(STEPS.discovering)" md-label="Discovering" md-description="select the nodes to create"
        :md-editable="false" :md-done="step > STEPS.discovering">

        <discover-step :stepName="STEPS.discovering" :state="state" :treeFields="treeFields" @discover="goToDiscovering"
          @nextStep="goToCreationStep" @goBack="goBack" @cancel="cancelDiscovering" @retry="retry" :asking="ask"
          @askResult="ConfirmChoice" />

      </md-step>

      <!-- Step 4 -->
      <md-step :id="getId(STEPS.creation)" md-label="Create Nodes" md-description="Node creation" :md-editable="false">

        <create-node-step :stepName="STEPS.creation" :state="state" @create="createNodes" @goBack="goBack" />

      </md-step>
    </md-steppers>
  </div>
</template>

<script>
import { DISCOVER_OPCUA_PANEL } from "../../js/constants";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import ServerInfoStep from "./step_content/server_info.vue";
import EntryPointStep from "./step_content/selectEntryPoint.vue";
import DiscoverStep from "./step_content/discoverDevice.vue";
import CreateNodeStep from "./step_content/createNodes.vue";
import { OPCUA_ORGAN_STATES, SpinalOPCUADiscoverModel } from "spinal-model-opcua";
import spinalExcelManager from "spinal-env-viewer-plugin-excel-manager-service";

const tJSON = require("./test.json");
const STEPS = Object.freeze({
  serverInfo: "1",
  // selectEntryPoint: "2",
  discovering: "2",
  creation: "3",
});

export default {
  name: DISCOVER_OPCUA_PANEL,
  components: {
    "server-info-step": ServerInfoStep,
    "entry-point-step": EntryPointStep,
    "discover-step": DiscoverStep,
    "create-node-step": CreateNodeStep
  },
  data() {
    this.STATES = OPCUA_ORGAN_STATES;
    this.spinalDiscover;
    this.spinalEntryPoint;
    this.context;
    this.graph;
    this.organ;
    this.devicesBindProcess;

    this.STEPS = STEPS;
    this.processBind = null;

    return {
      step: this.STEPS.serverInfo,
      state: this.STATES.initial,
      treeFields: [],
      entryPointTreeFields: [],
      checkedNodes: [],
      ask: false,
      isLoading: false,
      serverInfo: {
        name: "WBOX",
        gateways: [{ id: 0, address: "172.29.32.43", port: 26543, endpoint: "" }]
        // address: "172.29.32.43",
        // port: 26543,
        // endpoint: ""
      },
    };
  },
  methods: {
    async opened({ graph, context, organ, serverInfo }) {
      this.graph = graph;
      this.context = context;
      this.organ = await organ.getElement(true);

      if (serverInfo) this.serverInfo = serverInfo;

      this.initialized();
    },

    initialized() {
      this.spinalDiscover = undefined;
      this.state = OPCUA_ORGAN_STATES.initial;
      this.step = this.STEPS.serverInfo;
      this.spinalEntryPoint = undefined;
    },

    closed() {
      if (this.spinalDiscover) this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.cancelled);
    },

    getId(id) {
      return id.toString();
    },

    getOrganModel(nodeId) {
      const realNode = SpinalGraphService.getRealNode(nodeId);
      return realNode.getElement();
    },

    goToCreationStep({ checkedNodes, stepName }) {
      this.checkedNodes = checkedNodes;
      this.nextStep(stepName);
    },

    // step
    nextStep(step) {
      switch (step) {
        case this.STEPS.serverInfo:
        case this.STEPS.selectEntryPoint:
        case this.STEPS.discovering:
          this.step = (Number(step) + 1).toString();
          break;
      }
    },

    goBack(step) {
      switch (step) {
        case this.STEPS.discovering:
        case this.STEPS.selectEntryPoint:
        case this.STEPS.creation:
          this.step = (Number(step) - 1).toString();
          break;
      }

      if (this.spinalDiscover) {
        this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.cancelled);
        this.state = OPCUA_ORGAN_STATES.initial;
      }

    },

    //step end

    // server info

    addGateway() {
      console.log("add gateway")
      const id = this.serverInfo.gateways[0].id + 1;
      this.serverInfo.gateways = [{ id, address: "", port: "", endpoint: "" }, ...this.serverInfo.gateways];
    },

    removeGateway(item) {
      const id = item.id;
      this.serverInfo.gateways = this.serverInfo.gateways.filter(el => el.id !== id);
    },

    uploadGateways() {
      let input = document.createElement("input");
      input.type = "file";
      input.accept = ".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel";
      input.click();

      input.addEventListener("change", async (event) => {
        this.isLoading = true;

        try {
          const file = event.target.files[0];
          const ips = await this.convertFileDataToJson(file);
          this.serverInfo.gateways = ips.map((el, index) => {
            el.id = index;
            return el;
          });

          this.isLoading = false;
        } catch (error) {
          console.log(error);

          this.isLoading = false;
        }
      }, false);
    },

    async convertFileDataToJson(file) {
      const dataJson = await spinalExcelManager.convertExcelToJson(file);
      const ips = [];
      let index = 0;
      for (const key in dataJson) {
        if (Object.hasOwnProperty.call(dataJson, key)) {
          const values = dataJson[key];
          for (const item of values) {
            item.id = index;
            ips.push(item);
            index++;
          }
        }
      }
      return ips;
    },

    // discover

    async createNewSpinalDiscover() {
      this.serverInfo.gateways = this.serverInfo.gateways.filter(el => el.address.trim().length > 0 && el.address.toString().trim().length > 0);

      this.spinalDiscover = new SpinalOPCUADiscoverModel(this.graph, this.context, this.organ, this.serverInfo);
      this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.readyToDiscover);

      await this.spinalDiscover.addToGraph();
      return this.spinalDiscover;
    },

    async goToDiscovering() {
      this.state = OPCUA_ORGAN_STATES.discovering;
      await this.createNewSpinalDiscover();

      this.bindDiscoverState();
    },

    async goToDiscovered() {
      const tree = await this.spinalDiscover.getTreeDiscovered();
      this.treeFields = [tree];
      this.state = OPCUA_ORGAN_STATES.discovered;
    },

    async cancelDiscovering() {
      this.state = OPCUA_ORGAN_STATES.initial;
      this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.cancelled);
    },

    retry() {
      this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.discovering);
      this.state = OPCUA_ORGAN_STATES.discovering;
    },

    bindDiscoverState() {
      this.processBind = this.spinalDiscover.state.bind(async () => {
        const state = this.spinalDiscover.state.get();
        switch (state) {
          case OPCUA_ORGAN_STATES.discovered:
            this.goToDiscovered();
            break;

          case OPCUA_ORGAN_STATES.error:
            this.state = OPCUA_ORGAN_STATES.error;
            break;
          case OPCUA_ORGAN_STATES.cancelled:
            await this.resetSpinalDiscover();
            break;
          case OPCUA_ORGAN_STATES.created:
            this.state = OPCUA_ORGAN_STATES.created;
            await this.resetSpinalDiscover();
            break;
          case OPCUA_ORGAN_STATES.pending:
            this.state = OPCUA_ORGAN_STATES.pending;
            this.ask = this.spinalDiscover.ask?.get() || false;
            break;
        }
      });
    },

    async resetSpinalDiscover() {
      if (this.spinalDiscover) {
        if (this.processBind) this.spinalDiscover.state.unbind(this.processBind);
        await this.spinalDiscover.removeFromGraph();

        this.spinalDiscover = null;
        this.processBind = null;
      }

    },


    ConfirmChoice(choice) {
      this.spinalDiscover.changeChoice(choice);
      this.state = OPCUA_ORGAN_STATES.discovering;
    },


    // discover end

    // creation
    async createNodes() {
      this.state = OPCUA_ORGAN_STATES.creating;
      const treeSelected = await this.getTreeSelected();
      console.log("treeSelected", treeSelected);
      await this.spinalDiscover.setTreeToCreate(treeSelected);
      this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.readyToCreate);

      // const processBind = this.spinalDiscover.state.bind(async () => {
      //   const state = this.spinalDiscover.state.get();

      //   if (state === OPCUA_ORGAN_STATES.created) {
      //     await this.spinalDiscover.removeFromGraph();
      //     this.state = OPCUA_ORGAN_STATES.created;
      //     this.spinalDiscover.state.unbind(processBind);
      //   }
      // });
    },

    getTreeSelected() {
      const treeCopy = JSON.parse(JSON.stringify(this.treeFields[0]));
      const obj = this.convertTreeSelectedToObj();

      return this.filterTree(treeCopy, obj);


      // const promises = treeCopy.children.map(el => this.filterTree(el, obj));
      // return Promise.all(promises).then((result) => {
      //   const children = result.filter(Boolean);
      //   treeCopy.children = children;
      //   return treeCopy;
      // })
    },

    convertTreeSelectedToObj() {
      return this.checkedNodes.reduce((o, id) => {
        o[id] = id;
        return o;
      }, {})
    },

    async filterTree(tree, nodeSelected) {
      if (nodeSelected[tree.nodeId]) return tree;

      const promises = tree.children.map((child) => this.filterTree(child, nodeSelected));

      const childrenFiltered = await Promise.all(promises).then((result) => result.filter(Boolean));

      if (childrenFiltered.length > 0) {
        const copy = Object.assign({}, tree);
        copy.children = childrenFiltered;
        return copy;
      } else {
        return null;
      }
    },

    // creation end

    formatTree(tree, parentId) {
      return tree.reduce((list, item) => {
        const hasChild =
          item.children && item.children.length > 0 ? true : false;
        const copy = {
          displayName: item.displayName,
          nodeId: item.nodeId,
          parentId,
        };
        if (hasChild)
          list.push(...this.formatTree(item.children, item.nodeId).flat());

        list.push(copy);
        return list;
      }, []);
    },

    convertToObj(tree, parentId, obj) {
      return tree.reduce((list, item) => {
        const hasChild =
          item.children && item.children.length > 0 ? true : false;
        const copy = {
          name: item.displayName,
          displayName: item.displayName,
          nodeId: item.nodeId,
          parentId,
        };
        if (hasChild)
          list.push(
            ...this.convertToObj(item.children, item.nodeId, obj).flat()
          );

        obj[copy.nodeId] = copy;
        list.push(copy);
        return list;
      }, []);
    },
  },

  beforeDestroy() {
    this.spinalDiscover.remove(this.graph);
  },
};
</script>

<style>
/* @import url("https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons"); */
</style>

<style lang="scss">
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

    .discovered_state {
      .control_wrapper {
        height: 350px;
        overflow-y: auto;
      }
    }
  }
}
</style>

<style lang="scss">
._panel_container * {
  box-sizing: border-box !important;
}

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


<style>
._panel_container .md-stepper-content {
  padding-right: 0px !important;
  padding-bottom: 0px !important;
}
</style>
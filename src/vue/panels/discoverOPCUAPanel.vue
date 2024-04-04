<template>
  <div class="_panel_container">
    <md-steppers
      class="stepper_container"
      :md-active-step.sync="step"
      md-vertical
      md-linear
    >
      <!-- Step 1 -->
      <md-step
        :id="getId(STEPS.serverInfo)"
        md-label="Server Info"
        md-description="Enter OPC Server information"
        :md-editable="false"
        :md-done="step > STEPS.serverInfo">

          <server-info-step 
            :serverInfo="serverInfo"
            :stepName="STEPS.serverInfo"
            @nextStep="nextStep" />

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
      <md-step
        :id="getId(STEPS.discovering)"
        md-label="Discovering"
        md-description="select the nodes to create"
        :md-editable="false"
        :md-done="step > STEPS.discovering">

          <discover-step
            :stepName="STEPS.discovering" 
            :state="state" 
            :treeFields="treeFields" 
            @discover="goToDiscovering"
            @nextStep="goToCreationStep"
            @goBack="goBack"
            @cancel="cancelDiscovering" />

      </md-step>

      <!-- Step 4 -->
      <md-step
        :id="getId(STEPS.creation)"
        md-label="Create Nodes"
        md-description="Node creation"
        :md-editable="false">

          <create-node-step 
            :stepName="STEPS.creation" 
            :state="state" 
            @create="createNodes" 
            @goBack="goBack" />
            
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
import { OPCUA_ORGAN_STATES, SpinalOPCUADiscoverModel, SpinalOPCUAEntryPoint } from "spinal-model-opcua";

const tJSON = require("./test.json");


export default {
  name: DISCOVER_OPCUA_PANEL,
  components: {
    "server-info-step" : ServerInfoStep,
    "entry-point-step" : EntryPointStep,
    "discover-step" : DiscoverStep,
    "create-node-step" : CreateNodeStep
  },
  data() {
    this.STATES = OPCUA_ORGAN_STATES;
    this.spinalDiscover;
    this.spinalEntryPoint;
    this.context;
    this.graph;
    this.organ;
    this.devicesBindProcess;

    this.STEPS = Object.freeze({
      serverInfo: "1",
      // selectEntryPoint: "2",
      discovering: "2",
      creation: "3",
    });

    return {
      step: this.STEPS.serverInfo,
      state: this.STATES.initial,
      treeFields: [],
      entryPointTreeFields : [],
      checkedNodes: [],
      serverInfo: {
        name: "Server Local",
        ip: "spinalcom",
        port: 5011,
        endpoint : "/IcoFwxServer"
      },
    };
  },
  methods: {
    async opened({graph, context, organ, serverInfo}) {
      this.graph = graph;
      this.context = context;
      this.organ = await organ.getElement(true);
      console.log("serverInfo", serverInfo);
      if(serverInfo) this.serverInfo = serverInfo;

      if (typeof this.spinalDiscover !== "undefined") {
        this.spinalDiscover = undefined;
        this.state = OPCUA_ORGAN_STATES.initial;
        this.step = this.STEPS.serverInfo;
        this.spinalEntryPoint = undefined;
      }
    },

    closed() {},

    getId(id) {
      return id.toString();
    },

    getOrganModel(nodeId) {
      const realNode = SpinalGraphService.getRealNode(nodeId);
      return realNode.getElement();
    },

    goToCreationStep({checkedNodes, stepName}) {
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
    },

    //step end

    // discover
    async goToDiscovering() {
      this.state = OPCUA_ORGAN_STATES.discovering;
      this.spinalDiscover = new SpinalOPCUADiscoverModel(
        this.graph,
        this.context,
        this.organ,
        this.serverInfo
      );
      this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.readyToDiscover);

      await this.spinalDiscover.addToGraph();

      const processBind = this.spinalDiscover.state.bind(() => {
        const state = this.spinalDiscover.state.get();

        if (state === OPCUA_ORGAN_STATES.discovered) {
          this.spinalDiscover.state.unbind(processBind);
          this.goToDiscovered();
        }
      });
    },

    async goToDiscovered() {
      this.treeFields = await this.spinalDiscover.getTreeDiscovered();
      console.log("tree", this.treeFields);
      this.state = OPCUA_ORGAN_STATES.discovered;
    },

    cancelDiscovering() {
      this.state = OPCUA_ORGAN_STATES.initial;
    },

    // discover end

    // creation
    async createNodes() {
      // convert tree to obj
      this.state = OPCUA_ORGAN_STATES.creating;
      const treeCopy = JSON.parse(JSON.stringify(this.treeFields));
      const treeSelected = await this.filterTree(treeCopy, this.checkedNodes);
      console.log("treeSelected", treeSelected);
      await this.spinalDiscover.setTreeToCreate(treeSelected);
      this.spinalDiscover.changeState(OPCUA_ORGAN_STATES.readyToCreate);

      const processBind = this.spinalDiscover.state.bind(async () => {
        const state = this.spinalDiscover.state.get();

        if (state === OPCUA_ORGAN_STATES.created) {
          await this.spinalDiscover.removeFromGraph();
          this.state = OPCUA_ORGAN_STATES.created;
          this.spinalDiscover.state.unbind(processBind);
        }
      });
    },

    async filterTree(tree, nodeSelected) {
      if (nodeSelected.includes(tree.nodeId)) return tree;

      const promises = tree.children.map((child) =>
        this.filterTree(child, nodeSelected)
      );

      const childrenFiltered = await Promise.all(promises).then((result) => {
        return result.filter(Boolean);
      });

      if (childrenFiltered.length > 0) {
        const copy = Object.assign({}, tree);
        copy.children = childrenFiltered;
        return copy;
      } else {
        return null;
      }

      //   const tree = {
      //     displayName: this.treeFields.displayName,
      //     nodeId: this.treeFields.nodeId,
      //   };

      //   const allNodesObj = {
      //     [tree.nodeId]: tree,
      //   };
      //   await this.convertToObj(
      //     this.treeFields.children,
      //     this.treeFields.nodeId,
      //     allNodesObj
      //   );

      //   const _nodesTreated = {};

      //   for (const id of this.checkedNodes) {
      //     addNodeToTree(id);
      //   }

      //   return tree;

      //   function addNodeToTree(nodeId) {

      //     // if (!nodeId || _nodesTreated[nodeId]) return;

      //     // const node = allNodesObj[nodeId];
      //     // if (!node) return;

      //     // if (!node.children) node.children = [];
      //     // _nodesTreated[nodeId] = node;

      //     // const parentId = node.parentId;
      //     // const parent = _nodesTreated[parentId] || allNodesObj[parentId];
      //     // if (parent && _nodesTreated[parentId]) {
      //     //   _nodesTreated[parentId].children.push(node);
      //     //   return;
      //     // }

      //     // if (parent && !_nodesTreated[parentId]) {
      //     //   parent.children = [node];
      //     //   _nodesTreated[parentId] = parent;
      //     //   addNodeToTree(parent.parentId);
      //     // }
      //   }
    },

    // creation end

    // disableServerInfoBtn() {
    //   if (
    //     this.serverInfo.name.trim().length == 0 ||
    //     this.serverInfo.ip.trim().length == 0 ||
    //     this.serverInfo.port.toString().length == 0
    //   )
    //     return true;
    //   return false;
    // },

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
@import url("https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons");
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

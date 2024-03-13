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
        :md-done="step > STEPS.serverInfo"
      >
        <div class="step_content">
          <div class="form">
            <md-field>
              <label>Network Name</label>
              <md-input v-model="serverInfo.name"></md-input>
            </md-field>

            <md-field>
              <label>OPCUA Server ip address</label>
              <md-input v-model="serverInfo.ip"></md-input>
            </md-field>

            <md-field>
              <label>OPCUA Server port</label>
              <md-input type="number" v-model="serverInfo.port"></md-input>
            </md-field>
          </div>

          <md-button
            class="md-raised md-primary"
            @click="nextStep(STEPS.serverInfo)"
            :disabled="disableServerInfoBtn()"
            >Continue</md-button
          >
        </div>
      </md-step>

      <!-- Step 2 -->
      <md-step
        :id="getId(STEPS.discovering)"
        md-label="Discovering"
        md-description="select the nodes to create"
        :md-editable="false"
        :md-done="step > STEPS.discovering"
      >
        <div class="step_content">
          <div class="initial_state" v-if="state === STATES.initial">
            <md-button class="md-raised md-primary" @click="goToDiscovering"
              >Discover</md-button
            >
            <md-button
              class="md-raised md-accent"
              @click="goBack(STEPS.discovering)"
              >Back</md-button
            >
          </div>

          <div
            class="discovering_state"
            v-else-if="state === STATES.discovering"
          >
            <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
            <md-button
              class="md-raised md-accent"
              @click="cancelDiscovering(STEPS.discovering)"
              >Cancel</md-button
            >
          </div>

          <div class="discovered_state" v-else-if="state === STATES.discovered">
            <div class="control_wrapper">
              <!-- <ejs-treeview id='treeview' :fields="treeFields" :showCheckBox='true' :checkedNodes='checkedNodes'></ejs-treeview> -->

              <v-treeview
                dark
                selectable
                open-on-click
                hoverable
                transition
                item-text="displayName"
                item-key="nodeId"
                selected-color="primary"
                v-model="checkedNodes"
                :items="treeFields.children"
              ></v-treeview>
            </div>
            <div>
              <md-button
                class="md-raised md-primary"
                @click="nextStep(STEPS.discovering)"
                >Continue</md-button
              >
              <md-button
                class="md-raised md-accent"
                @click="goBack(STEPS.discovering)"
                >Back</md-button
              >
            </div>
          </div>
          <!-- <div class="disocered_content"></div> -->
        </div>
      </md-step>

      <!-- Step 3 -->
      <md-step
        :id="getId(STEPS.creation)"
        md-label="Create Nodes"
        md-description="Node creation"
        :md-editable="false"
      >
        <div class="step_content" v-if="state === STATES.creating">
          <md-progress-spinner md-mode="indeterminate"></md-progress-spinner>
        </div>
        <div class="step_content" v-else-if="state === STATES.created">
          Created !
        </div>

        <div class="step_content" v-else>
          <md-button class="md-raised md-primary" @click="createNodes"
            >Create nodes</md-button
          >
          <md-button class="md-raised md-accent" @click="goBack(STEPS.creation)"
            >Back</md-button
          >
        </div>
      </md-step>
    </md-steppers>
  </div>
</template>

<script>
import { DISCOVER_OPCUA_PANEL } from "../../js/constants";
import {
  OPCUA_ORGAN_STATES,
  SpinalOPCUADiscoverModel,
} from "spinal-model-opcua";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";
import { TreeViewComponent } from "@syncfusion/ej2-vue-navigations";
const tJSON = require("./test.json");

export default {
  name: DISCOVER_OPCUA_PANEL,
  components: {
    "ejs-treeview": TreeViewComponent,
  },
  data() {
    this.STATES = OPCUA_ORGAN_STATES;

    this.spinalDiscover;
    this.context;
    this.graph;
    this.organ;
    this.devicesBindProcess;

    this.STEPS = Object.freeze({
      serverInfo: "1",
      discovering: "2",
      creation: "3",
    });

    return {
      state: this.STATES.initial,
      step: this.STEPS.serverInfo,
      // treeFields: { dataSource: [], id: 'nodeId', parentID: 'parentId', text: 'displayName', hasChildren: 'hasChild' },
      treeFields: [],
      checkedNodes: [],
      serverInfo: {
        name: "Server WBOX",
        ip: "10.10.0.11",
        port: 26543,
      },
    };
  },
  methods: {
    async opened(params) {
      console.log(params);
      this.graph = params.graph;
      this.context = params.context;
      this.organ = await params.selectedNode.getElement(true);

      if (typeof this.spinalDiscover !== "undefined") {
        this.spinalDiscover = undefined;
        this.state = OPCUA_ORGAN_STATES.initial;
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

    // step
    nextStep(step) {
      switch (step) {
        case this.STEPS.serverInfo:
        case this.STEPS.discovering:
          this.step = (Number(step) + 1).toString();
          break;
      }
    },

    goBack(step) {
      switch (step) {
        case this.STEPS.discovering:
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

    cancelDiscovering() {
      this.state = OPCUA_ORGAN_STATES.initial;
    },

    async goToDiscovered() {
      this.treeFields = await this.spinalDiscover.getTreeDiscovered();
      console.log("tree", this.treeFields);
      this.state = OPCUA_ORGAN_STATES.discovered;
    },

    // discover end

    // creation
    async createNodes() {
      // convert tree to obj
      this.state = OPCUA_ORGAN_STATES.creating;
      const treeCopy = JSON.parse(JSON.stringify(this.treeFields));
      const treeSelected = await this.filterTree(treeCopy, this.checkedNodes);
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

    disableServerInfoBtn() {
      if (
        this.serverInfo.name.trim().length == 0 ||
        this.serverInfo.ip.trim().length == 0 ||
        this.serverInfo.port.toString().length == 0
      )
        return true;
      return false;
    },

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

<style scoped lang="scss">
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

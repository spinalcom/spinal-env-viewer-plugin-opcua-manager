<template>
  <md-dialog
    class="configContainer"
    :md-active.sync="showDialog"
    @md-closed="closeDialog(false)"
  >
    <md-dialog-title class="title">
      Configure Monitoring profile
    </md-dialog-title>

    <md-dialog-content class="dialogContent">
      <div v-if="state === STATES.loaded" class="loadedContent">
        <div class="list_div">

          <div class="div_title endpoint_div_title">
            <div class="name">
              Endpoints list
            </div>

            <div class="action">
              <md-field md-inline>
                <label>Search...</label>
                <md-input v-model="searchText"></md-input>
                <md-icon>search</md-icon>
              </md-field>

              <md-button class="md-icon-button" title="select all" @click="selectAll">
                <md-icon>select_all</md-icon>
              </md-button>

              <md-button class="md-icon-button" title="deselect all" @click="deselectAll">
                <md-icon>deselect</md-icon>
              </md-button>
            </div>
          </div>

          <md-list class="md-double-line item_list" v-if="endpointsFiltered.length > 0">
            <!-- <md-subheader>Endpoints list</md-subheader> -->
            <md-list-item
              v-for="e in endpointsFiltered"
              :key="e.id"
              @click.stop="() => selectEndpoint(e)"
              class="listItem"
              :class="{ selected: isSelected(e) }" 
              draggable="true"
              @dragstart="() => dragItems(e.id)">
              <div class="md-list-item-text">
                <span>{{ e.name }}</span>
                <span class="pathDiv">{{ e.path || "" }}</span>
              </div>
            </md-list-item>
          </md-list>

          <div v-else class="loading">
            <h3>No Item Found</h3>
          </div>
        </div>

        <!-- <div class="switchButtons">
          <md-button
            class="md-icon-button md-raised md-primary"
            @click="addToInterList"
          >
            <md-icon>forward</md-icon>
          </md-button>
        </div> -->

        <div class="list_div">
          <div class="div_title">Intervals list</div>

          <md-list :md-expand-single="expandSingle" class="item_list">
            <md-list-item
              md-expand
              v-for="interval in intervalsList"
              :key="interval.value"
              :class="{ selected: interValIsSelected(interval.value) }"
              @click="() => selectInterval(interval)"
              @dragover="e => e.preventDefault()"
              @drop="(e) => dropItems(interval, e)">

              <md-icon>schedule</md-icon>
              <span class="md-list-item-text">{{ interval.name }}</span>
              <md-button
                class="md-icon-button md-list-action md-accent"
                @click="() => deleteInterval(interval)"
              >
                <md-icon>remove</md-icon>
              </md-button>

              <md-list slot="md-expand">
                <md-list-item
                  class="md-inset"
                  v-for="item in interval.items"
                  :key="item.id"
                >
                  <div class="md-list-item-text">
                    {{ item.name }}
                  </div>

                  <md-button
                    class="md-icon-button md-list-action md-accent"
                    @click="() => deleteInterval(interval, item)"
                  >
                    <md-icon>remove</md-icon>
                  </md-button>
                </md-list-item>
              </md-list>
            </md-list-item>
          </md-list>

          <md-button
            class="md-fab md-primary md-mini md-fab-bottom-right"
            title="add inverval"
            @click="showIntervalDialog = true"
          >
            <md-icon>add</md-icon>
          </md-button>

          <add-interval-dialog
            :showIntervalDialog="showIntervalDialog"
            @cancel="showIntervalDialog = false"
            @save="addInterval"
          />
        </div>
      </div>

      <div class="loading" v-else>
        <md-progress-spinner md-mode="indeterminate" v-if="state === STATES.loading"></md-progress-spinner>
        <md-icon class="md-size-5x" v-if="state === STATES.success">check</md-icon>
        <md-icon class="md-size-5x" v-if="state === STATES.error">close</md-icon>
      </div>
    </md-dialog-content>

    <md-dialog-actions>
      <md-button class="md-primary" @click="closeDialog(false)">Close</md-button>
      <md-button class="md-primary" @click="Save" :disabled="state !== STATES.loaded">Save</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
import { CONFIG_MONITORING_PROFILE_DIALOG } from "../../js/constants";
import { SpinalBmsEndpoint } from "spinal-model-bmsnetwork";
import AddIntervalDialog from "./addIntervalDialog.vue";
import opcuaProfileService from '../../js/profile_service';
import * as lodash from "lodash";

const defaultIntervals = [
    { name: "30s", value: 30000, items: [] },
    { name: "1min", value: 60000, items: [] },
    { name: "5min", value: 300000, items: [] },
]

export default {
  name: CONFIG_MONITORING_PROFILE_DIALOG,
  props: ["onFinised"],
  components: {
    "add-interval-dialog": AddIntervalDialog,
  },
  data() {
    this.STATES = {
      loading: 1,
      loaded: 2,
      success : 3,
      error : 4
    };

    this.spinalNodesObjects = {};
    
    this.old_endpoints = {};
    this.old_intervals = {};
    this.filterBounced = lodash.debounce(this.filterEndpoint.bind(this), 200);

    return {
      showDialog: true,
      state: this.STATES.loading,
      searchText: "",
      context: null,
      selectedNode: null,

      endpoints: [],
      endpointSelectedList: [],
      endpointsFiltered : [],


      intervalsList: defaultIntervals,
      intervalSelected: null,
      
      showIntervalDialog: false,
      closeMenu: true,
      intervalToAdd: "",
    };
  },
  mounted(){
    this.filterBounced();
  },
  methods: {
    async opened({ graph, context, selectedNode, organ }) {
      this.context = context;
      this.selectedNode = selectedNode;
      // this.organ = organ;
      this.state = this.STATES.loading;
      const [endpoints, intervals] = await this.initializate(selectedNode);
      
      this.endpoints = endpoints;
      this.intervalsList = intervals;

      this.state = this.STATES.loaded;
    },

    removed(option) {
      if (option.closeResult) {
      }
      this.showDialog = false;
    },

    closeDialog(closeResult) {
      if (typeof this.onFinised === "function") {
        this.onFinised({ closeResult });
      }
    },

    async initializate(selectedNode) {
      await opcuaProfileService.init();
      const promises = [ this.getAllEndpoints(selectedNode), this.getIntervals(selectedNode)];
      return Promise.all(promises);
    },

    async getAllEndpoints(node) {
      const items = await opcuaProfileService.getItems(node);
      return items.map(n => {
        this.spinalNodesObjects[n.getId().get()] = n;
        const info = n.info.get();
        this.old_endpoints[info.id] = n;
        return info;
      })
    },

    async getIntervals(selectedNode) {
      const intervals = await opcuaProfileService.getIntervals(selectedNode);
      if(intervals.length === 0) return defaultIntervals;

      return intervals.reduce((list, interval) => {
        const node = interval.node;
        const info = node.info.get();
        const nodeId = info.id;
        
        this.old_intervals[nodeId] = { node, children : {}};
        this.spinalNodesObjects[nodeId] = node;

        info.items = interval.children.map(child => {
          
          const childInfo = child.info.get();
          this.spinalNodesObjects[childInfo.id] = child;
          this.old_intervals[nodeId].children[childInfo.id] = child;
          return childInfo; 
        });

        list.push(info);
        return list;
      }, [])
    },

    selectEndpoint(endpoint) {
      const id = endpoint.id;
      if (this.isSelected(endpoint)) {
        this.endpointSelectedList = this.endpointSelectedList.filter((el) => el !== id);
      } else {
        this.endpointSelectedList = [...this.endpointSelectedList, id];
      }
    },

    isSelected(e) {
      return this.endpointSelectedList.includes(e.id);
    },

    addInterval(data) {
      const interval = Number(data.value);
      if (!isNaN(interval)) {
        const found = this.intervalsList.find((el) => el.name == interval);
        if (!found) this.intervalsList = [...this.intervalsList, data];
      }

      if (this.showIntervalDialog) this.showIntervalDialog = false;
    },

    selectInterval(interval) {
      this.intervalSelected = interval;
    },

    interValIsSelected(intervalId) {
      return this.intervalSelected && this.intervalSelected.value == intervalId;
    },

    addToInterList(intervalSelected) {
      if(!intervalSelected) intervalSelected = this.intervalSelected;

      const endpoints = JSON.parse(JSON.stringify(this.endpoints));
      const selectedIds = JSON.parse(JSON.stringify(this.endpointSelectedList));

      const { list, selected } = this._extractSelectedItem(endpoints, selectedIds);

      this.endpoints = list;
      this.endpointSelectedList = [];

      intervalSelected.items = [...intervalSelected.items, ...selected];

      this.intervalSelected = intervalSelected; 
    },

    deleteInterval(interval, item) {
      if (!item) {
        this.endpoints = [...this.endpoints, ...interval.items];
        this.intervalsList = this.intervalsList.filter(
          (el) => el.value !== interval.value
        );
      } else {
        this.endpoints = [...this.endpoints, item];
        interval.items = interval.items.filter((el) => el.id !== item.id);
      }
    },

    _extractSelectedItem(endpoints, selectedIds) {
      return endpoints.reduce(
        (obj, item) => {
          const index = selectedIds.indexOf(item.id);
          if (index !== -1) {
            obj.selected.push(item);
            selectedIds.splice(index, 1);
          } else {
            obj.list.push(item);
          }

          return obj;
        },
        { list: [], selected: [] }
      );
    },

    dragItems(id) {
      if(!this.endpointSelectedList.includes(id)) {
        this.endpointSelectedList = [...this.endpointSelectedList, id];
      }
    },

    dropItems(interval) {
      this.addToInterList(interval);
    },

    Save() {
      this.state = this.STATES.loading;

      const { toAdd , toRemove } = this.getEndpointsModifications();
      const intervalsModifications = this.getIntervalModifications();

      const promises1 = intervalsModifications.map(el => {
        const intervalNode = this.spinalNodesObjects[el.id];
        if(!intervalNode) return opcuaProfileService.addIntervalToProfile(this.selectedNode, el, el.toAdd);

        return Promise.all([opcuaProfileService.addItemsToInterval(intervalNode, el.toAdd), opcuaProfileService.removeItemsFromInterval(intervalNode, el.toRemove)])
      })

      const promises2 = [
        opcuaProfileService.addItemToList(this.selectedNode, toAdd),
        opcuaProfileService.removeItemsFromList(this.selectedNode, toRemove)
      ]

      return Promise.all([...promises1, ...promises2]).then(() => {
        this.state = this.STATES.success;
      }).catch((err) => {
        console.error(err);
        this.state = this.STATES.error;
      });
    },

    getEndpointsModifications() {
      const toAdd = [];
      const old_endpointsCopy = Object.assign({}, this.old_endpoints);

      for (const endpoint of this.endpoints) {
        const node = old_endpointsCopy[endpoint.id]; 
        if(node) delete old_endpointsCopy[endpoint.id];
        else toAdd.push(this.spinalNodesObjects[endpoint.id]);
      }

      const toRemove = Array.from(Object.values(old_endpointsCopy));

      return {toAdd, toRemove};
    },

    getIntervalModifications() {

      const checkIfIsMod = (items, childrenObj) =>  {
        const childrenCopy = Object.assign({}, childrenObj);
        const toAdd = [];

        for (const item of items) {
          const node = childrenCopy[item.id]; 
          if(node) delete childrenCopy[item.id];
          else toAdd.push(this.spinalNodesObjects[item.id]);
        }

        const toRemove = Array.from(Object.values(childrenCopy));

        return { toAdd, toRemove };
      }

      const intervals = []

      for (const interval of this.intervalsList) {
        if(!interval.id || !this.old_intervals[interval.id]) {
          intervals.push({
            name : interval.name,
            value: interval.value,
            toAdd : interval.items.map(el => this.spinalNodesObjects[el.id]),
            toRemove: []
          })
        } else {
          const oldInterval = this.old_intervals[interval.id];
          const childrenObj = (oldInterval && oldInterval.children) || {};

          const {toAdd, toRemove} = checkIfIsMod(interval.items, childrenObj)

          if(toAdd.length > 0 || toRemove.length > 0) {
            intervals.push({
              id: interval.id,
              name : interval.name,
              value: interval.value,
              toAdd,
              toRemove
            })
          }
        }
      }

      

      return intervals;
    },

    filterEndpoint() {
      if(this.searchText.trim().length > 0) 
        this.endpointsFiltered = this.endpoints.filter(el => el.name.toLowerCase().includes(this.searchText.trim().toLowerCase()));
      else
        this.endpointsFiltered = Object.assign([], this.endpoints);
    },

    selectAll() {
      const ids = this.endpointsFiltered.map(el => el.id);
      this.endpointSelectedList = [...this.endpointSelectedList, ...ids];
    },

    deselectAll() {
      this.endpointSelectedList = [];
    }

  },

  watch : {
    searchText() {
      this.filterBounced();
    },

    endpoints() {
      this.filterBounced();
    }

  }
};
</script>

<style lang="scss">
$maxWith : 950px;

.dialogContent {
  max-width: $maxWith;
}

.configContainer {
  width: $maxWith;
  height: 600px;

  .title {
    text-align: center;
  }

  .loadedContent {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;

    .list_div {
      // width: calc(50% - 30px);
      width: 49%; 
      height: 100%;
      border: 1px solid grey;
      border-radius: 10px;
      // overflow: auto;

      .div_title {
        width: 100%;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid grey;
        padding: 0 5px;
      }

      .div_title.endpoint_div_title {
        display: flex;
        justify-content: space-between !important;
        .action {
          display: flex;
          align-items: center;
        }
      }

      .item_list {
        height: calc(100% - 50px);
        overflow: auto;
      }

      

      .listItem {
        height: 50px !important;
        margin-bottom: 5px;

        .md-list-item-container {
          height: 50px !important;
        }
      }
    }

    .switchButtons {
      width: 50px;
      height: 100%;
      border: 1px solid grey;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .md-list.md-double-line {
    .md-list-item-content {
      min-height: unset !important;
      font-size: 0.9em;
    }
  }

  .pathDiv {
    font-size: 0.8em;
    margin-top: 3px;
  }
}

.menuContainer {
  width: 250px;
  padding: 0 10px;
  .menuTitle {
    font-size: 1em;
  }

  .menuContent {
  }

  .menuAction {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

.selected {
  background: blue;
}
</style>
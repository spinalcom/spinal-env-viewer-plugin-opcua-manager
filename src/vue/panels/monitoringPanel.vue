<template>
  <div class="_panel_container">
    <div class="header">
      <md-button class="md-icon-button md-primary"  @click="startAll">
        <md-icon >not_started</md-icon>
      </md-button>
      
      <md-button class="md-icon-button md-accent"  @click="stopAll">
        <md-icon>stop</md-icon>
      </md-button>

      <md-button class="md-icon-button md-primary"  @click="restartAll">
        <md-icon>restart_alt</md-icon>
      </md-button>
    </div>

    <md-list class="listDiv md-double-line">
      <md-list-item v-for="device in devices" :key="device.id">
        <div class="md-list-item-text">
          <span>{{device.name}}</span>
          <span :class="`${getState(device.id)} subtypes`" >{{getState(device.id)}}</span>
        </div>


        <div class="md-list-action">
          <md-button class="md-icon-button md-primary" :disabled="disableBtn(Button_names.start, device.id)" @click="() => start(device.id)">
            <md-icon >not_started</md-icon>
          </md-button>
          
          <md-button class="md-icon-button md-accent" :disabled="disableBtn(Button_names.stop, device.id)" @click="() => stop(device.id)">
            <md-icon>stop</md-icon>
          </md-button>

          <md-button class="md-icon-button md-primary" :disabled="disableBtn(Button_names.restart, device.id)" @click="() => restart(device.id)">
            <md-icon>restart_alt</md-icon>
          </md-button>
        </div>
        
      </md-list-item>

    </md-list>
  </div>
</template>

<script>
import { MONITORING_PANEL_NAME } from "../../js/constants";
import { SpinalOPCUAListener } from "spinal-model-opcua";
import { SpinalBmsDevice, SpinalBmsNetwork } from 'spinal-model-bmsnetwork';
import { SPINAL_RELATION_PTR_LST_TYPE } from "spinal-model-graph";
import opcuaProfileService, { CONTEXT_TO_PROFILE_RELATION } from '../../js/profile_service';


export default {
  name: MONITORING_PANEL_NAME,
  data() {

    this.context;
    this.graph;
    this.organ;
    this.network;

    this.STATES = {
      loading : 1,
      loaded : 2, 
      error : 3
    }

    this.Button_names = {
      start : 1,
      stop : 2,
      restart : 3
    }

    this.STEPS = Object.freeze({
      serverInfo: "1",
      discovering: "2",
      creation: "3",
    });

    this.nodes = {};
    this.listeners = {};

    return {
      state: this.STATES.loading,
      step: this.STEPS.serverInfo,
      devices : []
    };
  },
  
  methods: {
    async opened(params) {
      this.graph = params.graph;
      this.context = params.context;
      this.organ = params.organ;
      this.network = params.network;
      this.devices = await this.getDevices(params.selectedNode);
    },

    closed() {},

    async start(deviceId, globalUpdate) {
      const listener = this.listeners[deviceId];
      if(listener) {
        listener.monitored.set(true);
        if(!globalUpdate) this.$forceUpdate()
        return;
      }

      const node = this.nodes[deviceId];
      const profile = await opcuaProfileService.getProfileLinked(node);

      if(!profile) return;

      let model = new SpinalOPCUAListener(this.graph,this.context, this.organ, this.network, node, profile);
      await model.addToDevice();

      this.listeners[deviceId] = model;
      if(!globalUpdate) this.$forceUpdate()
    },

    stop(deviceId, globalUpdate) {
      const listener = this.listeners[deviceId];
      
      if(listener) {
        if(!globalUpdate) this.$forceUpdate()
        listener.monitored.set(false);
      }

    },

    restart(deviceId, globalUpdate) {
      return new Promise(async (resolve) => {
        await this.stop(deviceId, globalUpdate);
      
        setTimeout(async () => {
          await this.start(deviceId, globalUpdate);
          resolve(true);
        }, 1000);
      });
      
    },

    async getDevices(selectedNode) {
      const type = selectedNode.getType().get();
      let devices = [];
      
      if(type === SpinalBmsNetwork.nodeTypeName) devices = await selectedNode.getChildren(SpinalBmsDevice.relationName);
      else if(type === SpinalBmsDevice.nodeTypeName) devices = [selectedNode];

      const promises = devices.map(async device => {
        const id = device.getId().get();
        this.nodes[id] = device;
        const listener = await this.getListnerModel(device);
        if(listener) this.listeners[id] = listener;
        return device.info.get();
      })

      return Promise.all(promises);
      
    },

    disableBtn(button, nodeId) {
      const node = this.nodes[nodeId];
      if(!node || !node.hasRelation(CONTEXT_TO_PROFILE_RELATION, SPINAL_RELATION_PTR_LST_TYPE)) return true;

      const listener = this.listeners[nodeId];

      switch (button) {
        case this.Button_names.start:
          if(listener && listener.monitored && listener.monitored.get()) return true;
          return false;

        case this.Button_names.stop:
          if(!listener || !listener.monitored || !listener.monitored.get()) return true;
          return false;

        case this.Button_names.restart:
          if(listener && listener.monitored && listener.monitored.get())  return false;  
          return true;
      }
    },

    getListnerModel(device) {
      if(device.info.listener) {
        return new Promise((resolve, reject) => {
          try {
            device.info.listener.load((data) => resolve(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    },

    getState(nodeId) {
      const node = this.nodes[nodeId];

      if(!node || !node.hasRelation(CONTEXT_TO_PROFILE_RELATION, SPINAL_RELATION_PTR_LST_TYPE)) return "No_profile";
      
      const listener = this.listeners[nodeId];

      return listener && listener.monitored && listener.monitored.get() ? "Monitored" : "Stopped";
    },

    startAll() {},

    stopAll() {},

    restartAll() {},

  },
  
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons");
</style>

<style scoped lang="scss">
._panel_container {
  width: 100%;
  height: calc(100% - 15px);

  .header {
    width: 99%;
    height: 50px;
    border: 1px solid grey;
    margin: auto
  }

  .listDiv {
    width: 100%;
    height: calc(100% - 50px);
    background: transparent;

    .subtypes {
      font-size: 0.8em;
      font-weight: bold;
    }

    .Monitored {
      color: green !important;
    }

    .Stopped {
      color: red !important;
    }
  }

  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  
}



</style>

<style>
._panel_container  * {
  box-sizing: border-box !important;
}
</style>
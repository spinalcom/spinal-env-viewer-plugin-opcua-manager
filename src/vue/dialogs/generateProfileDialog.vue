<template>
  <md-dialog
    class="generateContainer"
    :md-active.sync="showDialog"
    @md-closed="closeDialog(false)"
  >
    <md-dialog-title class="title">
      Generate OPCUA profile
    </md-dialog-title>

    <md-dialog-content>

      <md-field v-if="state === STATES.loaded">
        <label>name</label>
        <md-input v-model="profileName"></md-input>
      </md-field>

      <md-progress-spinner md-mode="indeterminate" v-else-if="state === STATES.loading"></md-progress-spinner>

      <md-icon class="md-size-5x" v-else-if="state === STATES.generated">done</md-icon>
      <md-icon class="md-size-5x" v-else-if="state === STATES.failed">close</md-icon>
    </md-dialog-content>

    <md-dialog-actions>
      <md-button class="md-primary" @click="closeDialog(false)">Close</md-button>
      <md-button class="md-primary" @click="generateProfile" :disabled="disableOKBtn">Generate</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
import { CONFIG_MONITORING_PROFILE_DIALOG } from "../../js/constants";
import AddIntervalDialog from "./addIntervalDialog.vue";
import { opcuaProfileService } from "../../js/profile_service";

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
      generated : 3,
      failed : 4
    };
    return {
      context: null,
      selectedNode: null,
      showDialog: true,
      profileName : "",
      state : this.STATES.loading
    };
  },
  methods: {
    async opened({ context, selectedNode }) {
      this.state = this.STATES.loading;
      this.context = context;
      this.selectedNode = selectedNode;
      this.profileName = selectedNode.getName().get();
      this.state = this.STATES.loaded;
    },


    async generateProfile() {
       try {
          this.state = this.STATES.loading;
          await opcuaProfileService.generateProfile(this.selectedNode, this.context, this.profileName);
          this.state = this.STATES.generated;
        } catch (error) {
          console.error(error);
          this.state = this.STATES.failed;
        }
    },


    async removed(option) {
      if (option.closeResult) {
      }

      this.showDialog = false;
    },

    closeDialog(closeResult) {
      if (typeof this.onFinised === "function") {
        this.onFinised({ closeResult });
      }
    },


  },
  computed : {
    disableOKBtn() {
      return this.state !== this.STATES.loaded;
    }
  }
};
</script>

<style lang="scss">
.generateContainer {
  width: 300px;
  height: 260px;
  .title {
    text-align: center;
  }

  
}

</style>
<template>
  <!-- <md-dialog-prompt
    :md-active.sync="showIntervalDialog"
    v-model="intervalToAdd"
    md-title="Add Interval"
    md-input-placeholder="tape yout interval"
    md-confirm-text="OK"
    @md-cancel="intervalToAdd = ''"
    @md-confirm="addInterval"
  /> -->
  <md-dialog :md-active.sync="showIntervalDialog">
    <md-dialog-title>Add Interval</md-dialog-title>

    <md-dialog-content>
      <md-field>
        <label>Name</label>
        <md-input v-model="data.name"></md-input>
      </md-field>

      <md-field>
        <label>interval in ms</label>
        <md-input type="number" v-model="data.value"></md-input>
      </md-field>
    </md-dialog-content>

    <md-dialog-actions>
      <md-button class="md-accent" @click="cancel">Close</md-button>
      <md-button class="md-primary" @click="confirm">Save</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
export default {
  props: {
    showIntervalDialog: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      data: {
        name: "",
        value: 0,
        items: [],
      },
    };
  },
  methods: {
    cancel() {
      this.$emit("cancel");
    },

    confirm() {
      this.$emit("save", this.data);
    },
  },
};
</script>

<style>
</style>
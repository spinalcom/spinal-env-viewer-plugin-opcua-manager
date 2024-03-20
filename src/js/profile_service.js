import { SPINAL_RELATION_PTR_LST_TYPE, SpinalGraphService, SpinalNode } from "spinal-env-viewer-graph-service";
import Utils from "./utilities";
import { SpinalBmsDevice } from "spinal-model-bmsnetwork";

// NAMES
export const CONTEXT_NAME = "OPCdeviceProfileContext";
export const ITEMS_GROUP_NAME = "Item_list";
export const SUPERVISION_NAME = "Supervision";

// TYPES
export const CONTEXT_TYPE = "OPCUA Profile";
export const PROFILE_TYPE = "OPCUADeviceProfile";
export const ITEM_LIST_TYPE = "itemList";
export const ITEM_TYPE = "item";
export const SUPERVISION_TYPE = "Supervision";
export const INTERVAL_TYPE = "Interval";

// RELATIONS
export const CONTEXT_TO_PROFILE_RELATION = "hasProfile";
export const PROFILE_TO_ITEMS_GROUP = "hasItems";
export const PROFILE_TO_SUPERVISION = "hasSupervision";
export const SUPERVISION_TO_INTERVAL = "hasIntervalTime";
export const ITEM_LIST_TO_ITEM = "hasItem";
export const INTERVAL_TO_ITEM = "hasItem";



class OPCUAProfileService {

    constructor() {
        this.context = null;
    }

    async init() {
        this.context = await this.getContext(true);
        return this.context;
    }

    async getContext(createIfNotExist = false) {
        let context = SpinalGraphService.getContext(CONTEXT_NAME);
        if (!context && createIfNotExist)
            context = await SpinalGraphService.addContext(CONTEXT_NAME, CONTEXT_TYPE);
        
        return context;
    }

    // profile

    async linkProfileToDevice(devices, profile) {
        if (!this.context) await this.init();

        if(profile.getType().get() !== PROFILE_TYPE) throw new Error("profile must be " + PROFILE_TYPE + " Type")
        if (!Array.isArray(devices)) devices = [devices];

        const promises = devices.map(async device => {
            if (device.getType().get() === SpinalBmsDevice.nodeTypeName) {
                await this._removeOldProfile(device);
                return device.addChildInContext(profile, CONTEXT_TO_PROFILE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, this.context); 
            }  

            return;
        })

    }

    async getProfiles() {
        if (!this.context) await this.init();
        return this.context.getChildren(CONTEXT_TO_PROFILE_RELATION);
    }

    async createProfile(profileName, items = []) {
        const {profile, itemList} = await this._GenProfileNode(profileName);
        const itemsNodes = this._createItemsNode(items);

        const promises = itemsNodes.map(el => itemList.addChildInContext(el, ITEM_LIST_TO_ITEM, SPINAL_RELATION_PTR_LST_TYPE, this.context));

        return Promise.all(promises).then((result) => {
            return this.context.addChildInContext(profile, CONTEXT_TO_PROFILE_RELATION, SPINAL_RELATION_PTR_LST_TYPE, this.context);
        });
    }

    async generateProfile(deviceNode, context, name) {
        if (!name) name = deviceNode.getName().get();

        const endpoints = [];
            
        await Utils.browseEndpoints(deviceNode, context, (n) => endpoints.push(n.info.get()));
        console.log("endpoints", endpoints)
        return this.createProfile(name, endpoints);      
    }

    async getProfileLinked(deviceNode) {
        const children = await deviceNode.getChildren(CONTEXT_TO_PROFILE_RELATION);
        return children[0];
    }

    // end profile


    // Items

    async getItems(profile) {
        const itemListNode = await this.getItemListNode(profile);
        if (itemListNode) return itemListNode.getChildren(ITEM_LIST_TO_ITEM);

        return [];
    }

    async removeItemsFromList(profile, itemsToRemove) {
        if (!this.context) await this.init();

        const itemListNode = await this.getItemListNode(profile);
        if (itemListNode) {
            const promises = itemsToRemove.map(node => itemListNode.removeChild(node, ITEM_LIST_TO_ITEM, SPINAL_RELATION_PTR_LST_TYPE));
            return Promise.all(promises);
        }
    }

    async addItemToList(profileNode, itemsNodes) {
        if (!this.context) await this.init();

        const itemListNode = await this.getItemListNode(profileNode);
        if (itemListNode) {
            const promises = itemsNodes.map(node => itemListNode.addChildInContext(node, ITEM_LIST_TO_ITEM, SPINAL_RELATION_PTR_LST_TYPE, this.context));
            return Promise.all(promises);
        }
    }

    async getItemListNode(profile) {
        if (!this.context) await this.init();
        const children = await profile.getChildrenInContext(this.context);
        return children.find(el => el.getName().get() === ITEMS_GROUP_NAME);
    }

    // end Items


    // intervals
    async getIntervals(profile) {
        const supervisionNode = await this.getSupervisionNode(profile);

        if (supervisionNode) {
            const intervals = await supervisionNode.getChildren(SUPERVISION_TO_INTERVAL);
            const promises = intervals.map(async node => {
                return {
                    node,
                    children: await node.getChildren(INTERVAL_TO_ITEM)
                }
            })

            return Promise.all(promises);
        }

        return [];
    }

    async addIntervalToProfile(profile, intervalInfo, itemsNodes = []) {
        if (!this.context) await this.init();

        const supervisionNode = await this.getSupervisionNode(profile);
        
        const intervalNode = new SpinalNode(intervalInfo.name, INTERVAL_TYPE);
        intervalNode.info.add_attr({ value: intervalInfo.value });

        await supervisionNode.addChildInContext(intervalNode, SUPERVISION_TO_INTERVAL, SPINAL_RELATION_PTR_LST_TYPE, this.context);

        return this.addItemsToInterval(intervalNode, itemsNodes);
    }


    async addItemsToInterval(intervalNode, itemsNodes) {
        if (!this.context) await this.init();
        if (!Array.isArray(itemsNodes)) itemsNodes = [itemsNodes];

        const promises = itemsNodes.map(node => intervalNode.addChildInContext(node, INTERVAL_TO_ITEM, SPINAL_RELATION_PTR_LST_TYPE, this.context));

        return Promise.all(promises);
    }

    async removeItemsFromInterval(intervalNode, itemsNodes) {
        if (!this.context) await this.init();
        if (!Array.isArray(itemsNodes)) itemsNodes = [itemsNodes];

        const promises = itemsNodes.map(node => intervalNode.removeChild(node, INTERVAL_TO_ITEM, SPINAL_RELATION_PTR_LST_TYPE));

        return Promise.all(promises);
    }


    async getSupervisionNode(profile) {
        if (!this.context) await this.init();
        const children = await profile.getChildrenInContext(this.context);
        return children.find(el => el.getName().get() === SUPERVISION_NAME);
    }
    // end intervals

    


    // private functions

    async _GenProfileNode(profileName) {
        if (!this.context) await this.init();

        const profile = new SpinalNode(profileName.trim(), PROFILE_TYPE);
        const itemList = new SpinalNode(ITEMS_GROUP_NAME, ITEM_LIST_TYPE);
        const supervision = new SpinalNode(SUPERVISION_NAME, SUPERVISION_TYPE);

        return Promise.all([
            profile.addChildInContext(itemList, PROFILE_TO_ITEMS_GROUP, SPINAL_RELATION_PTR_LST_TYPE, this.context),
            profile.addChildInContext(supervision, PROFILE_TO_SUPERVISION, SPINAL_RELATION_PTR_LST_TYPE, this.context)
        ]).then(() => {
            return {profile, supervision, itemList};  
        })
    }

    _createItemsNode(items) {
        if (!Array.isArray(items)) items = [items];

        return items.map(item => {
            const node = new SpinalNode(item.name, ITEM_TYPE)
            node.info.add_attr({ idNetwork : item.idNetwork });
            return node;
        })
    }

    async _removeOldProfile(device) {
        const hasProfile = device.hasRelation(CONTEXT_TO_PROFILE_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
        if(hasProfile)  return device.removeRelation(CONTEXT_TO_PROFILE_RELATION, SPINAL_RELATION_PTR_LST_TYPE);
    }


}


const opcuaProfileService = new OPCUAProfileService();

export default opcuaProfileService;
export { opcuaProfileService }
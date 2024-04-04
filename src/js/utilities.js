import { SpinalBmsDevice, SpinalBmsEndpoint, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraph, SpinalGraphService } from "spinal-env-viewer-graph-service";
import { OPCUA_ORGAN_TYPE } from "spinal-model-opcua/dist/constants";


export default class Utils {
    static async getBmsDevices(contextId, id) {
        const info = SpinalGraphService.getInfo(id);
        if (info.type.get() === SpinalBmsDevice.nodeTypeName) {
            return [info];
        }

        if (info.type.get() === SpinalBmsNetwork.nodeTypeName) {
            return SpinalGraphService.getChildren(id, [SpinalBmsDevice.relationName]);
        }

        return SpinalGraphService.findInContext(id, contextId, (node) => {
            if (node.getType().get() === SpinalBmsDevice.nodeTypeName) {
                SpinalGraphService._addNode(node);
                return true;
            }
            return false;
        });
    }

    static async getNetwork(id, contextId) {
        const realNode = SpinalGraphService.getRealNode(id);
        if (!realNode) return;
        if (realNode.getType().get() === SpinalBmsNetwork.nodeTypeName)
            return realNode;

        return realNode
            .getParents([SpinalBmsDevice.relationName])
            .then((parents) => {
                const found = parents.find((el) => {
                    if (el && el.contextIds) {
                        return el.contextIds[contextId];
                    }
                });

                if (found) SpinalGraphService._addNode(found);
                return found;
            });
    }

    static async getOrgan(networkId, contextId) {
        const node = SpinalGraphService.getRealNode(networkId);
        const context = SpinalGraphService.getRealNode(contextId);

        if(node.getType().get() === OPCUA_ORGAN_TYPE) return node;
        
        if (!node.belongsToContext(context)) return;

        const organs = await SpinalGraphService.getChildrenInContext(contextId, contextId);

        for (const organ of organs) {
            const exist = await this.existInTree(contextId, organ.id.get(), networkId);
            if (exist) return SpinalGraphService.getRealNode(organ.id.get());
        }

        // const realNode = SpinalGraphService.getRealNode(networkId);
        // return realNode
        //     .getParents([SpinalBmsNetwork.relationName])
        //     .then((parents) => {
        //         const found = parents.find((el) => {
        //             if (el && el.contextIds) {
        //                 return el.contextIds[contextId];
        //             }
        //         });

        //         if (found) {
        //             return found.getElement();
        //         }
        //     });
    }

    static async findNetwork(organId, contextId, nodeId) {
        const organ = SpinalGraphService.getRealNode(organId);
        const context = SpinalGraphService.getRealNode(contextId);
        const node = SpinalGraphService.getRealNode(nodeId);
        if (!node.belongsToContext(context) || !organ.belongsToContext(context)) return;


        const networks = await organ.getChildrenInContext(context);

        for (const network of networks) {
            const exist = await this.existInTree(contextId, network.getId().get(), nodeId);
            if (exist) return network;
        }

    }


    static waitModelReady(model) {
        return new Promise((resolve, reject) => {
            const timeId = setInterval(() => {
                if (FileSystem._objects[model._server_id] === model) {
                    console.log("model ready", FileSystem._objects[model._server_id]);
                    clearInterval(timeId);
                    resolve(model);
                }
            }, 300);
        });
    }

    static async consumeBatch(promises, batchSize = 10) {
        let index = 0;
        const result = [];
        while (index < promises.length) {
            let endIndex = index + batchSize;
            if (promises.length <= endIndex) endIndex = promises.length;
            const slice = promises.slice(index, endIndex);
            const resProm = await Promise.all(slice.map((e) => e()));
            result.push(...resProm);
            index = endIndex;
        }
        return result;
    }

    static async existInTree(contextId, startId, nodeToFindId) {
        let queue = await SpinalGraphService.getChildrenInContext(startId, contextId)
        let exist = false;

        while (queue.length > 0 && !exist) {
            let found = queue.find((el) => el.id.get() === nodeToFindId);
            if (found) exist = true;
            else {
                const promises = queue.map(el => SpinalGraphService.getChildrenInContext(el.id.get(), contextId));
                const children = await Promise.all(promises);
                queue = children.flat();
            }
        }

        return exist
    }

    static browseEndpoints(node, context, callback) {
        let endpoints = [];
        
        try {
           return node.findInContext(context, (n) => {
               if (n.getType().get() === SpinalBmsEndpoint.nodeTypeName) {
                    if (typeof callback === "function") callback(n);
                    endpoints.push(n);
                    return true;
                }

                return false;
            }) 
        } catch (error) {
            return endpoints;
        }
               
    }
}

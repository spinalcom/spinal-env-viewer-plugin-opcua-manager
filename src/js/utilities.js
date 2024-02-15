import { SpinalBmsDevice, SpinalBmsNetwork } from "spinal-model-bmsnetwork";
import { SpinalGraphService } from "spinal-env-viewer-graph-service";


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

    static getOrgan(networkId, contextId) {
        const realNode = SpinalGraphService.getRealNode(networkId);
        return realNode
            .getParents([SpinalBmsNetwork.relationName])
            .then((parents) => {
                const found = parents.find((el) => {
                    if (el && el.contextIds) {
                        return el.contextIds[contextId];
                    }
                });

                if (found) {
                    return found.getElement();
                }
            });
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
}

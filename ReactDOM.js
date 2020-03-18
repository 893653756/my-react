/**
 * dom渲染
 */
import * as _ from './util';
import { ELEMENT_NODE_TYPE, COMPONENT_ID, VELEMENT, VCOMPONENT } from './constant';



/**
 * 
 * @param {object} vndoe 
 * @param {dom} container 
 * @param {function} callback 
 */
export function render(vndoe, container, callback) {
    return renderTreeIntoContainer(vndoe, container, callback)
}

function isValidContainer(node) {
    return (node && (node.nodeType === ELEMENT_NODE_TYPE))
}

let pendingRendering = {}; // ?
let vnodeStore = {}; // ?

function renderTreeIntoContainer(vndoe, container, callback, parentContext) {
    if (!vndoe.vtype) {
        throw new Error(`cannot render ${ vnode } to container`)
    }
    if (!isValidContainer(container)) {
        throw new Error(`container ${container} is not a DOM element`)
    }
    let id = container[COMPONENT_ID] || (container[COMPONENT_ID] = _.getUid())
    let argsCache = pendingRendering[id];
    // 缓存
    if (argsCache) {
        if (argsCache === true) {
            pendingRendering[id] = argsCache = {
                vnode, callback, parentContext
            }
        } else {
            argsCache.vnode = vnode;
            argsCache.parentContext = parentContext;
			argsCache.callback = argsCache.callback ? _.pipe(argsCache.callback, callback) : callback
        }
        return;
    }
    pendingRendering[id] = true;
    let oldVnode = null;
    let rootNode = null;
    // 对比
    if (oldVnode =vnodeStore[id]) {
        rootNode = compareTwoVnodes(oldVnode, vnode, container.firstChild, parentContext)
    } else {
        rootNode = initVnode(vnode, parentContext);
        // 移除容器原来的子节点
        var childNode = null;
        while (childNode = container.lastChild) {
            container.removeChild(childNode)
        }
        container.appendChild(rootNode);
    }
    vnodeStore[id] = vnode;
    let isPending = updateQueue.isPending;
    updateQueue.isPending = true;
    clearPending();
    argsCache = pendingRendering[id];
    delete pendingRendering[id];

    let result = null;
    if (typeof argsCache === 'object') {
        result = renderTreeIntoContainer(argsCache.vnode, container, argsCache.callback, argsCache.parentContext)
    } else if (vnode.vtype === VELEMENT) {
        result = rootNode;
    } else if (vnode.vtype === VCOMPONENT) {
        result = rootNode.cache[vnode.uid]
    }
    if (!isPending) {
        updateQueue.isPending = false;
        updateQueue.batchUpdate();
    }
    if (callback) {
        callback.call(result)
    }
    return result;
}
import { VSTATELESS, VCOMPONENT, VELEMENT } from "./constant";
import * as _ from './util';
let refs = null;
/**
 * 创建vnode
 * @param {number} vtype 
 * @param {string|function} type 
 * @param {object} props 
 * @param {stirng} key 
 * @param {any} ref 
 */
export function createVnode(vtype, type, props, key, ref) {
    let vndoe = {
        vtype: vtype,
        type: type,
        props: props,
        refs: refs,
        key: key,
        ref: ref,
    }
    if (vtype === VSTATELESS || vtype === VCOMPONENT) {
        vndoe.uid = _.getUid();
    }
    return vndoe;
}

/**
 * 初始化vnode
 */
export function initVnode(vnode, parentContext) {
    // 初始化 不同 vtype 执行不同的函数
    let { vtype } = vnode;
    let ndoe = null;
    if (!vtype) { // 文本节点
        node = document.createTextNode(vnode);
    } else if (vtype === VELEMENT) { // dom原生节点
        node = initVelem(vnode, parentContext);
    } else if (vtype === VCOMPONENT) {
        node = initVcomponent(vnode, parentContext);
    } else if (vtype === VSTATELESS) {
        node = initVstateless(vnode, parentContext);
    }
    return node;
}

// 初始化原生dom节点
function initVelem(velem, parentContext) {
    let { type, props } = velem;
    let node = document.createElement(type);

    // 初始化 children
    initVchildren(velem, node, parentContext);

    let isCustomComponent = type.indexOf('-') >= 0 || props.is !== null; // ????
    _.setProps(node, props, isCustomComponent);
    if (velem.ref != null) {
        pendingRefs.push(velem);
        pendingRefs.push(node);
    }
    return node;
}

// 遍历children 循环调用initVnode
function initVchildren(velem, node, parentContext) {
    let vchildren = node.vchildren = getFlattenChildren(velem);
    for (let i = 0, len = vchildren.length; i < len; i++) {
        node.appendChild(initVnode(vchildren[i], parentContext))
    }
}

function getFlattenChildren(vnode) {
    let { children } = vnode.props;
    let vchildren = [];
    if (_.isArr(children)) {
        _.flatEach(children, collectChild, vchildren)
    } else {

    }
    return vchildren;
}

function collectChild(child, children) {
    if (child != null && typeof child !== 'boolean') {
        children[children.length] = child;
    }
}

// 初始化 function component
function initVstateless(vstateless, parentContext) {
    let vnode = renderVstateless(vstateless, parentContext);
    let node = initVnode(vnode, parentContext);
    return node;
}

// 函数式组件
function renderVstateless(vstateless, parentContext) {
    let { type: factory, props } = vstateless;
    let componentContext = getContextByTypes(parentContext, factory.contextTypes);
    let vnode = factory(props, componentContext);
    if (vnode && vnode.render) {
        vnode = vnode.render();
    }
    if (!vonde || !vnode.vtype) {
        throw new Error(`@${factory.name}#render:You may have returned undefined, an array or some other invalid object`)
    }
    return vnode;
}

// init class component
function initVcomponent(vcomponent, parentContext) {
    let { type: Comp, props, uid } = vcomponent;
    let componentContext = getContextByTypes(parentContext, Component.contextTypes);
    let component = new Comp(props, componentContext);
    // 获取updater 和 cache
    let { $updater: updater, $cache: cache } = component;
    cache.parentContext = parentContext;
    // 设置 pending
    updater.isPending = true;
    component.props = component.props || props;
    component.context = component.context || componentContext;
    // 生命周期
    if (component.componentWillMount) {
        component.componentWillMount();
        component.state = updater.getState();
    }
    let vnode = renderComponent(component);
    let node = initVnode(vnode, getChildContext(component, parentContext));
    node.cache = node.cache || {};
    node.cache[uid] = component;
    cache.vnode = vnode;
    cache.node = node;
    cache.isMounted = true;
    pendingComponents.push(component);

    if (vcomponent.ref != null) {
        pendingRefs.push(vcomponent);
        pendingRefs.push(component);
    }
    return node;
}

function getContextByTypes(curContext, contextTypes) {
    let context = {};
    if (!contextTypes || !curContext) {
        return context;
    }
    Object.keys(contextTypes).forEach(key => {
        context[key] = curContext[key];
    })
    return context;
}

function getChildContext(component, parentContext) {
    if (component.getChildContext) {
        let curContext = component.getChildContext();
        if (curContext) {
            parentContext = {
                ...parentContext,
                ...curContext
            }
        }
    }
    return parentContext;
}
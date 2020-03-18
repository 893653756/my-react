import { VELEMENT, VCOMPONENT, VSTATELESS } from "./constant";

/**
 * 构建虚拟dom的object
 * @param {string|function} type 组件类型
 * @param {object|null} props 属性
 * @param  {...any} children 子节点
 */
export default function createElement (type, props, ...children) {
    let vtype = null; // 虚拟dom类型
    if (typeof type === 'string') {
        vtype = VELEMENT;
    } else if (typeof type === 'function') {
        if (type && type.isReactComponent) {
            vtype = VCOMPONENT;
        } else {
            vtype = VSTATELESS;
        }
    } else {
        throw new Error(`React.createElement: unexpect type [ ${type} ]`)
    }
    let key = null;
    let ref = null;
    let finalProps = {};
    if (props != null) {
        Object.keys(props).forEach(propKey => {
            if (propKey === 'key') {
                if (props.key !== undefined) {
                    key = `${props.key}`;
                }
            } else if (propKey === 'ref') {
                if (props.ref !== undefined) {
                    ref = props.ref;
                }
            } else {
                finalProps[propKey] = props[propKey];
            }
        })
    }
    finalProps.children = children;
    // 创建 vnode
    return createVnode(vtype, type, finalProps, key, ref);
}
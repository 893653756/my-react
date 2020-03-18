import * as _ from './util';

/**
 * 更新队列
 */
export let updateQueue = {
    updaters: [],
    isPending: false,
    add(updater) {
        this.updaters.push(updater)
    },
    batchUpdate() {
        if (this.isPending) {
            return;
        }
        this.isPending = true;
        let { updaters } = this;
        let updater;
        while (updater = updaters.pop()) {
            updater.updateComponent();
        }
        this.isPending = false;
    }
}

class Updater {
    constructor(instance) {
        this.instance = instance;
        // 待处理状态属数组
        this.pendingStates = [];
        this.pendingCallbacks = [];
        this.isPending = false;
        this.nextProps = this.nextContext = null;
        this.clearCallbacks = this.clearCallbacks.bind(this);
    }
    emitUpdate(nextProps, nextContext) {
        this.nextProps = nextProps;
        this.nextContext = nextContext;
        // receive nextProps!! should update immediately
        nextProps || !updateQueue.isPending
            ? this.updateComponent()
            : updateQueue.add(this)
    }
    updateComponent() {
        let {instance, pendingStates, nextProps, nextContext} = this;
        if (nextProps || pendingStates.length > 0) {
            nextProps = nextProps || instance.props;
            nextContext = nextContext || instance.context;
            this.nextProps = this.nextContext = null;
            // getState 合并所有的state的数据，一次更新
            shouldUpdate(instance, nextProps, this.getState(), nextContext, this.clearCallbacks)
        }  
    }
    addState(nextState) {
        if (nextState) {
            this.pendingStates.push(nextState);
            if (!this.isPending) {
                this.emitUpdate();
            }
        }
    }
    getState() {
        let {instance, pendingStates} = this;
        let { state, props } = instance;
        if (pendingStates.length) {
            state = {...state};
            pendingStates.forEach(nextState => {
                let isReplace = _.isArr(nextState);
                if (isReplace) {
                    nextState = nextState[0];
                }
                if (_.isFn(nextState)) {
                    nextState = nextState.call(instance, state, props);
                }
                if (isReplace) {
                    state = {...nextState};
                } else {
                    state = {
                        ...state,
                        ...nextState
                    }
                }
            })
            pendingStates.length = 0;
        }
        return state;
    }
    clearCallbacks() {
        let {pendingCallbacks, instance} = this;
        if (pendingCallbacks.length > 0) {
            this.pendingCallbacks = [];
            pendingCallbacks.forEach(callback => callback.call(instance))
        }
    }
    addCallback(callback) {
        if (_.isFn(callback)) {
            this.pendingCallbacks.push(callback)
        }
    }
}

/**
 * 组件
 */
export default class Component {
    static isReactComponent = {}
    constructor(props, context) {
        this.$updater = new Updater(this);
        this.$cache = { isMounted: false };
        this.props = props;
        this.state = {};
        this.refs = {};
        this.context = context;
    }
    // 强制更新
    forceUpdate(callback) {
        // 实际更新的自建函数
        let { $updater, $cache, props, state, context } = this;
        if (!$cache.isMounted) {
            return;
        }
        if ($updater.isPending) {
            $updater.addState(state);
            return;
        }
        let nextProps = $cache.props || props;
        let nextState = $cache.state || state;
        let nextContext = $cache.context || context;
        let parentContext = $cache.parentContext;
        let node = $cache.node;
        let vnode = $cache.vnode;
        // 缓存
        $cache.props = $cache.state = $cache.context = null;
        $updater.isPending = true;
        if (this.componentWillUpdate) {
            this.componentWillUpdate(nextProps, nextState, nextContext)
        }
        this.state = nextState;
        this.props = nextProps;
        this.context = context;
    }
}
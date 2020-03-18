export let isArr = Array.isArray;



let uid = 0;
export function getUid() {
    return ++uid;
}

export function pipe(fn1, fn2) {
    return function () {
        fn1.apply(this, arguments);
        return fn2.apply(this, arguments)
    }
}

export function flatEach(list, iteratee, a) {
    let len = list.length
    let i = -1
    while (len--) {
        let item = list[++i]
        if (isArr(item)) {
            flatEach(item, iteratee, a)
        } else {
            iteratee(item, a)
        }
    }
}
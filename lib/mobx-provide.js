import React from 'react';
import { inject, observer, Provider } from 'mobx-react';

const flatten = arr => !Array.isArray(arr) ? 
    [arr] : 
    arr.reduce((resArr, e) => resArr.concat(flatten(e)), []);

const storeHashMap = {};

export function getStoreById(id) {
    return storeHashMap[id];
}

export function connect(...storeNameList) {
    return component => inject(...storeNameList)(observer(component));
}

export function provide(name, storeClass, id) {
    return Component =>
        class extends React.Component {
              
            constructor(props) {
                super(props);
                let storeInstance;
                let storeId;
                if(props.provide) {
                    [storeInstance, storeId] = flatten([props.provide]);
                } else {
                    storeInstance = new storeClass();
                    storeId = id;
                }
                if(storeId) {
                    if(storeHashMap[storeId]) {
                        throw Error(`重复的storeId ${storeId}`);
                    }
                    storeHashMap[storeId] = storeInstance;
                }
                this.name = name;
                this.instance = storeInstance;
                this.id = storeId;
            }

            componentWillUnmount() {
                this.instance.onDestory();
                if(this.id) {
                    delete storeHashMap[this.id];
                }
            }

            render() {
                const {provide, ...restProps} = this.props;
                const {name, instance} = this;
                const opts = {};
                opts[name] = instance;

                return (
                    <Provider {...opts}>
                        <Component {...restProps}/>
                    </Provider>
                );
            }
        }
}

export class IStoreBase {
    onDestory() {}
}
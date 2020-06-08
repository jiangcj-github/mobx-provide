type IComponentType<T = any> = React.ComponentType<T>;
type StoreId = string;

export class IStoreBase {
    onDestory: () => void;
}

export interface IProvideProps {
    provide?: IStoreBase | [IStoreBase, StoreId?];
}

export type IStoreConstructor<T> = new (...args: any[]) => T;

export interface IWrapped<T> {
    WrappedComponent: T;
}

export function getStoreById<T extends IStoreBase>(id: StoreId): T;

export function connect(...stores: string[]): <C extends IComponentType>(target: C) => C;

export function provide<T extends IStoreBase>(provideName: string, provideClass: IStoreConstructor<T>, storeId?: StoreId): 
<P extends IProvideProps, C extends IComponentType>(target: C) => C & IComponentType<P>;





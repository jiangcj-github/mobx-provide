## 安装
    
    npm i mobx-provide-pro

## API参考

- provide
- connect
- getStoreById
- provide属性

#### provide

    provide(provideName, provideClass, storeId)

- **`provideName`**  
声明一个`name`，在同一组嵌套关系中此 _name_ 唯一，重复的 _name_ 会覆盖最近父节点的同名   _store_ 

- **`provideClass`**
 _store_ 构造方法，必须继承自`IStoreBase`

- **`storeId`**
声明一个全局`storeId` ，此 _id_ 全局唯一，同名的 _storeid_ 会显示抛出异常，通过使用`getStoreById` 可以在任何地方获取到这个 _store_ ，前提是 _provide_ 此 _store_ 的组件必须存在。

`provide`向当前组件提供一个 _store_， 基于 _react_ 的 _context_ 特性，在该组件和其所有的后代组件中都可以通过`connect`方法获取到这个 _store_

通过 _provide_ 可以无视组件嵌套层级而共享一组状态，此状态在该组件和其所有的后代组件中都可见，默认在组件层级之外无法访问，除非提供 _storeId_

_store_ 具有生命周期，在组件之前创建并且在组件之后销毁，这意味着在组件的所有生命周期中都可以访问_store_，包括`constructor`和`componentWillUnmount`。可以在 _store_ 的`onDestory`方法中做一些清理工作，例如：轮询任务，定时器，`mobx reaction`等。

##### 加入provide后的组件生命周期

```flow
st=>start: store constructor
op2=>operation: ...组件生命周期...
end=>end: store onDestory

st->op2->end
```


提供`storeId`将会在一个全局的 _HashMap_ 中注册该 _store_ ，在组件卸载后会自动从 _HashMap_ 中移除。通过`getStoreById`可以在组件嵌套层级之外获取到这个状态，例如：在页面中与顶部栏或者侧边栏进行交互，而页面可能与其并不具有父子关系。解决此问题还可以使用 **状态提升**

#### connect

    connect(...storeNames)

- **`storeNames`**
_store_ 的`name`序列，所有的`name`都必须在此次`connect`的组件的上层组件中被`provide`过，否则会抛出异常。可以嵌套`provide`只需保证命名不同，

组件之中使用`this.props.name`的方式获取 _store_ , 在mobx非严格模式下可以修改状态并刷新视图。

#### getStoreById 

    getStoreById(id)
    
- **`id`**
    通过`provide`方法或者`provide属性`指定的全局ID，此ID全局唯一，重复则会抛出异常。

#### provide属性 

    <App provide={storeInstance} />
    <App provide={[storeInstance]} />
    <App provide={[storeIntance, storeId]} />

- **`storeInstance`**
    _store_ 实例，通过`provide`提供的 _store_ 会在每次组件创建时创建，此参数会阻止其默认行为，`storeInstance`会替换默认生成的 _store_ 实例，这意味着可以在组件外部去管理状态，可以参考**状态提升**章节。但即使传入全局实例也会在组件卸载时执行`onDestory`方法，而此实例却只会创建一次，这在数据**持久化存储**中发挥作用。

- **`storeId`**
    全局的`storeId`，作用同`provide`方法的第三个参数，一旦在属性中提供则会覆盖`provide`中的`storeId`值。及时使用全局实例，在 _provide_ 组件卸载时其对应的 _store_ 依然从全局 _HashMap_ 中移除，所以通过`id`获取状态之前请确认组件是否还在挂载中，否则会返回`undefined`

## 如何使用mobx-provide在组件之间通信

- **父子组件共享状态**

```tsx
class AppStore extends IStoreBase{

    @observable public message = "hello";

    @action setMessage(message: string) {
        this.message = message;
    }
}

interface IProps extends IProvideProps {
    db?: AppStore,
}


@provide("db", AppStore)
@connect("db")
export default class App extends React.Component<IProps> {

    public render() {
        return (
            <div className="App">
                App {this.props.db?.message} 
                <Wrap>
                    <Inner />
                </Wrap>
            </div>
        );
    }
}

const Wrap = (props: any) => <div>{props.children}</div>

const Inner = connect("db")((props: IProps) => {
    const onClick = () => {
        props.db?.setMessage("world");
    }
    return <button onClick={onClick}>{props.db?.message}</button>
})
```
`App`和`Inner`共享同一组状态，由于`connect`的内部已经实现了 _observer_，而不需要再次声明，任何时候只要改变`message`都会同时刷新这两个组件。注意到`Inner`并非`App`的直接子组件。

对于需要在`App`和`Inner`之间交互的状态，我们都应该将其放在`AppStore`中。由于`AppStore`会在`App`组件卸载时销毁，因此其是状态安全的，我们也可以将非交互状态也放置其中，或者使用`AppStore`取代组件的`state`，任何时候组件只需要负责渲染而不需要关心数据来源。

- **子组件状态提升**

```tsx
// table.tsx

class TableStore extends IStoreBase{
    @observable public count = 10;
    @observable public page = 1;
    @observable public data = [];

    @action queryData() {
        fetch("/data.action").then((res: Response) => res.json()).then((json) => {
            this.count = json.count;
            this.page = json.page;
            this.data = json.data || [];
        });
    }
}

interface ITableProps extends IProvideProps {
    db?: TableStore,
}

@provide("db", TableStore)
@connect("db")
class Table extends React.Component<ITableProps> {

    componentDidMount() {
        this.props.db?.queryData();
    }

    public render() {
        const {count, page, data} = this.props.db || {};
        return <div>
            <div>{data}</div>
            <p>第{page}页，共{count}条</p>
        </div>;
    }
}
```

在`Table`的 _store_ 中声明了三个变量分别表示数据总数、当前页、表格数据，在`componentDidMount`中进行数据加载。

```tsx
// app.tsx

class AppStore extends IStoreBase{
    public table = new TableStore();
}

interface IAppProps extends IProvideProps {
    db?: AppStore,
}

@provide("db", AppStore)
@connect("db")
export default class App extends React.Component<IAppProps> {

    private onClick = () => {
        this.props.db?.table.queryData();
    }

    public render() {
        return <div>
            <Table provide={this.props.db?.table} />
            <button onClick={this.onClick}>刷新</button>
        </div>
    } 
}
```

在`App`中实现对`Table`的数据刷新，这里使用了**状态提升**，即将子组件的 _store_ 提升至其父组件中，以便对父组件完全受控，状态提升也可以跨越层级。

这里的`App`和`Table`使用了相同的`provideName`, 这意味着`Table`组件会覆盖`App`提供的 _store_，从而无法访问该状态。

`App`的`provide属性`会覆盖`Table`组件默认的`provide`，对`Table`来说没有任何变化，它与 _store_ 交互而无需知道该 _store_ 由谁提供。而`App`可以像操纵自己的状态一样随意操纵`Table`的状态，因此可以在App中复制多个`Table`，甚至实现它们之间的联动。

```tsx
class AppStore extends IStoreBase{
    public table1 = new TableStore();
    public table2 = new TableStore();
}

interface IAppProps extends IProvideProps {
    db?: AppStore,
}

@provide("db", AppStore)
@connect("db")
export default class App extends React.Component<IAppProps> {

    private onClick = () => {
        this.props.db?.table1.queryData();
        this.props.db?.table2.queryData();
    }

    public render() {
        return <div>
            <Table provide={this.props.db?.table1} />
            <Table provide={this.props.db?.table2} />
            <button onClick={this.onClick}>刷新</button>
        </div>
    } 
}
```

也可以对两个`Table`提供相同的 _store_ 使它们共用同一个状态，任意一个`Table`修改状态也会同时反映到另一个上。

- **全局状态**

有时候我们需要在两个组件之间通信，但他们并不具备嵌套关系。可以使用状态提升将他们的状态提升至共同父组件、根组件，甚至可以提升至全局。

```tsx
// loading.tsx

export class LoadingStore extends IStoreBase {
    @observable public visible = false;

    @action public setVisible(visible: boolean) {
        this.visible = visible;
    }
}

interface ILoadingProps extends IProvideProps {
    db?: LoadingStore,
}

@provide("db", LoadingStore)
@connect("db")
class Loading extends React.Component<ILoadingProps> {

    public render() {
        const {visible} = this.props.db || {};
        return visible ? <div>加载中...</div> : <i />;
    }

}
```
```tsx
// app.tsx

export const loadingStore = new LoadingStore();

export const App = () => {
    return <div>
        <Loading provide={loadingStore}/>
        <Wrap>
            <Inner />
        </Wrap>
    </div>
}
```



使用`storeId`将状态注册到全局 _HashMap_ 中，在需要访问的地方使用`getStoreById`获取状态。

```tsx
// loading.tsx

export class LoadingStore extends IStoreBase {
    @observable public visible = false;

    @action public setVisible(visible: boolean) {
        this.visible = visible;
    }
}

interface ILoadingProps extends IProvideProps {
    db?: LoadingStore,
}

@provide("db", LoadingStore, "loading")
@connect("db")
export class Loading extends React.Component<ILoadingProps> {

    public render() {
        const {visible} = this.props.db || {};
        return visible ? <div>加载中...</div> : <i />;
    }

}
```
```tsx
// app.tsx

const App = () => {
    return <div>
        <Loading />
        <Wrap>
            <Inner />
        </Wrap>
    </div>
}

const Wrap = (props: any) => <div>{props.children}</div>

const Inner = observer(() => {
    const onClick = () => {
        const loading: LoadingStore = getStoreById("loading");
        loading.setVisible(true);
    }
    return <button onClick={onClick}>显示Loading</button>
})

export default App;
```

## 性能优化

使用**mobx-provide**可以很容易进行视图重构，因为进行重构不需要关心数据，我们可以很容易复杂组件拆分成众多小组件，也可以将小组件合并成大组件，甚至重新写一套视图组件。

一般情况下，每个状态改变都会引起组件重新渲染，`observer`包裹的组件会自动浅层渲染，将组件拆分成更小的单元，可以避免某些视图不必要的渲染，这对于大数据渲染有很大的性能提升。

```tsx
class AppStore extends IStoreBase{

    @observable public list = [...Array(1000).keys()];
    @observable public count = 0;

    @action increase() {
        this.count ++;
    }
}

interface IProps extends IProvideProps {
    db?: AppStore,
}

@provide("db", AppStore)
@connect("db")
export default class App extends React.Component<IProps> {

    private click = () => {
        this.props.db?.increase();
    }

    public render() {
        const { list = [], count } = this.props.db || {};
        return (
            <div className="App">
                <ul>
                    {list.map((e: number) => <li key={e}>{e}</li>)}
                </ul>
                <button onClick={this.click}>{count}</button>
            </div>
        );
    }
}
```
上面的`App`组件会在每次`click`按钮时递增，并且每次点击都会渲染一个长度为1000的列表，为了避免列表不必要的渲染，可以考虑将按钮放置到一个单独组件中。

```tsx
class AppStore extends IStoreBase{

    @observable public list = [...Array(1000).keys()];
    @observable public count = 0;

    @action increase() {
        this.count ++;
    }
}

interface IProps extends IProvideProps {
    db?: AppStore,
}

@provide("db", AppStore)
@connect("db")
export default class App extends React.Component<IProps> {
    public render() {
        const { list = [] } = this.props.db || {};
        return (
            <div className="App">
                <ul>
                    {list.map((e: number) => <li key={e}>{e}</li>)}
                </ul>
                <Button />
            </div>
        );
    }
}

const Button = connect("db")((props: IProps) => {
    const click = () => {
        props.db?.increase();
    }
    const { count } = props.db || {};
    return <button onClick={click}>{count}</button>
})
```
对于同样的点击事件，后者只会渲染`Button`组件。


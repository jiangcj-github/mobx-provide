import React from 'react';
import {connect, provide, IStoreBase, IProvideProps, getStoreById} from '../../lib/mobx-provide';
import {observable, action} from "mobx"
import {observer} from 'mobx-react';

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
class Loading extends React.Component<ILoadingProps> {

    public render() {
        const {visible} = this.props.db || {};
        return visible ? <div>加载中...</div> : <i />;
    }

}

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
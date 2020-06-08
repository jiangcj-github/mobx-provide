import React from 'react';
import {connect, provide, IStoreBase, IProvideProps} from '../lib/mobx-provide';
import {action, observable} from "mobx"


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

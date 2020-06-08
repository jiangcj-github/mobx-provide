import React from 'react';
import {connect, provide, IStoreBase, IProvideProps} from '../lib/mobx-provide';
import {action, observable} from "mobx"


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
        console.log("render");
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


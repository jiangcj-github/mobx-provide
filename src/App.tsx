import React from 'react';
import {connect, provide, IStoreBase, IProvideProps} from './lib/mobx-provide';


class AppStore extends IStoreBase{

    constructor(params: any = "hello") {
        super();
        this.message = params;
    }

    public message = "";
}

interface IProps extends IProvideProps {
    db?: AppStore,
}

@provide("db", AppStore)
@connect("db")
class App extends React.Component<IProps> {

    public render() {
        const messgae = this.props.db?.message;
        return (
            <div className="App">
                app 
                <AppInner /> 
            </div>
        );
    }
}

const AppInner = connect("db")((props: any) => {
    return <p>{props.db.message}</p>
})

const appStore = new AppStore("world");

export default () => {
    return <>
        <App />
        <App provide={[appStore]}/>
    </>
}


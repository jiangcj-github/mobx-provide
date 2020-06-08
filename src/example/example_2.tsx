import React from 'react';
import {connect, provide, IStoreBase, IProvideProps} from '../lib/mobx-provide';
import {observable, action} from "mobx"
import {render} from '@testing-library/react';

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


// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import _ from "lodash";

import "pikaday/css/pikaday.css";
import 'handsontable/dist/handsontable.full.min.css';

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';
import {CheckerContainer} from "./component/CheckerContainer";
import {MapResource} from "./component/MapResource";
import {Layout, Menu} from "antd";
import {Content, Footer, Header} from "antd/lib/layout/layout";

registerLanguageDictionary(zhCN);

registerAllModules();

type IProps = {};

type IState = {
    mode: 'check' | 'map'
};


export class App extends React.PureComponent<IProps, IState> {

    state: IState = {
        mode: "map"
    };

    componentDidMount() {
    }

    componentWillUnmount() {
    }


    render() {
        const {mode} = this.state

        const items = [
            {key: 'check', label: '考勤'},
            {key: 'map', label: '资源分配'}
        ]
        return <Layout className="App">
            <Header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Menu
                    theme="dark"
                    mode="horizontal"
                    defaultSelectedKeys={['map']}
                    items={items}
                    style={{flex: 1, minWidth: 0}}
                    onSelect={(e) => {
                        this.setState({
                            mode: e.key as any
                        })
                    }}
                />
                <span style={{color:"#fff"}}>Design Created by 烽火&情系 ©{new Date().getFullYear()}</span>
            </Header>
            <Content style={{padding: '0 48px', height: 'calc(100vh - 66px)', overflowY: 'auto'}}>
                {mode === 'check' && <CheckerContainer/>}
                {mode === 'map' && <MapResource/>}
            </Content>
        </Layout>

    }


}



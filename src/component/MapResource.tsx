// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import _ from "lodash";

import "pikaday/css/pikaday.css";
import 'handsontable/dist/handsontable.full.min.css';

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';
import {Select} from "antd";
import axios from "axios";
import {HotTable} from "@handsontable/react";

registerLanguageDictionary(zhCN);

registerAllModules();

type IProps = {};

type IState = {
    rows: any[][]
};


export class MapResource extends React.PureComponent<IProps, IState> {

    state: IState = {
        rows: []
    };

    componentDidMount() {
    }

    componentWillUnmount() {
    }


    render() {
        const {rows} = this.state
        return <>
            <Select
                popupMatchSelectWidth={true}
                style={{
                    width: 200
                }}
                options={[{
                    value: '官渡之战',
                    label: `官渡之战`,
                }]}
                onSelect={async (e) => {
                    const x = await axios.get(`/map/${e}.csv`)
                    const rows = []
                    let header = false
                    for (const x1 of x.data.split('\n')) {
                        if (!header) {
                            header = true
                            continue
                        }
                        rows.push(x1.split(","))
                    }
                    this.setState({
                        rows
                    })
                }}
            />
            <HotTable
                data={rows}
                colHeaders={['id', '地图', '郡', '等级', '类型', 'x', 'y']}
                language={zhCN.languageCode}
                width={'auto'}
                height={'85vh'}
                rowHeaders={false}
                colWidths={100}
                manualColumnResize={true}
                autoWrapRow={true}
                autoWrapCol={true}
                filters={true}
                dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
                licenseKey="d7675-41c63-8a164-ebca2-fb410"
                columnSorting={true}
                contextMenu={['copy', 'cut']}
            >
            </HotTable>
        </>
    }
}



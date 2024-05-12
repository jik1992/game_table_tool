// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import _ from "lodash";

import "pikaday/css/pikaday.css";
import 'handsontable/dist/handsontable.full.min.css';

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';
import {Button, Select} from "antd";
import axios from "axios";
import {HotTable} from "@handsontable/react";
import HotTableClass from "@handsontable/react/hotTableClass";

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

    hotTableRef = React.createRef<HotTableClass>()

    private exportToCsv = () => {
        if (this.hotTableRef.current) {
            const hot = this.hotTableRef.current.hotInstance;
            if (hot){
                const exportPlugin = hot.getPlugin('exportFile');
                const blob = exportPlugin.exportAsBlob('csv')
                const link = document.createElement('a');
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', 'export.csv');
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }
    };

    render() {
        const {rows} = this.state
        return <>
            <Select
                popupMatchSelectWidth={true}
                style={{
                    width: 200
                }}
                options={[
                    {
                    value: '官渡之战',
                    label: `官渡之战`,
                }, {
                    value: '奇门八阵',
                    label: `奇门八阵`,
                },
                ]}
                onSelect={async (e) => {
                    const url=`/map/${e}.csv`
                    const x = await axios.get(url)
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
            <Button onClick={this.exportToCsv}>
                export csv
            </Button>
            <HotTable
                ref={this.hotTableRef}
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



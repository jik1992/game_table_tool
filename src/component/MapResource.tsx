// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import _ from "lodash";

import "pikaday/css/pikaday.css";
import 'handsontable/dist/handsontable.full.min.css';

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';
import {Button, Input, Select} from "antd";
import axios from "axios";
import {HotTable} from "@handsontable/react";
import HotTableClass from "@handsontable/react/hotTableClass";

registerLanguageDictionary(zhCN);

registerAllModules();

type IProps = {};

type IState = {
    destination: string,
    rows: any[][]
};


export class MapResource extends React.PureComponent<IProps, IState> {

    state: IState = {
        rows: [],
        destination: ''
    };

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    hotTableRef = React.createRef<HotTableClass>()

    private exportToCsv = () => {
        if (this.hotTableRef.current) {
            const hot = this.hotTableRef.current.hotInstance;
            if (hot) {
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

    private save = () => {
        if (this.hotTableRef.current) {
            const hot = this.hotTableRef.current.hotInstance;
            if (hot) {
                const exportPlugin = hot.getPlugin('exportFile');
                const csv = exportPlugin.exportAsString('csv')
                for (const row of csv.split("\n")) {
                    const co = row.split(",")
                    const x = Number.parseInt(co[5])
                    const y = Number.parseInt(co[6].replaceAll("\"", ''))
                    const owner = co[7].replaceAll("\r", '')
                    if (!_.isEmpty(owner) && owner !== '\r') {
                        console.info(x, y, owner)
                    }
                }
            }
        }
    };

    private calculateDistance(point1: { x: number, y: number }, point2: { x: number, y: number }) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const distance = Math.hypot(dx, dy);
        return _.round(distance);
    }

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
                    const url = `/map/${e}.csv`
                    const x = await axios.get(url)
                    const rows = []
                    let header = false
                    for (const x1 of x.data.split('\n')) {
                        if (!header) {
                            header = true
                            continue
                        }
                        rows.push(x1.split(",").concat(""))
                    }
                    this.setState({
                        rows
                    })
                }}
            />
            <Input style={{width: 100}} value={this.state.destination} onChange={(e) => {
                const value = e.target.value
                this.setState({
                    destination: value
                })
            }}/>
            <Button onClick={() => {
                const {destination} = this.state
                let values;
                if (destination.includes(",")) {
                    values = destination.split(",")
                } else if (destination.includes("\t")) {
                    values = destination.split("\t")
                } else {
                    values = destination.split(" ")
                }
                if (values.length > 1) {
                    const point = {
                        x: Number.parseInt(values[0]),
                        y: Number.parseInt(values[1]),
                    }
                    const newRows = _.cloneDeep(this.state.rows)
                    for (let i = 0; i < newRows.length; i++) {
                        const cPoint = {
                            x: Number.parseInt(newRows[i][5]),
                            y: Number.parseInt(newRows[i][6]),
                        }
                        const d = this.calculateDistance(point, cPoint)
                        newRows[i].push(d)
                    }
                    this.setState({
                        rows: newRows
                    })
                }
            }}>
                计算距离
            </Button>
            <Button onClick={this.exportToCsv}>
                export csv
            </Button>
            <Button onClick={this.save}>
                save
            </Button>
            <HotTable
                ref={this.hotTableRef}
                data={rows}
                colHeaders={['id', '地图', '郡', '等级', '类型', 'x', 'y', '拥有人', "计算距离"]}
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



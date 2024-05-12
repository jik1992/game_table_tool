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
import {del, get, set} from "../utils/db";

registerLanguageDictionary(zhCN);

registerAllModules();

type IProps = {};

type IState = {
    destination: string,
    originalMap: string,
    original: any[][]
    rows: any[][]
    owner: {
        x: number,
        y: number,
        owner: string
    }[]
};


export class MapResource extends React.PureComponent<IProps, IState> {

    state: IState = {
        originalMap: '',
        original: [],
        rows: [],
        destination: '',
        owner: []
    };

    componentDidMount = async () => {
        const obj = await get('owner')
        console.info(111, obj)
        if (obj) {
            this.setState({
                owner: obj.ownerAll,
            })
            await this.loadMapResource(obj.map)
        }
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

    private save = async () => {
        const ownerAll = _.cloneDeep(this.state.owner)
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
                        const oIndex = ownerAll.findIndex(value => value.x === x && value.y === y)
                        if (oIndex >= 0) {
                            ownerAll[oIndex] = {
                                ...ownerAll[oIndex],
                                owner
                            }
                        } else {
                            ownerAll.push({
                                x, y, owner
                            })
                        }
                    }
                }
            }
        }
        await del('owner')
        await set('owner', {
            map: this.state.originalMap,
            ownerAll
        })
        this.setState(
            {
                owner: ownerAll
            }
        )
    };

    private calculateDistance(point1: { x: number, y: number }, point2: { x: number, y: number }) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const distance = Math.hypot(dx, dy);
        return _.round(distance);
    }

    render() {
        const {rows} = this.state
        const datas = _.isEmpty(this.state.rows) ? this.state.original : this.state.rows
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
                    await this.loadMapResource(e);
                }}
            />
            <Input style={{width: 100}} value={this.state.destination} onChange={(e) => {
                const value = e.target.value
                this.setState({
                    destination: value
                })
            }}
                   placeholder={'602,689'}
            />
            <Select
                defaultValue={'铜矿'}
                options={[
                    {
                        key: 'gold',
                        label: '铜矿',
                    }, {
                        key: 'rice',
                        label: '粮食',
                    },
                ]}
            />
            <Button onClick={() => {
                const point = this.getPointInput();
                if (point) {
                    let newRows = _.cloneDeep(this.state.original)
                    for (let i = 0; i < newRows.length; i++) {
                        const cPoint = {
                            x: Number.parseInt(newRows[i][5]),
                            y: Number.parseInt(newRows[i][6]),
                        }
                        const d = this.calculateDistance(point, cPoint)
                        newRows[i][8] = d
                    }
                    newRows = newRows.filter(values => _.isEmpty(values[7])).sort(
                        (a, b) => {
                            if (a[8] === b[8]) return 0;
                            return a[8] > b[8] ? 1 : -1
                        }
                    )
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
                export owner {'>>'}
            </Button>
            <div style={{
                display: "inline-flex",
                width: '100%'
            }}>
                <HotTable
                    ref={this.hotTableRef}
                    data={datas}
                    colHeaders={['id', '地图', '郡', '等级', '类型', 'x', 'y', '拥有人', "计算距离"]}
                    language={zhCN.languageCode}
                    width={'100%'}
                    height={'85vh'}
                    rowHeaders={false}
                    colWidths={80}
                    manualColumnResize={true}
                    autoWrapRow={true}
                    autoWrapCol={true}
                    filters={true}
                    dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
                    licenseKey="d7675-41c63-8a164-ebca2-fb410"
                    columnSorting={true}
                    contextMenu={['copy', 'cut']}
                />
                <HotTable
                    data={this.state.owner.map(value => {
                        const o = this.state.original.find(newRows => (
                            Number.parseInt(newRows[5]) === value.x && Number.parseInt(newRows[6]) === value.y
                        ))
                        if (o) {
                            o[7] = value.owner
                            return o
                        }
                        return []
                    })}
                    colHeaders={['id', '地图', '郡', '等级', '类型', 'x', 'y', '拥有人']}
                    language={zhCN.languageCode}
                    width={'100%'}
                    height={'85vh'}
                    rowHeaders={false}
                    colWidths={80}
                    manualColumnResize={true}
                    autoWrapRow={true}
                    autoWrapCol={true}
                    filters={true}
                    dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
                    licenseKey="d7675-41c63-8a164-ebca2-fb410"
                    columnSorting={true}
                    contextMenu={['copy', 'cut']}
                />
            </div>
        </>
    }

    private async loadMapResource(e: string) {
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
            original: rows,
            originalMap: e
        })
    }

    private getPointInput() {
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
            return point
        }
        return null
    }
}



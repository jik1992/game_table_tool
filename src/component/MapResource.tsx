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
    filerType: 'gold' | 'rice',
    rows: any[][]
    owner: {
        x: number,
        y: number,
        owner: string
        group: string
        note: string
    }[]
};


export class MapResource extends React.PureComponent<IProps, IState> {

    state: IState = {
        filerType: 'gold',
        originalMap: '',
        original: [],
        rows: [],
        destination: '',
        owner: []
    };

    componentDidMount = async () => {
        const obj = await get('owner')
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
    hotTableRef2 = React.createRef<HotTableClass>()

    private exportToCsv = () => {
        if (this.hotTableRef2.current) {
            const hot = this.hotTableRef2.current.hotInstance;
            if (hot) {
                const exportPlugin = hot.getPlugin('exportFile');
                const blob = exportPlugin.exportAsBlob('csv')
                const link = document.createElement('a');
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', '资源分配.csv');
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
                    const group = co[8].replaceAll("\r", '')
                    if (!_.isEmpty(owner) && owner !== '\r') {
                        const oIndex = ownerAll.findIndex(value => value.x === x && value.y === y)
                        if (oIndex >= 0) {
                            ownerAll[oIndex] = {
                                ...ownerAll[oIndex],
                                owner,
                                group
                            }
                        } else {
                            ownerAll.push({
                                x, y, owner, group, note: ''
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
        this.setState({
            owner: ownerAll
        })
    };

    private calculateDistance(point1: { x: number, y: number }, point2: { x: number, y: number }) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const distance = Math.hypot(dx, dy);
        return _.round(distance);
    }

    render() {
        const {rows} = this.state
        const data = _.isEmpty(this.state.rows) ? this.state.original : this.state.rows
        return <>
            {
                _.isEmpty(this.state.originalMap) ? (
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
                ) : (
                    <>
                        <div style={{
                            display: "inline-flex",
                            width: '100%',
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div>
                                <Input
                                    style={{width: 100}} value={this.state.destination}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        this.setState({
                                            destination: value
                                        })
                                    }}
                                    placeholder={'602,689'}
                                />
                                <Select
                                    value={this.state.filerType}
                                    options={[
                                        {
                                            value: 'gold',
                                            label: '铜矿',
                                        }, {
                                            value: 'rice',
                                            label: '粮食',
                                        },
                                    ]}
                                    onChange={e => {
                                        this.setState({
                                            filerType: e as any
                                        })
                                    }}
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
                                            newRows[i][9] = d
                                        }
                                        newRows = newRows.filter(values => {
                                            if (!_.isEmpty(this.state.filerType)) {
                                                if (this.state.filerType === "gold" && values[4] !== '铜') {
                                                    return false
                                                }
                                                if (this.state.filerType === "rice" && values[4] !== '粮') {
                                                    return false
                                                }
                                            }
                                            if (_.isEmpty(values[7])) return true;
                                            const x = this.state.owner.find(o => (
                                                o.x === Number.parseInt(values[5]) && o.y === Number.parseInt(values[6])
                                            ))
                                            return !x
                                        }).sort(
                                            (a, b) => {
                                                if (a[9] === b[9]) return 0;
                                                return a[9] > b[9] ? 1 : -1
                                            }
                                        )
                                        this.setState({
                                            rows: newRows
                                        })
                                    }
                                }}>
                                    计算距离
                                </Button>
                                <Button onClick={this.save}>
                                    更新 [拥有人]{'>>'}
                                </Button>
                            </div>
                            <div>
                                <Button onClick={async () => {
                                    const ownerAll = []
                                    if (this.hotTableRef2.current) {
                                        const hot = this.hotTableRef2.current.hotInstance;
                                        if (hot) {
                                            const exportPlugin = hot.getPlugin('exportFile');
                                            const csv = exportPlugin.exportAsString('csv', {
                                                columnDelimiter: '^_^'
                                            })
                                            for (const row of csv.split("\n")) {
                                                const co = row.split("^_^")
                                                if (!_.isEmpty(co[2])) {
                                                    const x = Number.parseInt(co[2].split(",")[0])
                                                    const y = Number.parseInt(co[2].split(",")[1])
                                                    const owner = co[1]
                                                    const group = co[0]
                                                    const note = co[3]
                                                    if (!_.isEmpty(owner)) {
                                                        ownerAll.push({
                                                            x, y, owner, group, note
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
                                    this.setState({
                                        owner: ownerAll
                                    })
                                }}>{'<<'}更新 [拥有人]</Button>
                                <Button onClick={() => {
                                    if (this.hotTableRef2.current) {
                                        let note = ''
                                        const rows: any[][] = []
                                        const groups = new Set<string>()
                                        const hot = this.hotTableRef2.current.hotInstance;
                                        if (hot) {
                                            const exportPlugin = hot.getPlugin('exportFile');
                                            const csv = exportPlugin.exportAsString('csv', {
                                                columnDelimiter: '^_^'
                                            })
                                            for (const row of csv.split("\n")) {
                                                const co = row.split("^_^")
                                                rows.push(co)
                                                groups.add(co[0].trim())
                                            }
                                        }
                                        groups.forEach(group => {
                                            note += `${group}：`
                                            const name = []
                                            for (const row of rows) {
                                                if (row[0] === group) {
                                                    name.push(`${row[1]} ${row[2]}`)
                                                }
                                            }
                                            note += `${name.join(" ")}\n`
                                        })
                                        console.info(1111, note)
                                    }
                                }}>
                                    生成法令
                                </Button>
                                <Button onClick={this.exportToCsv}>
                                    导出表格
                                </Button>
                            </div>
                        </div>
                    </>
                )
            }

            <div style={{
                display: "inline-flex",
                width: '100%'
            }}>
                <HotTable
                    ref={this.hotTableRef}
                    data={data}
                    colHeaders={['id', '地图', '郡', '等级', '类型', 'x', 'y', '拥有人', '分组', "距离"]}
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
                    ref={this.hotTableRef2}
                    data={this.state.owner.map(value => {
                        const o = this.state.original.find(newRows => (
                            Number.parseInt(newRows[5]) === value.x && Number.parseInt(newRows[6]) === value.y
                        ))
                        if (o) {
                            o[7] = value.owner
                            o[8] = value.group
                            return [value.group, value.owner, `${value.x},${value.y}`, value.note, o[0], o[1], o[2], o[3], o[4]]
                        }
                        return ['', '', '', '', '', '', '']
                    })}
                    colHeaders={['分组', '拥有人', '坐标', '活动', 'id', '地图', '郡', '等级', '类型']}
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
            rows.push(x1.split(",").concat(['', '']))
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



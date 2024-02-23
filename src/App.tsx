// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React from 'react';
import {Button, Select, Upload} from "antd";
import {InboxOutlined} from '@ant-design/icons';
import {UploadChangeParam} from "antd/es/upload/interface";
import _ from "lodash";

type IProps = {};

type IState = {
    csvResult: string
    options: {
        [key: string]: {
            owner: string,
            data: string[][]
        }
    },
    optionsA: string[],
    optionsB: string[],
    selected: {
        owner?: string,
        fileA?: string,
        fileB?: string,
    }
    fileCount: number,
    result?: {
        rateMember: number
        allMemberCount: number
        availableMemberCount: number
        powerAll: number
        powerAvg: number
        powerMaxMember: string
        powerMinMember: string
        groupStati: {
            [key: string]: {
                allMemberCount: number,
                availableMemberCount: number,
                powerAvg: number,
                powerAll: number,
                dead: string[],
                rankAvailable: number,
                rankAvgPower: number,
                rankSumPower: number,
                rateAvailable: number,
            }
        }
    }
};
const availableColumns = [
    '成员', '战功本周', '战功总量', '势力值', '所属阵营', '分组'
]
const LIMIT_MIN = 100

export class App extends React.PureComponent<IProps, IState> {
    state: IState = {
        csvResult: '',
        fileCount: 0,
        options: {},
        selected: {},
        optionsA: [],
        optionsB: [],
    };

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render() {
        const {result} = this.state
        return <div className="App">
            <Upload.Dragger
                style={{
                    width: '100%',
                    height: 100,
                }}
                showUploadList={false}
                onChange={(info: UploadChangeParam) => {
                    const fileName = info.file.name
                    const a = _.cloneDeep(this.state.options)
                    if (fileName in a) {
                        return
                    }

                    const reader = new FileReader()
                    // @ts-ignore
                    reader.readAsText(info.file.originFileObj)
                    reader.onload = () => {
                        // 解析 CSV 文件
                        const csv = reader.result as string;
                        if (!csv || !fileName) return;


                        const lines = csv.split('\n');
                        const shows: number[] = []
                        let headers = lines[0].split(',');
                        headers = headers.filter((value, index) => {
                            if (availableColumns.includes(value.trim())) {
                                shows.push(index)
                                return true
                            }
                            return false
                        })
                        const data = lines.slice(1).map(line => {
                            let lines = line.split(',')
                            lines[3] = String(Number.parseInt(lines[3]) + Number.parseInt(lines[4]))
                            lines[7] = String(Number.parseInt(lines[7]) + Number.parseInt(lines[8]))
                            lines = lines.filter((value, index) => {
                                return shows.includes(index);
                            })
                            return lines
                        });
                        // 渲染表格
                        const outputHtml = `
                        <thead>
                          <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                          </tr>
                        </thead>
                        <tbody>
                          ${data.map(row => `
                            <tr>
                              ${row.map(cell => `<td>${cell}</td>`).join('')}
                            </tr>
                          `).join('')}
                        </tbody>
                    `;
                        a[fileName] = {
                            owner: data[0][0],
                            data: data
                        }
                        this.setState({options: a})
                        this.setState({
                            csvResult: outputHtml
                        })
                    }

                }} name="files" multiple={true}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                </p>
                <p className="ant-upload-text">上传战功报表文件，如：同盟统计2024年02月23日21时16分25秒.csv</p>
            </Upload.Dragger>
            <div style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: '100%'
            }}>
                {this.state.fileCount > 0 && <div>成功加载 {this.state.fileCount} 文件</div>}
                盟主:
                <Select
                    style={{width: 250}}
                    value={this.state.selected.owner}
                    options={this.getOptions()}
                    onChange={(value, option) => {
                        const a: string[] = []
                        for (const key of Object.keys(this.state.options)) {
                            console.info(this.state.options[key].owner, value)
                            if (this.state.options[key].owner === value) {
                                a.push(key)
                            }
                        }
                        this.setState({
                            selected: {
                                owner: value,
                                fileA: undefined,
                                fileB: undefined,
                            },
                            optionsA: a
                        })
                    }}
                />
                开始时间:
                <Select style={{width: 150}}
                        value={this.state.selected.fileA}
                        options={this.getTimeOptions(this.state.optionsA)}
                        onChange={(value, option) => {
                            const a: string[] = []
                            for (const key of Object.keys(this.state.options)) {
                                if (this.state.options[key].owner === this.state.selected.owner) {
                                    a.push(key)
                                }
                            }
                            this.setState({
                                selected: {
                                    ...this.state.selected,
                                    fileA: value,

                                },
                                optionsB: a
                            })
                        }}
                />
                结束时间:
                <Select style={{width: 150}}
                        value={this.state.selected.fileB}
                        options={this.getTimeOptions(this.state.optionsB)}
                        onChange={(value, option) => {
                            this.setState({
                                selected: {
                                    ...this.state.selected,
                                    fileB: value,
                                }
                            })
                        }}
                />
                <Button
                    style={{marginLeft: 5}}
                    type={"primary"}
                    onClick={() => {
                        const fileA = Object.keys(this.state.options).find(value => this.state.options[value].owner === this.state.selected.owner &&
                            value === this.state.selected.fileA)
                        const fileB = Object.keys(this.state.options).find(value => this.state.options[value].owner === this.state.selected.owner &&
                            value === this.state.selected.fileB)
                        if (fileA && fileB) {
                            const dataA = this.state.options[fileA].data
                            const dataB = this.state.options[fileB].data
                            const allMemberCount = dataB.length
                            let availableMemberCount = 0
                            let powerAll = 0
                            let powerMax = 0
                            let powerMaxMember = ''
                            let powerMin = Number.MAX_VALUE
                            let powerMinMember = ''
                            let groupStati: {
                                [key: string]: {
                                    allMemberCount: number,
                                    availableMemberCount: number,
                                    powerAvg: number,
                                    powerAll: number,
                                    dead: string[],
                                    rankAvailable: number,
                                    rankAvgPower: number,
                                    rankSumPower: number,
                                    rateAvailable: number,
                                }
                            } = {}
                            for (const row of dataB) {
                                if (!row[5]) {
                                    continue
                                }
                                if (row[5] in groupStati) {
                                    groupStati[row[5]] = {
                                        ...groupStati[row[5]],
                                        allMemberCount: groupStati[row[5]].allMemberCount + 1,
                                        availableMemberCount: 0,
                                        powerAvg: 0,
                                        powerAll: 0,
                                        rankAvailable: 0,
                                        rankAvgPower: 0,
                                        rankSumPower: 0,
                                        rateAvailable: 0,
                                    }
                                } else {
                                    groupStati[row[5]] = {
                                        allMemberCount: 1,
                                        availableMemberCount: 0,
                                        powerAvg: 0,
                                        powerAll: 0,
                                        dead: [],
                                        rankAvailable: 0,
                                        rankAvgPower: 0,
                                        rankSumPower: 0,
                                        rateAvailable: 0,
                                    }
                                }
                            }
                            for (const row of dataB) {
                                if (!row[5]) {
                                    continue
                                }
                                const member = row[0]
                                const memberGroup = row[5]
                                const rowMemberA = dataA.find(value => value[0] === member)
                                let ok = 0
                                if (rowMemberA) {
                                    ok = Number.parseInt(row[1]) - Number.parseInt(rowMemberA[1])
                                    if (ok >= LIMIT_MIN) {
                                        availableMemberCount += 1
                                        powerAll += ok
                                        if (ok > powerMax) {
                                            powerMax = ok
                                            powerMaxMember = member
                                        }
                                        if (ok < powerMin) {
                                            powerMin = ok
                                            powerMinMember = member
                                        }
                                        groupStati[memberGroup] = {
                                            ...groupStati[memberGroup],
                                            availableMemberCount: groupStati[memberGroup].availableMemberCount + 1,
                                            powerAll: groupStati[memberGroup].powerAll + ok,
                                        }
                                    } else {
                                        groupStati[memberGroup] = {
                                            ...groupStati[memberGroup],
                                            dead: groupStati[memberGroup].dead.concat([member])
                                        }
                                    }
                                } else {
                                    ok = Number.parseInt(row[1])
                                    if (ok >= LIMIT_MIN) {
                                        availableMemberCount += 1
                                        powerAll += ok
                                        if (ok > powerMax) {
                                            powerMax = ok
                                            powerMaxMember = member
                                        }
                                        if (ok < powerMin) {
                                            powerMin = ok
                                            powerMinMember = member
                                        }
                                        groupStati[memberGroup] = {
                                            ...groupStati[memberGroup],
                                            availableMemberCount: groupStati[memberGroup].availableMemberCount + 1,
                                            powerAll: groupStati[memberGroup].powerAll + ok,
                                        }
                                    } else {

                                    }
                                }

                            }
                            for (const key of Object.keys(groupStati)) {
                                groupStati[key].powerAvg = Number.parseInt((groupStati[key].powerAll / groupStati[key].availableMemberCount).toFixed(0))
                                groupStati[key].rateAvailable = Number.parseInt((groupStati[key].availableMemberCount / groupStati[key].allMemberCount * 100).toFixed(0))
                            }
                            const powerAvg = powerAll / availableMemberCount;
                            const rateMember = Number.parseInt((availableMemberCount / allMemberCount * 100).toFixed(0));
                            for (const key of Object.keys(groupStati)) {
                                let rankAvailable: number = 1
                                let rankAvgPower: number = 1
                                let rankSumPower: number = 1
                                for (const c of Object.keys(groupStati)) {
                                    if (c !== key && groupStati[c].rateAvailable > groupStati[key].rateAvailable) {
                                        rankAvailable++
                                    }
                                    if (c !== key && groupStati[c].powerAvg > groupStati[key].powerAvg) {
                                        rankAvgPower++
                                    }
                                    if (c !== key && groupStati[c].powerAll > groupStati[key].powerAll) {
                                        rankSumPower++
                                    }
                                }
                                groupStati[key].rankAvailable = rankAvailable
                                groupStati[key].rankSumPower = rankSumPower
                                groupStati[key].rankAvgPower = rankAvgPower
                            }
                            this.setState({
                                result: {
                                    rateMember: rateMember,
                                    allMemberCount: allMemberCount,
                                    availableMemberCount: availableMemberCount,
                                    powerAll: powerAll,
                                    powerAvg: Number.parseInt(powerAvg.toFixed(0)),
                                    powerMaxMember: powerMaxMember,
                                    powerMinMember: powerMinMember,
                                    groupStati: groupStati
                                }
                            })
                        }
                    }
                    }>生成战功报表</Button>
            </div>
            {result && this.state.selected.fileA && this.state.selected.fileB && (
                <div style={{
                }}>
                    标题：考勤助手v0.1测试版<br/>
                    内容：<br/>
                    统计时间{this.getFormatValue(this.state.selected.fileA)}-{this.getFormatValue(this.state.selected.fileB)}<br/>
                    总人数{result.allMemberCount}{' '}参战人数{result.availableMemberCount}{' '}总战功{result.powerAll}{' '}人均战功{result.powerAvg}
                    <br/>
                    最高战功#{result.powerMaxMember}#{' '}最低战功#{result.powerMinMember}{' '}#参战比例{result.rateMember}%<br/>
                    备注：该次活动战功少于100视为缺勤
                    {Object.keys(result.groupStati).map(value => {
                        const group = result.groupStati[value]
                        return <div>
                            【{value}】<br/>
                            排名：出勤 {group.rankAvailable}{' '}人均{group.rankAvgPower}{' '}总战功{group.rankSumPower}
                            <br/>
                            人数：总人数 {group.allMemberCount}{' '}参战人数{group.availableMemberCount}{' '} <br/>
                            参战：比例{group.rateAvailable}%{' '}总战功{group.powerAll}{' '}人均战功{group.powerAvg}
                            <br/>
                            &缺勤人员&：{group.dead.join('、')
                        }
                        </div>
                    })}
                </div>
            )}
            {/*<table dangerouslySetInnerHTML={{*/}
            {/*    __html: this.state.csvResult*/}
            {/*}}>*/}
            {/*</table>*/}
        </div>
    }

    private getTimeOptions(a: string[]) {
        return a.map((value) => {
            return {
                value: value,
                label: this.getFormatValue(value),
            }
        });
    }

    private getFormatValue(value: string) {
        const match = /(\d{4})年(\d{2})月(\d{2})日(\d{2})时(\d{2})分(\d{2})秒/gm.exec(value)
        if (!match) return ''
        return `${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
    }

    private getOptions() {
        const owners = new Set(Object.keys(this.state.options).map(value => {
            const sub = this.state.options[value]
            return sub.owner
        }))
        return Array.from(owners).map(value => {
            return {
                value: value,
                label: `盟主： ${value}`,
            }
        })
    }


}



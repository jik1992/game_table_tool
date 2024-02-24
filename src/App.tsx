// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import {Button, Checkbox, Radio, Select, Upload} from "antd";
import {InboxOutlined} from '@ant-design/icons';
import _ from "lodash";
import {availableColumns, createMomentTime, exportStati, extractedCSVData, extractFormatTimeString} from "./utils/util";

import "pikaday/css/pikaday.css";
import {HotTable} from "@handsontable/react";
import 'handsontable/dist/handsontable.full.min.css';
import {ResultData} from "./utils/app";
import {generateAllSummary, generateRangeSummary, generateWeekSummary} from "./utils/summary";

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';

registerLanguageDictionary(zhCN);

registerAllModules();

type IProps = {};

type IState = {
    csvResult: string
    optionsA: string[],
    optionsB: string[],
    selected: {
        owner?: string,
        fileA?: string,
        fileB?: string,
    }
    fileCount: number,
    resultSetting: {
        mergePower: boolean,
        rank: boolean,
        stati: boolean,
        dead: boolean,
        groups: string[]
    },
    mode: 'text' | 'image' | 'table' | 'debug',
    result?: ResultData
};


export class App extends React.PureComponent<IProps, IState> {
    // refPhoto = useRef<HTMLDivElement>(null)

    state: IState = {
        csvResult: '',
        fileCount: 0,
        selected: {},
        optionsA: [],
        optionsB: [],
        resultSetting: {
            mergePower: true,
            rank: true,
            stati: true,
            dead: true,
            groups: []
        },
        mode: 'table'
    };

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    allFiles: {
        [key: string]: {
            owner: string,
            data: string[][]
        }
    } = {}

    render() {
        const {result} = this.state
        return <div className="App">
            <Upload.Dragger
                style={{
                    width: '100%',
                    height: 100,
                }}
                showUploadList={false}
                beforeUpload={(file, FileList) => {
                    const fileName = file.name
                    if (fileName in this.allFiles || !fileName) {
                        return false;
                    }
                    const reader = new FileReader()
                    reader.readAsText(file)
                    reader.onload = async () => {
                        const csv = reader.result as string;
                        if (!csv || !fileName) return;
                        const {headers, data} = extractedCSVData(csv);
                        // this.renderDebugInfo(headers, data);
                        this.allFiles[fileName] = {
                            owner: data[0][0],
                            data: data
                        }
                        this.setState({
                            fileCount: Object.keys(this.allFiles).length
                        })
                    }
                }}
                name="files" multiple={true}>
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
                {this.state.fileCount > 0 &&
                    <div style={{fontSize: 12, color: "red"}}>成功加载 {this.state.fileCount} 文件</div>}
                盟主:
                <Select
                    style={{width: 200}}
                    value={this.state.selected.owner}
                    options={this.getOptions()}
                    onChange={(value, option) => {
                        const a: string[] = []
                        for (const key of Object.keys(this.allFiles)) {
                            if (this.allFiles[key].owner === value) {
                                a.push(key)
                            }
                        }
                        this.setState({
                            selected: {
                                owner: value,
                                fileA: undefined,
                                fileB: undefined,
                            },
                            optionsA: a,
                            result: undefined
                        })
                    }}
                />
                开始时间:
                <Select style={{width: 150}}
                        value={this.state.selected.fileA}
                        options={this.getStartTimeOptions(this.state.optionsA)}
                        onChange={(value, option) => {
                            const a: string[] = []
                            for (const key of Object.keys(this.allFiles)) {
                                if (this.allFiles[key].owner === this.state.selected.owner) {
                                    a.push(key)
                                }
                            }
                            this.setState({
                                selected: {
                                    ...this.state.selected,
                                    fileA: value,
                                    fileB: undefined
                                },
                                optionsB: a
                            })
                        }}
                />
                结束时间:
                <Select style={{width: 150}}
                        value={this.state.selected.fileB}
                        options={this.getEndTimeOptions(this.state.optionsB)}
                        onChange={(value, option) => {
                            this.setState({
                                selected: {
                                    ...this.state.selected,
                                    fileB: value,

                                },
                                result: undefined
                            })
                        }}
                /> [战功/助攻]合并<Checkbox checked={this.state.resultSetting.mergePower} onChange={(e) => {
                this.setState({
                    resultSetting: {
                        ...this.state.resultSetting,
                        mergePower: e.target.checked
                    }
                })
            }}/>
                <Button
                    style={{marginLeft: 5}}
                    type={"primary"}
                    onClick={() => {
                        const fileA = Object.keys(this.allFiles).find(value => this.allFiles[value].owner === this.state.selected.owner &&
                            value === this.state.selected.fileA)
                        const fileB = Object.keys(this.allFiles).find(value => this.allFiles[value].owner === this.state.selected.owner &&
                            value === this.state.selected.fileB)
                        if (fileA && fileB) {
                            const dataA = this.allFiles[fileA].data
                            const dataB = this.allFiles[fileB].data
                            const result = exportStati(dataB, dataA, this.state.resultSetting.mergePower);
                            this.setState({
                                result: {
                                    ...result,
                                },
                                resultSetting: {
                                    ...this.state.resultSetting,
                                    rank: true,
                                    dead: true,
                                    groups: result.groupNames
                                }
                            })
                        }
                    }
                    }
                    disabled={!this.state.selected || !this.state.selected.fileB}
                >生成战功报表</Button>
            </div>

            {result && this.state.selected.fileA && this.state.selected.fileB && (
                <div >
                    <Select
                        value={this.state.mode}
                        options={[
                            {value: 'text', label: '法令模式'},
                            {value: 'table', label: '报表模式'},
                            {value: 'debug', label: '调试模式'},
                        ]}
                        onChange={(e) => {
                            this.setState({mode: e as 'text' | 'image' | 'table'})
                            if (e === 'debug') {
                                this.setState({
                                    resultSetting: {
                                        ...this.state.resultSetting,
                                        groups: [this.state.resultSetting.groups[0]]
                                    }
                                })
                            } else {
                                this.setState({
                                    resultSetting: {
                                        ...this.state.resultSetting,
                                        // @ts-ignore
                                        groups: this.state.result.groupNames
                                    }
                                })
                            }
                        }}
                    />
                    {Object.keys(result.groupStati).map(value => {
                        return <Checkbox
                            onChange={(s) => {
                                console.info(s.target)
                                if (s.target.checked) {
                                    this.setState({
                                        resultSetting: {
                                            ...this.state.resultSetting,
                                            groups: this.state.resultSetting.groups.concat(value)
                                        }
                                    })
                                } else {
                                    const groups = _.cloneDeep(this.state.resultSetting.groups)
                                    _.remove(groups, v => v === value)
                                    this.setState({
                                        resultSetting: {
                                            ...this.state.resultSetting,
                                            groups: groups
                                        }
                                    })
                                }
                            }}
                            checked={this.state.resultSetting.groups.includes(value)}>{value}</Checkbox>
                    })}
                    {this.state.mode === "debug" && this.renderDebugResult()}
                    {this.state.mode === "table" && this.renderTableResult()}
                    {this.state.mode === "text" && this.renderTextResult()}
                </div>
            )}
        </div>
    }

    private renderDebugResult() {
        const {result, resultSetting} = this.state

        if (!result || !this.state.selected.fileA || !this.state.selected.fileB) {
            return ''
        }

        const dataA = this.allFiles[this.state.selected.fileA].data
        const dataB = this.allFiles[this.state.selected.fileB].data

        return <div>
            {
                this.renderTable({
                    data: dataA.filter(value => resultSetting.groups.includes(value[7])),
                    columns: availableColumns
                })
            } {
            this.renderTable({
                data: dataB.filter(value => resultSetting.groups.includes(value[7])),
                columns: availableColumns
            })
        }
        </div>;
    }

    private renderTableResult() {
        const {result} = this.state

        if (!result || !this.state.selected.fileA || !this.state.selected.fileB) {
            return ''
        }
        return <div>
            区间战功考核
            {this.renderTable(generateRangeSummary(result, this.state.resultSetting.groups))}
            周战功考核
            {this.renderTable(generateWeekSummary(result, this.state.resultSetting.groups))}
            汇总战功考核
            {this.renderTable(generateAllSummary(result, this.state.resultSetting.groups))}
        </div>;
    }

    // https://handsontable.com/docs/react-data-grid/
    private renderTable(source: { data: string[][]; columns: string[] }) {
        return <HotTable
            data={source.data}
            colHeaders={source.columns}
            language={zhCN.languageCode}
            width={'100%'}
            height={'auto'}
            rowHeaders={true}
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
        </HotTable>;
    }


    private renderTextResult() {
        const {result} = this.state

        if (!result || !this.state.selected.fileA || !this.state.selected.fileB) {
            return ''
        }
        return <div>
            <div style={{}}>
                <div>
                    <Checkbox checked={this.state.resultSetting.rank} onChange={(s) => {
                        this.setState({
                            resultSetting: {
                                ...this.state.resultSetting,
                                rank: s.target.checked
                            }
                        })
                    }}>显示排名</Checkbox>

                    <Checkbox checked={this.state.resultSetting.stati} onChange={(s) => {
                        this.setState({
                            resultSetting: {
                                ...this.state.resultSetting,
                                stati: s.target.checked
                            }
                        })
                    }}>显示统计</Checkbox>
                    <Checkbox onChange={(s) => {
                        this.setState({
                            resultSetting: {
                                ...this.state.resultSetting,
                                dead: s.target.checked
                            }
                        })
                    }} checked={this.state.resultSetting.dead}>显示缺勤</Checkbox>
                </div>
                标题：考勤助手v0.1测试版<br/>
                内容：<br/>
                统计时间{extractFormatTimeString(this.state.selected.fileA)}-{extractFormatTimeString(this.state.selected.fileB)}<br/>
                总人数{result.allMemberCount}{' '}参战人数{result.availableMemberCount}{' '}总战功{result.powerAll}{' '}人均战功{result.powerAvg}
                <br/>
                最高战功#{result.powerMaxMember}#{' '}最低战功#{result.powerMinMember}{' '}#参战比例{result.rateMember}%<br/>
                备注：该次活动战功少于100视为缺勤
                {Object.keys(result.groupStati).map(value => {
                    const group = result.groupStati[value]
                    if (!this.state.resultSetting.groups.includes(value)) return null
                    return <div>
                        【{value}】<br/>
                        {this.state.resultSetting.rank && (<>排名：出勤 {group.rankAvailable}{' '}人均{group.rankAvgPower}{' '}总战功{group.rankSumPower}
                            <br/></>)}
                        {this.state.resultSetting.stati && (
                            <>人数：总人数 {group.allMemberCount}{' '}参战人数{group.availableMemberCount}{' '}
                                <br/>
                                参战：比例{group.rateAvailable}%{' '}总战功{group.rangePowerSum}{' '}人均战功{group.rangePowerAvg}
                                <br/></>
                        )}
                        {this.state.resultSetting.dead && (<> &缺勤人员&：{group.dead.join('、')}</>)}
                    </div>
                })}
            </div>
        </div>;
    }

    private renderDebugInfo(headers: string[], data: string[][]) {
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
        this.setState({
            csvResult: outputHtml
        })
    }

    private getStartTimeOptions(timelines: string[]) {
        return timelines.sort((a, b) => {
            return createMomentTime(a) > createMomentTime(b) ? -1 : 1
        }).map((value) => {
            return {
                value: value,
                label: extractFormatTimeString(value),
            }
        });
    }

    private getEndTimeOptions(a: string[]) {
        if (!this.state.selected.fileA) return [{
            value: '',
            label: 'no available',
        }]
        const startTime = createMomentTime(this.state.selected.fileA)
        return a.filter((value, index) => {
            if (value) {
                const endTime = createMomentTime(value)
                if (startTime < endTime) {
                    return true
                }
            }
            return false
        }).sort((a, b) => {
            return createMomentTime(a) < createMomentTime(b) ? -1 : 1
        }).map((value) => {
            return {
                value: value,
                label: extractFormatTimeString(value),
            }
        });
    }


    private getOptions() {
        const owners = new Set(Object.keys(this.allFiles).map(value => {
            const sub = this.allFiles[value]
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



// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import {Button, Checkbox, message, Radio, Select, Upload} from "antd";
import {InboxOutlined} from '@ant-design/icons';
import _ from "lodash";
import {
    availableColumns,
    createMomentTime,
    exportStati,
    extractedCSVData,
    extractFormatTimeString
} from "../utils/util";

import "pikaday/css/pikaday.css";
import {HotTable} from "@handsontable/react";
import 'handsontable/dist/handsontable.full.min.css';
import {ResultData} from "../utils/app";
import {generateAllSummary, generateRangeSummary, generateWeekSummary} from "../utils/summary";

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';
import html2canvas from "html2canvas";

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


export class CheckerContainer extends React.PureComponent<IProps, IState> {
    refPhoto = React.createRef<HTMLDivElement>()

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
        mode: 'debug'
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
        return <>
            {this.state.fileCount ? (
                <div>
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
                        {this.existResult() && (
                            <Button onClick={() => {
                                if (this.refPhoto.current) {
                                    html2canvas(this.refPhoto.current, {
                                        scale: 2,
                                    }).then(async (canvas) => {
                                        const dataUrl = canvas.toDataURL('image/png') //轉換成 Data URL 表示格式的png圖檔
                                        // const link = document.createElement('a')
                                        // link.download = 'your-image.png'
                                        // link.href = dataUrl
                                        // link.click()
                                        await this.copyImgToClipboard(dataUrl)
                                        message.success('copied snapshot successful.')
                                    });
                                }
                            }}>copy</Button>
                        )}
                    </div>

                    {this.existResult() && (
                        <div ref={this.refPhoto}>
                            <Select
                                value={this.state.mode}
                                options={[
                                    {value: 'debug', label: '考勤模式'},
                                    {value: 'text', label: '法令模式'},
                                    {value: 'table', label: '报表模式'},
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
                            {result && Object.keys(result.groupStati).map(value => {
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
            ) : (<Upload.Dragger
                style={{
                    width: '100%',
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
            </Upload.Dragger>)}


        </>
    }

    private existResult() {
        const {result, selected} = this.state
        return result && selected.fileA && selected.fileB;
    }

    private renderDebugResult() {
        const {result, resultSetting} = this.state

        if (!result || !this.state.selected.fileA || !this.state.selected.fileB) {
            return ''
        }

        const dataA = this.allFiles[this.state.selected.fileA].data.filter(value => resultSetting.groups.includes(value[7]))
        const dataB = this.allFiles[this.state.selected.fileB].data.filter(value => resultSetting.groups.includes(value[7]))
        let columns = availableColumns.map(value => `表1 ${value}`).concat(availableColumns.map(value => `表2 ${value}`))
        const bNames = new Set<string>(dataB.map(value => value[0]))
        for (let i = 0; i < dataA.length; i++) {
            const bData = dataB.find(value => value[0] === dataA[i][0])
            if (bData) {
                dataA[i] = dataA[i].concat(bData)
                bNames.delete(bData[0])
            }
        }
        if (bNames.size !== 0) {
            bNames.forEach(bName => {
                const bData = dataB.find(value => value[0] === bName)
                if (bData) {
                    let row = [bData[0]]
                    for (const availableColumn of availableColumns) {
                        row.push("")
                    }
                    row = row.concat(bData.slice(1))
                    dataA.push(row)
                }
            })
        }
        columns = [columns[0]].concat(['势力差', '战功差', '助攻差', '攻势比']).concat(columns.slice(1))
        for (let i = 0; i < dataA.length; i++) {
            if (dataA[i][13] && dataA[i][5]) {
                const latestLife = Number.parseInt(dataA[i][13])
                const life = String(latestLife - Number.parseInt(dataA[i][5]))
                const power = Number.parseInt(dataA[i][11]) - Number.parseInt(dataA[i][3])
                const helpPower = Number.parseInt(dataA[i][12]) - Number.parseInt(dataA[i][4])
                const result = String(((power + helpPower) / latestLife).toFixed(2))
                const newColumns = [life, power.toFixed(0), helpPower.toFixed(0), result]
                dataA[i] = [dataA[i][0]].concat(newColumns).concat(dataA[i].slice(1))
            } else {
                dataA[i] = [dataA[i][0]].concat(['', '', '', '']).concat(dataA[i].slice(1))
            }
        }
        console.info(dataA)
        return <div>
            {
                this.renderTable({
                    data: dataA,
                    columns: columns
                }, '85vh')
            }
        </div>;
    }

    private renderTableResult() {
        const {result} = this.state

        if (!result || !this.state.selected.fileA || !this.state.selected.fileB) {
            return ''
        }
        return <div>
            {`${extractFormatTimeString(this.state.selected.fileA)} - ${extractFormatTimeString(this.state.selected.fileB)}`}战功考核
            {this.renderTable(generateRangeSummary(result, this.state.resultSetting.groups))}
            周战功考核
            {this.renderTable(generateWeekSummary(result, this.state.resultSetting.groups))}
            汇总战功考核
            {this.renderTable(generateAllSummary(result, this.state.resultSetting.groups))}
        </div>;
    }

    // https://handsontable.com/docs/react-data-grid/
    private renderTable(source: { data: string[][]; columns: string[] }, height = 'auto') {
        return <HotTable
            data={source.data}
            colHeaders={source.columns}
            language={zhCN.languageCode}
            width={'auto'}
            height={height}
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

    private copyImgToClipboard = async (imgUrl: any) => {
        try {
            const data = await fetch(imgUrl);
            const blob = await data.blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);
            console.log('Image copied.');
        } catch (err) {
            console.error(err);
        }
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



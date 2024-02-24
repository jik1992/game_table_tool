import {ResultData} from "./app";


export const generateRangeSummary = (result: ResultData, filters: string [],) => {
    const data: any[][] = []
    Object.keys(result.groupStati).map((groupName, index) => {
        data.push([
            groupName,
            result.groupStati[groupName].allMemberCount,
            result.groupStati[groupName].availableMemberCount,
            result.groupStati[groupName].rateAvailable,
            `${(result.groupStati[groupName].life / result.groupStati[groupName].allMemberCount).toFixed(2)}`,
            result.groupStati[groupName].rankSumPower,
            result.groupStati[groupName].rangePowerSum,
            result.groupStati[groupName].rangePowerAvg,
            result.groupStati[groupName].rankSumPower,
            result.groupStati[groupName].ratePowerLife,
            result.groupStati[groupName].rankPowerLife
        ])
    })
    return {
        data: data.filter(value => filters.includes(value[0])).sort((a, b) => {
            return a[10] < b[10] ? -1 : 1
        }),
        columns: [
            "小组",
            "人数",
            "参与人数",
            "参与率(%)",
            "人均势力",
            "势力排名",
            `区间战功`,
            "区间人均战功",
            "战功排名",
            "战功/势力",
            "伤转排名",
        ]
    };
}

export const generateWeekSummary = (result: ResultData, filters: string []) => {
    const data: string[][] = []
    Object.keys(result.groupStati).map((groupName, index) => {
        data.push([
            groupName,
            result.groupStati[groupName].allMemberCount as unknown as string,
            `${(result.groupStati[groupName].life / result.groupStati[groupName].allMemberCount).toFixed(2)}`,
            result.groupStati[groupName].rankSumLife as unknown as string,
            result.groupStati[groupName].allWeekPower as unknown as string,
            result.groupStati[groupName].rankAllWeekPower as unknown as string,
            result.groupStati[groupName].rateAllWeekPowerLife as unknown as string,
            result.groupStati[groupName].rankAllWeekPowerLife as unknown as string,
        ])
    })
    return {
        data: data.filter(value => filters.includes(value[0])).sort((a, b) => {
            return a[5] < b[5] ? -1 : 1
        }),
        columns: [
            '小组', '人数', '人均势力', '势力排名', '周战功', '战功排名', '战功/势力', '伤转排名'
        ]
    };
}

export const generateAllSummary = (result: ResultData, filters: string []) => {
    const data: string[][] = []
    Object.keys(result.groupStati).map((groupName, index) => {
        data.push([
            groupName,
            result.groupStati[groupName].allMemberCount as unknown as string,
            result.groupStati[groupName].allPower as unknown as string,
            result.groupStati[groupName].rankAllPower as unknown as string,
            result.groupStati[groupName].rateAllPowerLife as unknown as string,
            result.groupStati[groupName].rankAllPowerLife as unknown as string
        ])
    })
    return {
        data: data.filter(value => filters.includes(value[0])).sort((a, b) => {
            return a[5] < b[5] ? -1 : 1
        }),
        columns: [
            "小组",
            "人数",
            "总战功",
            "总战功排名",
            "总(战功/势力)",
            "总伤转排名",
        ]
    };
}
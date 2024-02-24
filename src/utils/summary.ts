import {ResultData} from "./app";

export const generateSingleSummary = (result: ResultData, filters: string[]) => {
    const data: any[][] = []
    Object.keys(result.groupStati).map((groupName, index) => {
        data.push([
            groupName,
            result.groupStati[groupName].allMemberCount as unknown as string,
            result.groupStati[groupName].availableMemberCount as unknown as string,
            result.groupStati[groupName].rateAvailable,
            result.groupStati[groupName].powerAvg as unknown as string,
        ])
    })
    return {
        data: data.filter(value => filters.includes(value[0])).sort((a, b) => {
            return a[3] < b[3] ? 1 : -1
        }),
        columns: [
            "小组",
            "人数",
            "参与人数",
            "参与率(%)",
            "人均战功",
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
            result.groupStati[groupName].rankSumPower as unknown as string,
            result.groupStati[groupName].powerAll as unknown as string,
            result.groupStati[groupName].rankSumPower as unknown as string,
            result.groupStati[groupName].ratePowerLife as unknown as string,
            result.groupStati[groupName].rankPowerLife as unknown as string
        ])
    })
    return {
        data: data.filter(value => filters.includes(value[0])).sort((a, b) => {
            return a[7] < b[7] ? -1 : 1
        }),
        columns: [
            "小组",
            "人数",
            "人均势力",
            "势力排名",
            "周总战功",
            "战功排名",
            "战功/势力",
            "伤转排名",
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
            return a[7] < b[7] ? -1 : 1
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
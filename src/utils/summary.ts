import {ResultData} from "./app";

export const generateSingleSummary = (result: ResultData) => {
    const data: string[][] = []
    Object.keys(result.groupStati).map((groupName, index) => {
        data.push([
            groupName,
            result.groupStati[groupName].allMemberCount as unknown as string,
            result.groupStati[groupName].availableMemberCount as unknown as string,
            `${result.groupStati[groupName].rateAvailable as unknown as string}%`,
            result.groupStati[groupName].powerAvg as unknown as string,
        ])
    })
    return {
        data,
        columns: [
            "小组",
            "人数",
            "参与人数",
            "参与率",
            "人均战功",
        ]
    };
}

export const generateWeekSummary = (result: ResultData) => {
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
        data: data.sort((a, b) => {
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
export const generateAllSummary = (result: ResultData) => {
    const data: string[][] = []
    Object.keys(result.groupStati).map((groupName, index) => {
        data.push([
            groupName,
            result.groupStati[groupName].allMemberCount as unknown as string,
            '',
            '',
            '',
            ''
        ])
    })
    return {
        data: data.sort((a, b) => {
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
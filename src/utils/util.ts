import moment from "moment/moment";
import {GroupStati} from "./app";

export const createMomentTime = (fileName: string) => {
    return moment(extractFormatTimeString(fileName), 'MM/DD hh/mm');
}

export const extractFormatTimeString = (value: string) => {
    const match = /(\d{4})年(\d{2})月(\d{2})日(\d{2})时(\d{2})分(\d{2})秒/gm.exec(value)
    if (!match) return ''
    return `${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
}


export const extractedCSVData = (csv: string) => {
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
        lines = lines.filter((value, index) => {
            return shows.includes(index);
        })
        return lines
    });
    return {headers, data};
}
const LIMIT_MIN = 100
export const availableColumns = [
    '成员', '战功本周', '助攻本周', '战功总量', '助攻总量', '势力值', '所属阵营', '分组',
]

function getLife(row: string[]) {
    return Number.parseInt(row[5]);
}

function getGroupName(row: string[]) {
    return row[7];
}

function getPowerWeek(row: string[], isMerge = false) {
    if (isMerge) {
        return Number.parseInt(row[1]) + Number.parseInt(row[2]);
    }
    return Number.parseInt(row[1]);
}

function getPowerAll(row: string[], isMerge = false) {
    if (isMerge) {
        return Number.parseInt(row[3]) + Number.parseInt(row[4]);
    }
    return Number.parseInt(row[3]);
}

export const exportStati = (dataB: string[][], dataA: string[][], isMerge = false) => {
    const allMemberCount = dataB.length
    const groupNames: string[] = []

    let availableMemberCount = 0
    let powerAll = 0
    let powerMax = 0
    let powerMaxMember = ''
    let powerMin = Number.MAX_VALUE
    let powerMinMember = ''
    let groupStati: {
        [key: string]: GroupStati
    } = {}
    for (const row of dataB) {
        if (!getGroupName(row)) {
            continue
        }
        if (getGroupName(row) in groupStati) {
            groupStati[getGroupName(row)] = {
                ...groupStati[getGroupName(row)],
                allMemberCount: groupStati[getGroupName(row)].allMemberCount + 1,
            }
        } else {
            groupNames.push(getGroupName(row))
            groupStati[getGroupName(row)] = {
                allMemberCount: 1,
                availableMemberCount: 0,
                rangePowerAvg: 0,
                rangePowerSum: 0,
                dead: [],
                rankAvailable: 0,
                life: 0,
                rankSumLife: 0,
                rankAvgPower: 0,
                rankSumPower: 0,
                rateAvailable: 0,
                rankPowerLife: 0,
                ratePowerLife: 0,
                allPower: 0,
                rateAllPowerLife: 0,
                rankAllPower: 0,
                rankAllPowerLife: 0,
                allWeekPower: 0,
                rankAllWeekPower: 0,
                rateAllWeekPowerLife: 0,
                rankAllWeekPowerLife: 0,
            }
        }
    }
    for (const row of dataB) {
        if (!getGroupName(row)) {
            continue
        }
        const member = row[0]
        const memberGroup = getGroupName(row)
        const rowMemberA = dataA.find(value => value[0] === member)

        groupStati[memberGroup] = {
            ...groupStati[memberGroup],
            life: groupStati[memberGroup].life + getLife(row),
            allPower: groupStati[memberGroup].allPower + getPowerAll(row, isMerge),
            allWeekPower: groupStati[memberGroup].allWeekPower + getPowerWeek(row, isMerge),
        }

        let ok = 0
        if (rowMemberA) {
            ok = getPowerWeek(row, isMerge) - getPowerWeek(rowMemberA, isMerge)
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
                    rangePowerSum: groupStati[memberGroup].rangePowerSum + ok,
                }
            } else {
                groupStati[memberGroup] = {
                    ...groupStati[memberGroup],
                    dead: groupStati[memberGroup].dead.concat([member])
                }
            }
        } else {
            ok = getPowerWeek(row, isMerge)
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
                    rangePowerSum: groupStati[memberGroup].rangePowerSum + ok,
                }
            } else {

            }
        }

    }
    for (const key of Object.keys(groupStati)) {
        groupStati[key].rangePowerAvg = Number.parseInt((groupStati[key].rangePowerSum / groupStati[key].availableMemberCount).toFixed(0))
        groupStati[key].rateAvailable = Number.parseInt((groupStati[key].availableMemberCount / groupStati[key].allMemberCount * 100).toFixed(0))
        groupStati[key].ratePowerLife = groupStati[key].rangePowerSum / groupStati[key].life
        groupStati[key].rateAllPowerLife = groupStati[key].allPower / groupStati[key].life
        groupStati[key].rateAllWeekPowerLife = groupStati[key].allWeekPower / groupStati[key].life
    }
    const powerAvg = powerAll / availableMemberCount;
    const rateMember = Number.parseInt((availableMemberCount / allMemberCount * 100).toFixed(0));
    for (const key of Object.keys(groupStati)) {
        let rankAvailable: number = 1
        let rankAvgPower: number = 1
        let rankSumPower: number = 1
        let rankSumLife: number = 1
        let rankPowerLife: number = 1
        let rankAllPower: number = 1
        let rankAllPowerLife: number = 1
        let rankAllWeekPower: number = 1
        let rankAllWeekPowerLife: number = 1
        for (const c of Object.keys(groupStati)) {
            if (c !== key && groupStati[c].rateAvailable > groupStati[key].rateAvailable) {
                rankAvailable++
            }
            if (c !== key && groupStati[c].rangePowerAvg > groupStati[key].rangePowerAvg) {
                rankAvgPower++
            }
            if (c !== key && groupStati[c].rangePowerSum > groupStati[key].rangePowerSum) {
                rankSumPower++
            }if (c !== key && groupStati[c].life > groupStati[key].life) {
                rankSumLife++
            }
            if (c !== key && groupStati[c].ratePowerLife > groupStati[key].ratePowerLife) {
                rankPowerLife++
            }
            if (c !== key && groupStati[c].allPower > groupStati[key].allPower) {
                rankAllPower++
            }
            if (c !== key && groupStati[c].rateAllPowerLife > groupStati[key].rateAllPowerLife) {
                rankAllPowerLife++
            }if (c !== key && groupStati[c].allWeekPower > groupStati[key].allWeekPower) {
                rankAllWeekPower++
            }if (c !== key && groupStati[c].rateAllWeekPowerLife > groupStati[key].rateAllWeekPowerLife) {
                rankAllWeekPowerLife++
            }
        }
        groupStati[key].rankAvailable = rankAvailable
        groupStati[key].rankSumPower = rankSumPower
        groupStati[key].rankAvgPower = rankAvgPower
        groupStati[key].rankSumLife = rankSumLife
        groupStati[key].rankPowerLife = rankPowerLife
        groupStati[key].rankAllPower = rankAllPower
        groupStati[key].rankAllPowerLife = rankAllPowerLife
        groupStati[key].rankAllWeekPower = rankAllWeekPower
        groupStati[key].rankAllWeekPowerLife = rankAllWeekPowerLife
    }
    return {
        allMemberCount,
        groupNames,
        availableMemberCount,
        powerAll,
        powerMaxMember,
        powerMinMember,
        groupStati,
        powerAvg: Number.parseInt(powerAvg.toFixed(0)),
        rateMember
    };
}
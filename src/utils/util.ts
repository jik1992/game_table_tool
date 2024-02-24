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
const availableColumns = [
    '成员', '战功本周', '助攻本周', '战功总量', '助攻总量', '势力值', '所属阵营', '分组',
]

function getLife(row: string[]) {
    return row[5];
}

function getGroupName(row: string[]) {
    return row[7];
}

function getPowerWeek(row: string[]) {
    return Number.parseInt(row[1]);
}

export const exportStati = (dataB: string[][], dataA: string[][]) => {
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
                availableMemberCount: 0,
                powerAvg: 0,
                powerAll: 0,
                rankAvailable: 0,
                rankAvgPower: 0,
                rankSumPower: 0,
                rateAvailable: 0,
            }
        } else {
            groupNames.push(getGroupName(row))
            groupStati[getGroupName(row)] = {
                allMemberCount: 1,
                availableMemberCount: 0,
                powerAvg: 0,
                powerAll: 0,
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
        let ok = 0
        if (rowMemberA) {
            ok = getPowerWeek(row) - getPowerWeek(rowMemberA)
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
                    life: groupStati[memberGroup].life + Number.parseInt(getLife(row)),
                    powerAll: groupStati[memberGroup].powerAll + ok,
                    allPower: groupStati[memberGroup].allPower + getPowerWeek(row),
                }
            } else {
                groupStati[memberGroup] = {
                    ...groupStati[memberGroup],
                    dead: groupStati[memberGroup].dead.concat([member])
                }
            }
        } else {
            ok = getPowerWeek(row)
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
                    life: groupStati[memberGroup].life + Number.parseInt(getLife(row)),
                    powerAll: groupStati[memberGroup].powerAll + ok,
                    allPower: groupStati[memberGroup].allPower + getPowerWeek(row),
                }
            } else {

            }
        }

    }
    for (const key of Object.keys(groupStati)) {
        groupStati[key].powerAvg = Number.parseInt((groupStati[key].powerAll / groupStati[key].availableMemberCount).toFixed(0))
        groupStati[key].rateAvailable = Number.parseInt((groupStati[key].availableMemberCount / groupStati[key].allMemberCount * 100).toFixed(0))
        groupStati[key].ratePowerLife = groupStati[key].powerAll / groupStati[key].life
        groupStati[key].rateAllPowerLife = groupStati[key].allPower / groupStati[key].life
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
            if (c !== key && groupStati[c].ratePowerLife > groupStati[key].ratePowerLife) {
                rankPowerLife++
            }
            if (c !== key && groupStati[c].allPower > groupStati[key].allPower) {
                rankAllPower++
            }
            if (c !== key && groupStati[c].rateAllPowerLife > groupStati[key].rateAllPowerLife) {
                rankAllPowerLife++
            }
        }
        groupStati[key].rankAvailable = rankAvailable
        groupStati[key].rankSumPower = rankSumPower
        groupStati[key].rankAvgPower = rankAvgPower
        groupStati[key].rankSumLife = rankSumLife
        groupStati[key].rankPowerLife = rankPowerLife
        groupStati[key].rankAllPower = rankAllPower
        groupStati[key].rankAllPowerLife = rankAllPowerLife
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
export type ResultData = {
    rateMember: number
    allMemberCount: number
    availableMemberCount: number
    powerAll: number
    powerAvg: number
    powerMaxMember: string
    powerMinMember: string
    groupStati: {
        [key: string]: GroupStati
    }
}

export type GroupStati = {
    allMemberCount: number,
    availableMemberCount: number,
    rangePowerAvg: number,
    rangePowerSum: number,
    dead: string[],
    life: number,
    rankAvailable: number,
    rankAvgPower: number,
    rankSumPower: number,
    rankSumLife: number,
    rateAvailable: number,
    rankPowerLife: number,
    ratePowerLife: number,
    allPower: number,
    rankAllPower: number,
    rateAllPowerLife: number,
    rankAllPowerLife: number,
}
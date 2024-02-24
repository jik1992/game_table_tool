import moment from "moment/moment";

export const createMomentTime = (fileName: string) => {
    return moment(extractFormatTimeString(fileName), 'MM/DD hh/mm');
}

export const extractFormatTimeString = (value: string) => {
    const match = /(\d{4})年(\d{2})月(\d{2})日(\d{2})时(\d{2})分(\d{2})秒/gm.exec(value)
    if (!match) return ''
    return `${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
}
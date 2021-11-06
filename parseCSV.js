const obj={};
obj.days =["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const csv=require('csvtojson');

obj.dataProcess=async ()=>{
    let processedData=[];
    const sourceData = await csv({noheader:true}).fromFile('./rest_hours.csv');
    for(let r=0;r<sourceData.length;r++){
        const restaurantName=sourceData[r].field1;
        const restaurantOpeningTimesArr = sourceData[r].field2.split('/');
        for(let t=0;t<restaurantOpeningTimesArr.length;t++){
            const restaurantNewRecordsArr=getDays(restaurantName,restaurantOpeningTimesArr[t]);
            processedData=[...processedData,...restaurantNewRecordsArr];
        }
    }
    return processedData;
}

function getDays(restName,str){
    const resultArr = [];
    const cleanedTxt = str.replaceAll(' ','');
    const firstDigitIndex = cleanedTxt.search(/\d/);
    let dayStringRaw = cleanedTxt.substr(0,firstDigitIndex);
    const openingHoursRawStr = cleanedTxt.substr(firstDigitIndex);
    const commaIndex=dayStringRaw.indexOf(',');
    const dashIndex = dayStringRaw.indexOf('-');
    const openingHours=getOpeningHoursArray(openingHoursRawStr);
    if(commaIndex>-1 && commaIndex<dashIndex){
        resultArr.push({
            restaurantName:restName,
            day:dayStringRaw.substr(0,3),
            openingTime:openingHours[0],
            closingTime:openingHours[1]
        });
        dayStringRaw=dayStringRaw.substr(commaIndex+1);
    }
    if(dayStringRaw.indexOf('-')===-1){
        resultArr.push({
            restaurantName:restName,
            day:dayStringRaw.substr(0,3),
            openingTime:openingHours[0],
            closingTime:openingHours[1]
        });
    }else{
        const dayArr = dayStringRaw.split('-');
        const startDayIndex=obj.days.indexOf(dayArr[0]);
        const endDayIndex = obj.days.indexOf(dayArr[1]);
        for(let d=startDayIndex;d<endDayIndex+1;d++){
            resultArr.push({
                restaurantName:restName,
                day:obj.days[d],
                openingTime:openingHours[0],
                closingTime:openingHours[1]
            });
        }
    }
    return resultArr;
}

function getOpeningHoursArray(openingHoursString) {
    let openingHoursArray = openingHoursString.trim().split("-")
    return openingHoursArray.map(giveMe24HourTime);
}

obj.isOpen=(timeOfDay, openingTime, closingTime)=>{
    return timeInMinutesFromMidnight(openingTime) <= timeInMinutesFromMidnight(timeOfDay) && timeInMinutesFromMidnight(timeOfDay) <= timeInMinutesFromMidnight(closingTime)
}

function timeInMinutesFromMidnight(timeString) {
    let hours, minutes
    [hours, minutes, ...rest] = timeString.trim().split(":")
    return parseInt(hours) * 60 + parseInt(minutes)
}

function giveMe24HourTime(timeStr){
    const amPmTimeArray = timeStr.split(/(am|pm)/)
    let hours, minutes
    [hours, minutes="00"] = amPmTimeArray[0].split(":")
    let isAfternoon = amPmTimeArray[1] === "pm"
    if (isAfternoon) {
        hours = (parseInt(hours) + 12).toString();
    }
    return `${hours}:${minutes}`;
}

module.exports = obj;

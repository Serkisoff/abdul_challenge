const dataProcessor = require('./parseCSV');

async function searchDate(dateStr){
    const resultList = [];
    const processedData = await dataProcessor.dataProcess();
    let dayIndex = dateStr.getDay()-1;
    if(dayIndex<0)dayIndex=6; //because i made first day of the week monday
    const dayName = dataProcessor.days[dayIndex];
    const timeStr = dateStr.getUTCHours().toString()+":"+dateStr.getUTCMinutes().toString();
    for(let r=0;r<processedData.length;r++){
        if(processedData[r].day===dayName && dataProcessor.isOpen(timeStr,processedData[r].openingTime,processedData[r].closingTime)){
            resultList.push(processedData[r]);
        }
    }
    console.log(resultList);
    return resultList;
}
searchDate(new Date());

// above is for the main objective -----------------------------------------------------------------------
// Below is for the Bonus2 -------------------------------------------------------------------------------
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017";


MongoClient.connect(url, async function(err, db) {
    if (err) throw err;
    const dbo = db.db("abdul_challenge");
    console.log("Database created!");
    await migrateFromCSV(dbo); //Optional
    const restaurantList = await dbo.collection('restaurants').aggregate([{$lookup:{
        from:'restaurant_opening_times',
        localField:'_id',
        foreignField:'restaurantId',
        as:'openingTimes'
        }}]).toArray();
    console.log(restaurantList);
    console.log('Finished');
});

async function migrateFromCSV(dbo){
    await dbo.collection('restaurants').deleteMany();
    await dbo.collection('restaurant_opening_times').deleteMany();
    const data = await dataProcessor.dataProcess();
    const groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };
    const restaurantGroupedByList = groupBy(data).undefined;
    for(let r=0;r<restaurantGroupedByList.length;r++){
        const restaurantResult = await dbo.collection('restaurants').insert({restaurantName:restaurantGroupedByList[r].restaurantName});
        const openTimesList=[];
        for(let t=0;t<data.length;t++){
            if(data[t].restaurantName===restaurantGroupedByList[r].restaurantName){
                openTimesList.push({
                    restaurantId:restaurantResult.insertedIds[0],
                    day:data[t].day,
                    openingTime:data[t].openingTime,
                    closingTime:data[t].closingTime,
                });
            }
        }
        if(openTimesList.length>0) await dbo.collection('restaurant_opening_times').insertMany(openTimesList);
    }
}










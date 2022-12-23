const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/toshiba/toshiba-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const toshiba = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                toshiba[i] = {}
                toshiba[i]['state'] = ($(state).children("strong").text())
                toshiba[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    toshiba[i]['states'][j] = {}
                    toshiba[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    toshiba[i]['states'][j]['link'] = link

                    toshiba[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(toshiba)
                fs.writeFileSync("./toshiba/toshiba.json", brand)

            }, 7000)

        } catch (error) {

        }
    })
}

scrap()

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            
            const tableDiv = $(postDiv).find(" table > tbody > tr")

            if(tableDiv.text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    if(i!==0){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).children("td").first().text()
                        arr[i-1]["address"] = $(serviceCenter).children("td:nth-child(2)").text().replaceAll("\t","").replaceAll("  ","").replaceAll("\n"," ").trim()
                        arr[i-1]["phone"] = $(serviceCenter).children("td:nth-child(3)").text().split("P:")[1]?.split("F:")[0]?.replaceAll("\n","")?.replaceAll("\t","").trim()
                        arr[i-1]["fax"] = $(serviceCenter).children("td:nth-child(3)").text()?.split("F:")[1]?.replaceAll("\n","")?.replaceAll("\t","").trim()
                    }
                })
            }else{
            }

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
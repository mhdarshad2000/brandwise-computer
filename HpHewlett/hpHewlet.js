const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/hp-hewlett-packard/hp-hewlett-packard-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const hpHevlet = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                hpHevlet[i] = {}
                hpHevlet[i]['state'] = ($(state).children("strong").text())
                hpHevlet[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    hpHevlet[i]['states'][j] = {}
                    hpHevlet[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    hpHevlet[i]['states'][j]['link'] = link

                    hpHevlet[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(hpHevlet)
                fs.writeFileSync("./hpHeWlet.json", brand)

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
            
            $(postDiv).find("table > tbody > tr").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children().first().children().first().text()
                arr[i]["address"] = $(serviceCenter).children().first().children("p").text().replaceAll("   ","").replaceAll("\n","  ").trim()
                arr[i]["phone"] = $(serviceCenter).children("td:nth-child(2)").text().split("\n")[0].trim()
            })
            
            

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
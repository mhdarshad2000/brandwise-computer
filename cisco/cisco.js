const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/cisco/cisco-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const cisco = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                cisco[i] = {}
                cisco[i]['state'] = ($(state).children("strong").text())
                cisco[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    cisco[i]['states'][j] = {}
                    cisco[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    cisco[i]['states'][j]['link'] = link

                    cisco[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(cisco)
                fs.writeFileSync("./cisco/cisco.json", brand)

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
                        arr[i]={}
                        arr[i]["serviceCenter"] = $(serviceCenter).children("td").first().text().replaceAll("\n","").trim()
                        arr[i]["address"] = $(serviceCenter).children("td:nth-child(2)").text().replaceAll("\t","").replaceAll("  ","").replaceAll("\n"," ").trim()
                        arr[i]["phone"] = $(serviceCenter).children("td:nth-child(3)").text().split(" Phone:")[1]?.split(" \n")[0].replaceAll("\n","").replaceAll("\t","").trim()
                })
            }else{
            }

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
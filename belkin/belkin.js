const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/belkin/belkin-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const belkin = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                belkin[i] = {}
                belkin[i]['state'] = ($(state).children("strong").text())
                belkin[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    belkin[i]['states'][j] = {}
                    belkin[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    belkin[i]['states'][j]['link'] = link

                    belkin[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(belkin)
                fs.writeFileSync("./belkin/belkin.json", brand)

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

            const tableDiv = $(postDiv).find("#cii_localgrid > tbody > tr")
            $(tableDiv).each((i,serviceCenter)=>{
                if(i>1){
                    console.log($(serviceCenter).text())
                }
            })
           

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
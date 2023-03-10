const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/fujitsu/fujitsu-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const fujitsu = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                fujitsu[i] = {}
                fujitsu[i]['state'] = ($(state).children("strong").text())
                fujitsu[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    fujitsu[i]['states'][j] = {}
                    fujitsu[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    fujitsu[i]['states'][j]['link'] = link

                    fujitsu[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(fujitsu)
                fs.writeFileSync("./fujitsu/fujitsu.json", brand)

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

            

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
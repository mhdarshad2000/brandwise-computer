const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/playstation/playstation-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const playstation = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                playstation[i] = {}
                playstation[i]['state'] = ($(state).children("strong").text())
                playstation[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    playstation[i]['states'][j] = {}
                    playstation[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    playstation[i]['states'][j]['link'] = link

                    playstation[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(playstation)
                fs.writeFileSync("./playstation/playStation.json", brand)

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
            

            const div = $(postDiv).children("div:not(.advlaterale)")

            if ($(div).children("h2").length) {
                $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text()
                    $(serviceCenter).children("div").each((j, address) => {
                        if (/[a-z]/gi.test($(address).text()))
                            arr[i]["address"] = $(address).text().replaceAll("  ", "").replaceAll("\t", "").replaceAll("\n", " ").trim()
                        else if ($(address).text().length)
                            arr[i]["phone"] = $(address).text().trim()
                    })
                })
            }
            else if (tableDiv.text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("td").children("h2").text().trim()
                    arr[i]["address"] = $(serviceCenter).children("td").children("div").text().split("(")[0]?.replaceAll("   ", "")?.replaceAll("\t", "")?.replaceAll("\n", " ").trim()
                    arr[i]["phone"] = "(" + $(serviceCenter).children("td").children("div").text().split("(")[1]?.replace(/[a-z]/gi, '')?.replace(/[@.-]/g, "").trim()
                })
            

            } else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text()
                        const div = $(serviceCenter).next()
                        if(/[a-z]/gi.test(div.text())){
                            arr[i-1]["address"]= div.text().replaceAll("\t","").replaceAll("\n","   ").trim()
                            arr[i-1]["phone"] = div.next().text().trim()
                        }else{
                            arr[i-1]["phone"] = div.text().trim()
                        }
                })
            }

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
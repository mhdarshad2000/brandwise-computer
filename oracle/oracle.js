const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/oracle/oracle-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const oracle = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                oracle[i] = {}
                oracle[i]['state'] = ($(state).children("strong").text())
                oracle[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    oracle[i]['states'][j] = {}
                    oracle[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    oracle[i]['states'][j]['link'] = link

                    oracle[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(oracle)
                fs.writeFileSync("./oracle/oracle.json", brand)

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
            if (tableDiv.text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("td").children("h2").text().trim()
                    arr[i]["address"] = $(serviceCenter).children("td").children("div").text().split("(")[0]?.replaceAll("   ", "")?.replaceAll("\t", "")?.replaceAll("\n", " ").trim()
                    arr[i]["phone"] = "(" + $(serviceCenter).children("td").children("div").text().split("(")[1]?.replace(/[a-z]/gi, '')?.replace(/[@.-]/g, "").trim()
                })
            } else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().includes("Nvidia Service Centers in Arvada")){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text()
                        const div = $(serviceCenter).next()
                        if(/[a-z]/gi.test(div.text())){
                            arr[i-1]["address"]= div.text().replaceAll("\t","").replaceAll("\n","   ").trim()
                            arr[i-1]["phone"] = div.next().text().trim()
                        }else{
                            arr[i-1]["phone"] = div.text().trim()
                        }
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
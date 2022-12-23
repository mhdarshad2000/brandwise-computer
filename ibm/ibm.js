const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/ibm/ibm-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const ibm = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                ibm[i] = {}
                ibm[i]['state'] = ($(state).children("strong").text())
                ibm[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    ibm[i]['states'][j] = {}
                    ibm[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    ibm[i]['states'][j]['link'] = link

                    ibm[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(ibm)
                fs.writeFileSync("./ibm/ibm.json", brand)

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

            const tableDiv = $(postDiv).find("table > tbody > tr")
            if (tableDiv.text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("td").children("h2").text().trim()
                    $(serviceCenter).children("td").children("div").each((j, address) => {
                        if (/[a-z]/gi.test($(address).text()))
                            arr[i]["address"] = $(address).text().replaceAll("\t", "").replaceAll("  ", "").replaceAll("\n", " ").trim()
                        else
                            arr[i]["phone"] = $(address).text().trim()
                    })
                })
            } else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().includes("IBM Service Centers in")){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text().trim()
                        if(/[a-z]/gi.test($(serviceCenter).next().text())){
                            arr[i-1]["address"] = $(serviceCenter).next().text().replaceAll("\t","").replaceAll("   ","").replaceAll("\n"," ").trim()
                            arr[i-1]["phone"] = $(serviceCenter).next().next().text().trim()
                        }else
                        arr[i-1]["phone"] = $(serviceCenter).next().text().trim()
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/nvidia/nvidia-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const nvidia = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                nvidia[i] = {}
                nvidia[i]['state'] = ($(state).children("strong").text())
                nvidia[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    nvidia[i]['states'][j] = {}
                    nvidia[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    nvidia[i]['states'][j]['link'] = link

                    nvidia[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(nvidia)
                fs.writeFileSync("./nvidia/nvidia.json", brand)

            }, 7000)

        } catch (error) {
            console.log(error)
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
                    const phone = $(serviceCenter).children("td").children("div").text().split("(")[1]?.replace(/[a-z]/gi, '')?.replace(/[@.-]/g, "").trim()
                    arr[i]["phone"] = phone ? "("+phone : ""
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
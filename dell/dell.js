const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/dell/dell-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const dell = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                dell[i] = {}
                dell[i]['state'] = ($(state).children("strong").text())
                dell[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        dell[i]['states'][j] = {}
                        dell[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        dell[i]['states'][j]['link'] = link
                        dell[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            dell[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(dell)
                fs.writeFileSync("./dell/dell.json", brand)
            }, 7000)

        } catch (error) {
            console.log(error)
        }
    })
}

scrap()


async function nextPage(url) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            let promises = []
            const htmlString = await rp(url)
            const $ = cheerio.load(htmlString)
            const div = $(".post")
            await $(div).children("ul").children("li").each(async (i, city) => {
                arr[i] = {}
                arr[i]["name"] = $(city).text()
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/dell")
                arr[i]["link"] = link
                promises.push({ i, link })
            })
            Promise.all(promises.map(async (i) => {
                arr[i.i]["city"] = await otherCity(i.link)
            })).then(() => {
                resolve(arr)
            })
        } catch (error) {
        }
    })
}

async function otherCity(otherUrl) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(otherUrl)
            const $ = cheerio.load(htmlString)
            const div = $(".post")
            $(div).find("div[ itemscope='itemscope']").each((i, serviceCenter) => {
                arr[i] = {}
                arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text().replaceAll("\n", "").replaceAll("\t", "").trim()
                arr[i]["address"] = $(serviceCenter).children("div").children("div").children("p").text()
                arr[i]["phone"] = $(serviceCenter).children("div").children("div").children("div [itemprop='telephone']").text()

            })
            resolve(arr)
        } catch (error) {

        }
    })
}

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")

            const table = $(postDiv).find(" table > tbody > tr")
            if (table) {
                $(table).each((i,serviceCenter)=>{
                    if(i!==0){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).children("td").first().children("a").first().text()
                        const a = $(serviceCenter).children("td").first().children("a").text()
                        arr[i-1]["address"] = $(serviceCenter).children("td").first().text().replace(a,"").split("Dell Competencies")[0].replaceAll("\n","").trim()
                        arr[i-1]["phone"] = $(serviceCenter).children("td:nth-child(2)").text().split("Phone:")[1]?.split("x")[0].replace("\t","")
                    }
                })
            }

            resolve(arr)
        } catch (error) {
         
            // console.error(error)
        }
    })
}
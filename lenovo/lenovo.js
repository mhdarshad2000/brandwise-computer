const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/lenovo/lenovo-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const lenovo = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                lenovo[i] = {}
                lenovo[i]['state'] = ($(state).children("strong").text())
                lenovo[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        lenovo[i]['states'][j] = {}
                        lenovo[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        lenovo[i]['states'][j]['link'] = link
                        lenovo[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            lenovo[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(lenovo)
                fs.writeFileSync("./lenovo/lenovo.json", brand)
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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "lenovo")
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
            let count = 0
            
            const tableDiv = $(postDiv).find(" table > tbody > tr > td > table > tbody")

            if(tableDiv.text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    let serviceCenterName = $(serviceCenter).children("tr").first().next()
                    arr[i]={}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("tr").first().text().replaceAll("   "," ").replaceAll("\n","").trim()
                    let address = []
                    while(/[a-z]/gi.test(serviceCenterName.text())){
                        address.push(serviceCenterName.text())
                        serviceCenterName = $(serviceCenterName).next()
                    }
                   arr[i]["address"] = address.join().split("Tel:")[0].replaceAll("\n","  ").replaceAll(","," ").replaceAll("           "," ").trim()
                   arr[i]["phone"] = address.join().split("Tel:")[1]?.split("\n")[0]
                })
            }

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
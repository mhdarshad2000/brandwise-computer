const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/siemens/siemens-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const siemens = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                siemens[i] = {}
                siemens[i]['state'] = ($(state).children("strong").text())
                siemens[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    siemens[i]['states'][j] = {}
                    siemens[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    siemens[i]['states'][j]['link'] = link

                    siemens[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(siemens)
                fs.writeFileSync("./siemens/siemens.json", brand)

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
            let count = 0
            $(postDiv).children("p").each((i, serviceCenter) => {
                if ($(serviceCenter).children("strong").length === 1 &&
                    !$(serviceCenter).children("strong").text().includes("Zip Code") &&
                    !$(serviceCenter).children("strong").text().includes("Siemens Customer Service Representative") &&
                    !$(serviceCenter).children("strong").text().includes("Siemens Support Products")) {
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[count]["serviceCenter"] = serviceCenterName
                    const address = $(serviceCenter).text().replace(serviceCenterName, "")
                    arr[count]["address"] = address.split("Phone:")[0].replaceAll("\t", "").replaceAll("\n", "").trim()
                    arr[count]["phone"] = address.split("Phone:")[1]?.split("Fax:")[0].replaceAll("\t", "").replaceAll("\n", "").trim()
                    arr[count]["fax"] = address?.split("Fax:")[1]?.trim()
                    count++
                }
            })

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/acer/acer-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const acer = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                acer[i] = {}
                acer[i]['state'] = ($(state).children("strong").text())
                acer[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    acer[i]['states'][j] = {}
                    acer[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    acer[i]['states'][j]['link'] = link

                    acer[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(acer)
                fs.writeFileSync("./acer/acer.json", brand)

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

            $(postDiv).find(" table > tbody > tr").each((i, serviceCenter) => {
                arr[i] = {}
                const serviceCenterName = $(serviceCenter).children("td").last().find("strong").text()
                arr[i]["serviceCenter"] = serviceCenterName
                const address = $(serviceCenter).children("td").last().text().replace(serviceCenterName, "")
                arr[i]["address"] = address.split("Phone:")[0].split("Tel:")[0].replaceAll("  ", "").replaceAll("\t", "").replaceAll("\n", "").trim()
                if (address.includes("Phone:"))
                    arr[i]["phone"] = address.split("Phone:")[1].split("x")[0].split("\n")[0].trim()
                else
                    arr[i]["phone"] = address.split("Tel:")[1].split("\n")[0].trim()

                arr[i]["fax"] = address.split("Fax:")[1]?.split("\n")[0].trim()

            })

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
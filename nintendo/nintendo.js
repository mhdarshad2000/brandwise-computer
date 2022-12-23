const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/nintendo/nintendo-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const nintendo = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                nintendo[i] = {}
                nintendo[i]['state'] = ($(state).children("strong").text())
                nintendo[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    nintendo[i]['states'][j] = {}
                    nintendo[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    nintendo[i]['states'][j]['link'] = link

                    nintendo[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(nintendo)
                fs.writeFileSync("./nintendo/nintendo.json", brand)

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
            const tableDiv = $(postDiv).find(" table > tbody > tr > td")

            if ($(tableDiv).text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    if ($(serviceCenter).children("h2").length) {
                        arr[i] = {}
                        arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text()
                        arr[i]["address"] = $(serviceCenter).children("div").first().text().replaceAll("    ", "").replaceAll("\t", "").replaceAll("\n", " ").trim()
                        arr[i]["phone"] = $(serviceCenter).children("div:nth-child(3)").text()
                    } else if ($(serviceCenter).children("div").children("h2").length) {
                        $(serviceCenter).children("div").each((j, service) => {
                            arr[j] = {}
                            arr[j]["serviceCenter"] = $(service).children("h2").text()
                            arr[j]["address"] = $(service).children("div").first().text().replaceAll("  ", "").replaceAll("\t", "").replaceAll("\n", " ").trim()
                            arr[j]["phone"] = $(service).children("div:nth-child(3)").text()

                        })
                    }
                })
            }
            $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                if ($(serviceCenter).children("h2").length) {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text()
                    if (/[a-z]/gi.test($(serviceCenter).children("h2").next().text())) {
                        arr[i]["address"] = $(serviceCenter).children("h2").next().text().replaceAll("\n", "").replaceAll("\t", "")
                        arr[i]["phone"] = $(serviceCenter).children("h2").next().next().text()

                    } else {
                        arr[i]["phone"] = $(serviceCenter).children("h2").next().text()
                    }
                } else {
                    $(postDiv).children("h2").each((i, serviceCenter) => {
                        if (!$(serviceCenter).text().includes("Nintendo Service Centers in")) {
                            arr[i - 1] = {}
                            arr[i - 1]["serviceCenter"] = $(serviceCenter).text()
                            if (/[a-z]/gi.test($(serviceCenter).next().text())) {
                                arr[i - 1]["address"] = $(serviceCenter).next().text().replaceAll("\n", "").replaceAll("\t", "").trim()
                                arr[i - 1]["phone"] = $(serviceCenter).next().next().text()
                            } else {
                                arr[i - 1]["phone"] = $(serviceCenter).next().text()
                            }
                        }

                    })
                }

            })

            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}
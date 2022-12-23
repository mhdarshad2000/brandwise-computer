const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/ipad/ipad-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const ipod = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                ipod[i] = {}
                ipod[i]['state'] = ($(state).children("strong").text())
                ipod[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    ipod[i]['states'][j] = {}
                    ipod[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    ipod[i]['states'][j]['link'] = link

                    ipod[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(ipod)
                fs.writeFileSync("./ipod/ipod.json", brand)

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
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).children("strong").length === 1 &&
                 ! $(serviceCenter).children("strong").text().includes("Zip Code")&&
                  !$(serviceCenter).children("strong").text().includes("Support for Apple products")){
                    arr[count]={}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[count]["serviceCenter"] =serviceCenterName
                    const address = $(serviceCenter).text().replace(serviceCenterName,"").split("\n")
                    let phone = []
                    address.map((element,index)=>{
                        if(!/[a-z]/gi.test(element) && element.length >10){
                            phone.push(element)
                            address[index] ==""
                        }
                    })
                    arr[count]["address"] = address.join().replace("View Map","").replaceAll(",","").replaceAll("\t"," ").replace(phone.join(),"").trim()
                    arr[count]["phone"] = phone.join().trim()
                    count ++
                }
            })

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
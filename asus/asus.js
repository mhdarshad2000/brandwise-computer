const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/asus/asus-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const asus = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                asus[i] = {}
                asus[i]['state'] = ($(state).children("strong").text())
                asus[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    asus[i]['states'][j] = {}
                    asus[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    asus[i]['states'][j]['link'] = link

                    asus[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(asus)
                fs.writeFileSync("./asus/asus.json", brand)

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
            if($(serviceCenter).children("strong.nomenegozio").length === 1 && !$(serviceCenter).children().text().includes("Support for Apple products")){
                arr[count] = {}
                const serviceCenterName = $(serviceCenter).children("strong").text()
                arr[count]["serviceCenter"] = serviceCenterName 
                const address = $(serviceCenter).text().replace(serviceCenterName,"").split("   ")
                let phone = []
                address.map((elem,index)=>{
                    if(!/[a-z]/gi.test(elem) && elem.length > 10){
                        phone.push(elem)
                    }
                })
                arr[count]["address"]=address.join().replace(phone.join(),"").replace("View Map","").replaceAll(","," ").replaceAll("\n","  ").replaceAll("\t","").trim()
                arr[count]["phone"]=phone.join().trim()
                count++
            }
           })

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/compaq-hp/compaq-hp-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const compaqHp = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                compaqHp[i] = {}
                compaqHp[i]['state'] = ($(state).children("strong").text())
                compaqHp[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    compaqHp[i]['states'][j] = {}
                    compaqHp[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    compaqHp[i]['states'][j]['link'] = link

                    compaqHp[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(compaqHp)
                fs.writeFileSync("./compaqHp/compaqHp.json", brand)

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
            if(tableDiv.text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    if(i!==0){
                        arr[i-1]= {}
                        let address = []
                        const string =$(serviceCenter).children("td").first().text()?.split("\n")
                        arr[i-1]["serviceCenter"]=string[0]
                        address.push(string[1],string[2])
                        address.push($(serviceCenter).children("td").last().text())
                        arr[i-1]["address"]=address.join().replaceAll("   ","").replaceAll("\t","").trim()
                        arr[i-1]["phone"]=$(serviceCenter).children("td:nth-child(2)").text().replaceAll("    ","").replace("Phone No  : ","").split("X")[0].replace("x230","").trim()
                    }
                })
            }else{
                let count = 0
                $(postDiv).children("p").each((i,serviceCenter)=>{
                    if($(serviceCenter).children("strong").length ===1 &&
                     !$(serviceCenter).children("strong").text().startsWith("Support for HP and Compaq products") &&
                      !$(serviceCenter).children("strong").text().startsWith("Zip")){
                        arr[count] = {}
                        const serviceCenterName = $(serviceCenter).children("strong").text()
                        arr[count]["serviceCenter"]= serviceCenterName
                        arr[count]["address"]=$(serviceCenter).text().replace(serviceCenterName,"").split("Phone:")[0].replaceAll("\n","").replaceAll("\t","").trim()
                        arr[count]["phone"]=$(serviceCenter).text().split("Phone:")[1]?.split("Fax:")[0]?.split("Ext")[0]?.split("WebSite:")[0].replace("\n","").replace("\t","").trim()
                        arr[count]["fax"]=$(serviceCenter).text()?.split("Fax:")[1]?.split("\n")[0].trim()
                        count ++
                    }
                })
            }

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}
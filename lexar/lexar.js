const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/lexar/lexar-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const lexar = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                lexar[i] = {}
                lexar[i]['state'] = ($(state).children("strong").text())
                lexar[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    lexar[i]['states'][j] = {}
                    lexar[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    lexar[i]['states'][j]['link'] = link

                    lexar[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(lexar)
                fs.writeFileSync("./lexar/lexar.json", brand)

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
            
            const tableDiv = $(postDiv).find(" table > tbody > tr")

            if(tableDiv.text()){
                $(tableDiv).each((i,serviceCenter)=>{
                        arr[i]={}
                        arr[i]["serviceCenter"] = $(serviceCenter).children("td").first().children("h2").text().replaceAll("\n","").trim()
                        const address = $(serviceCenter).children("td").first().children("div").first().text()
                        if(/[a-z]/gi.test(address)){
                            arr[i]["address"] = address.replaceAll("\t","").replaceAll("    ","").replaceAll("\n"," ")
                            arr[i]["phone"] = $(serviceCenter).children("td").first().children("div:nth-child(3)").text()
                        }else{
                            arr[i]["phone"] = address
                        }
                })
            }else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().includes("Lexar Service Centers in")){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text().trim()
                        if(/[a-z]/gi.test($(serviceCenter).next().text())){
                            arr[i-1]["address"] = $(serviceCenter).next().text().replaceAll("\n","").replaceAll("\t","").trim()
                            arr[i-1]["phone"] = $(serviceCenter).next().next().text().trim()
                        }else{
                            arr[i-1]["phone"] = $(serviceCenter).next().text().trim()
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
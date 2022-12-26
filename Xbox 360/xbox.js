const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/xbox-repair-360.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const xbox = []
            rp(brandUrl).then((htmlString)=>{
                const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                xbox[i] = {}
                xbox[i]['state'] = ($(state).children("strong").text())
                xbox[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    xbox[i]['states'][j] = {}
                    xbox[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    xbox[i]['states'][j]['link'] = link

                    xbox[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(xbox)
                fs.writeFileSync("./xbox.json", brand)

            }, 8000)
            })
            
        } catch (error) {
            console.log(error.message,404)
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
            const tableDiv =$(postDiv).find(" table > tbody > tr")
            if(tableDiv.text()){
                $(tableDiv).each((i,serviceCenter)=>{
                    if(i!==0){
                        arr[i-1] = {}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).children("td").first().children("h2").text()
                        const address = $(serviceCenter).children("td:nth-child(2)").text()
                        arr[i-1]["address"] = address.split("(")[0].replaceAll("\t","").replaceAll("    ","").replaceAll("\n"," ").trim()
                        const phone =  address.split("(")[1]?.replace(/[a-z]/gi,'')?.replace(/[@.-]/g,"").trim()
                        arr[i-1]["phone"] = phone?"("+phone:""
                    }
                })
            }else{
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().includes("Xbox 360 Service Centers in")){
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
            // console.log(error.message)
        }
    })
}
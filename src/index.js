const path = require('path')
const fs = require('fs')

const axios = require('axios')
const cheerio = require('cheerio')

const stringify = require('csv-stringify')

let productName

const prompt = require('prompt-sync')()

const name = prompt('Insira o nome do produto: ')

productName = name

const url =
    `https://www.amazon.com.br/s?k=${productName}`

async function siteRequest() {
    try {
        const { data } = await axios.get(url)
        return cheerio.load(data)
    } catch (err) {
        console.log(err)
    }
}

async function executeScraping() {
    try {
        const $ = await siteRequest()
        const priceList = []
        const test = $('[data-component-type="s-search-result"]')
            .find('.sg-col-inner')
            .find('.a-section')
            .find('.a-spacing-top-small')

        if (test.length == 0)
            return console.log('produto não encontrado, procure por outro!')

        test.text().trim()

        for (let i = 0; i < test.length; i++) {
            let valid, formatedPrice

            if ($(test[i + 1]).text().trim().includes('R$')) {
                valid = true
                prices = ($(test[i + 1]).text().trim()).split('R$')[1].trim()
                formatedPrice = 'R$' + prices
            }

            priceList.push({
                product: $(test[i]).text().trim().toString().replace(/,/g, ""),
                price: valid ? formatedPrice : 'sem estoque'
            })

            if (valid) i++
        }

        csvWriter(priceList)
    } catch (err) {
        throw err
    }
}

function csvWriter(content) {
    stringify(content, (err, output) => {
        if (err) throw err

        fs.writeFile(path.resolve(__dirname, 'amazon_products_javascript.csv'), output, (err) => {
            if (err) throw err
            console.log('csv gerado com sucesso!')
        })
    })
}

executeScraping()
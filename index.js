#!/usr/bin/env node

// Modified from https://gist.github.com/glenhallworthreadify/d447e9d6b1fc9cb807b46f952236d4bc

const puppeteer = require('puppeteer');

class Webpage {
    static async generatePDF(url) {
        const browser = await puppeteer.launch({ headless: true }); // Puppeteer can only generate pdf in headless mode.
        const page = await browser.newPage();
        await page.goto(url, { 'waitUntil' : 'networkidle0' });

        const title = await page.evaluate(async () => {
            return document.querySelector('.rich_media_title').textContent.trim();
        })

        const filename = `${title.replace(/[/\\?%*:|"<>]/g, '')}.pdf`;

        const pdfConfig = {
            path: filename, // Saves pdf to disk.
            format: 'A4',
            printBackground: true,
            margin: { // Word's default A4 margins
                top: '2.54cm',
                bottom: '2.54cm',
                left: '2.54cm',
                right: '2.54cm'
            }
        };


        // 由于微信公众号页面中的图片使用了lazyload，所以这边需要将所有图片的src设置为其data-src值，
        // 并且等所有图片都加载完成后在继续。
        // 参考: https://stackoverflow.com/a/49233383/157811
        await page.evaluate(async () => {
            const selectors = Array.from(document.querySelectorAll("img"));

            await Promise.all(selectors.map(img => {
              return new Promise((resolve, reject) => {
                let src = img.dataset['src'];
                if (src) {
                    img.src = src;
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', reject);
                }
                else {
                    resolve();
                }
              });
            }));
          })

        await page.emulateMedia('screen');
        const pdf = await page.pdf(pdfConfig); // Return the pdf buffer. Useful for saving the file not to disk.

        await browser.close();

        return pdf;
    }
}

const url = process.argv[2];
(async() => {
    console.log('downloading... ', url);
    const buffer = await Webpage.generatePDF(url);
})();


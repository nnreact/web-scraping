import puppeteer from "puppeteer";
import fs from "fs";
import https from "https";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const pageUrl = `https://www.makemytrip.com/hotels/hotel-listing/?checkin=05252025&city=CTBAL9d5bd6c3&checkout=05272025&roomStayQualifier=4e0e&locusId=CTBAL9d5bd6c3&country=IDN&locusType=city&searchText=Bali&regionNearByExp=3&rsc=1e4eundefinede`;

// open an browser
const browser = await puppeteer.launch({
    headless: false,
});
const page = await browser.newPage();

await page.goto(pageUrl, { waitUntil: 'networkidle2' });

await page.waitForSelector("#seoH1DontRemoveContainer h1");

const resultsCount = await page.$eval('#seoH1DontRemoveContainer h1', el => el.textContent);

const hotelList = await page.$$eval('.hotelTileDt a', links => links.map(link => link.href));

let hotelDetails = [];

for (const hotelLink of hotelList) {
    await page.goto(hotelLink, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1.hotelName');
    const hotelName = await page.$eval('h1.hotelName', el => el.textContent);
    const hotelRating = await page.$eval('.ovrlRating__rating', el => el.textContent);
    // Extract check-in and check-out times
    const { checkIn, checkOut } = await page.evaluate(() => {
        const infoDiv = document.querySelector('#propertyRulesSection .makeFlex.hrtlCenter.font16.lineHight19.latoBold');
        if (!infoDiv) return { checkIn: null, checkOut: null };

        const spans = infoDiv.querySelectorAll('span');
        const checkInText = spans[0].textContent.trim() || '';
        const checkOutText = spans[1].textContent.trim() || '';

        const checkIn = checkInText.replace('Check-in:', '').trim();
        const checkOut = checkOutText.replace('Check-out:', '').trim();

        return { checkIn, checkOut };
    });
    const imageUrl = await page.$eval('.imgHolder__img', el => el.src);
    hotelDetails.push({ hotelName, hotelRating, checkIn, checkOut, imageUrl });
}

console.log(hotelDetails);

hotelDetails.forEach(hotel => {
    const dir = path.join(__dirname, 'images', hotel.hotelName);
    fs.mkdirSync(dir, { recursive: true });

    // Get file extension from URL
    const fileExtension = hotel.imageUrl.split('.').pop().split('?')[0];
    const filePath = path.join(dir, `image.${fileExtension}`);

    const file = fs.createWriteStream(filePath);
    https.get(hotel.imageUrl, response => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded: ${filePath}`);
        });
    }).on('error', err => {
        fs.unlink(filePath, () => {});
        console.error(`Error downloading ${hotel.imageUrl}: ${err.message}`);
    });
});

await browser.close();
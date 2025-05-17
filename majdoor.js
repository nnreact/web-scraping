import puppeteer from "puppeteer";
import fs from "fs";
import xlsx from "xlsx";

// open an browser
const browser = await puppeteer.launch({
    headless: false,
});
const page = await browser.newPage();

const keyword = "frontend developer";
const pageUrl = `https://www.seek.com.au/${keyword.replaceAll(" ", "-")}-jobs`;

await page.goto(pageUrl, { waitUntil: 'networkidle2' });

//wait for network to be idle
await page.waitForSelector('#SearchSummary span');

const resultsCount = await page.$eval('#SearchSummary span', el => el.textContent);

console.log("resultsCount", resultsCount);

if (parseInt(resultsCount) > 0) {
    const jobList = await page.$$eval('[data-automation="jobTitle"]', elements => elements.map(el => el.textContent));
    const companyList = await page.$$eval('[data-automation="jobCompany"]', elements => elements.map(el => el.textContent));
    const salaryList = await page.$$eval('[data-automation="jobSalary"] span', elements => elements.map(el => el.textContent));
    const jobSubClassificationList = await page.$$eval('[data-automation="jobSubClassification"]', elements => elements.map(el => el.textContent));
    const jobClassificationList = await page.$$eval('[data-automation="jobClassification"]', elements => elements.map(el => el.textContent));

    const jobs = jobList.map((job, index) => ({
        job,
        company: companyList[index],
        salary: salaryList[index],
        jobClassification: jobClassificationList[index],
        jobSubClassification: jobSubClassificationList[index]
    }));
    console.log("jobs", jobs);

    // create an workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(jobs);

    xlsx.utils.book_append_sheet(workbook, worksheet, "Jobs");

    // write the workbook to a file
    xlsx.writeFile(workbook, "jobs.xlsx");

}


// const jobCount = await page.evaluate(() => {
//     let jobCount = document.querySelector("#SearchSummary span");

//     jobCount = parseInt(jobCount.textContent);

//     console.log("jobCount", jobCount);

//     if (jobCount > 0) {
//         const jobList = document.querySelectorAll("[data-automation='jobTitle']");
//         console.log("jobList", jobList);
//     }

// }, page);




// await page.screenshot({ path: "./selfies/screenshot.png" });

browser.close();
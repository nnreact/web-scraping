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

if (parseInt(resultsCount) > 0) {

    let hasMoreMain = true;
    while (hasMoreMain) {

        const { hasMore, jobs } = await getJobs();

        console.log("hasMore", hasMore);
        console.log("jobs", jobs);
        hasMoreMain = hasMore;

        if (!hasMoreMain) {
            break;
        }

        // write an code to save the jobs to a excel file in append mode
        let workbook;
        if (fs.existsSync("jobs.xlsx")) {
            workbook = xlsx.readFile("jobs.xlsx");
            const existingSheet = workbook.Sheets["Jobs"];
            const existingData = xlsx.utils.sheet_to_json(existingSheet);
            const newData = [...existingData, ...jobs];
            const updatedSheet = xlsx.utils.json_to_sheet(newData);
            workbook.Sheets["Jobs"] = updatedSheet;
        } else {
            workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(jobs);
            xlsx.utils.book_append_sheet(workbook, worksheet, "Jobs");
        }
        xlsx.writeFile(workbook, "jobs.xlsx");


        await page.click("[aria-label='Next']")

        await page.waitForNetworkIdle();




    }

}

browser.close();


async function getJobs() {
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

    if (jobList.length == 0 || companyList.length == 0 || jobClassificationList.length == 0 || jobSubClassificationList.length == 0) {
        return {
            hasMore: false,
            jobs
        }
    }

    return {
        hasMore: true,
        jobs
    }


}
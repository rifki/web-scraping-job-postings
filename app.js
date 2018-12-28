const puppeteer = require('puppeteer');
const fs = require('fs');
const url = `https://www.jobstreet.co.id/id/job-search/job-vacancy.php`;

/**
 * max limit page
 * @param {*} limit 
 */
const getData = (limit) => {
    return new Promise( async (resolve, reject) => {
        try {
            if (!limit) limit = 1;

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url);

            let current = 1;
            let data = [];
            while (current <= limit) {
                let jobListing = await page.evaluate(() => {
                    let results = [];
                    let items = document.querySelectorAll(
                        '#job_listing_panel > div:not([style*="display:none;"]) a.position-title-link'
                    );
                    items.forEach((item) => {
                        results.push({
                            url: item.getAttribute('href'),
                            title: item.innerText.trim(),
                            job_description: document.querySelector('ul.list-unstyled.hidden-xs').innerText.trim(),
                            job_posted_at: document.querySelector('span.job-date-text.text-muted').innerText.trim(),
                            company_name: document.querySelector('.company-name').innerText.trim(),
                            company_location: document.querySelector('.job-location').innerText.trim(),
                            company_logo: document.querySelector('.img-company-logo').getAttribute('data-original').trim()
                        });
                    });
                    return results;
                });

                data = data.concat(jobListing);
                if (current < limit) {
                    let nextPage = current++;                   
                    await Promise.all([
                        await page.click('#page_'+nextPage),
                        await page.waitForSelector('#pagination_panel')
                    ])
                }
                current++;
            }
            
            browser.close();
            return resolve(data);
        } catch(e) {
            return reject(e);
        }
    });
}

/**
 * Write json file
 * @param {*} filename 
 * @param {*} array 
 */
const writeFile = (filename, array) => new Promise((resolve, reject) => {
    const json = JSON.stringify(array, null, 4);
    fs.writeFileSync(filename, json, (err) => {
        try {
            return resolve(array)
        } catch (e) {
            return reject(err);
        }
    });
});

// run the job and save into json file
getData(10).then(results => {
    writeFile('output.json', results);
    console.log('done!');
}).catch(err => {
    throw err;
});

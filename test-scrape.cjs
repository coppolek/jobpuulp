const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('cj.html', 'utf8');
const $ = cheerio.load(html);

const jobs = [];
$('article.job').each((i, el) => {
  const titleEl = $(el).find('header h3 a');
  const title = titleEl.text().trim();
  let url = titleEl.attr('href') || '';
  if (url && url.startsWith('/')) url = 'https://www.careerjet.it' + url;
  
  const company = $(el).find('p.company').text().trim();
  const locations = $(el).find('ul.location li').text().trim();
  const description = $(el).find('div.desc').text().trim();
  const salary = $(el).find('ul.salary li').text().trim();
  
  if (title) {
    jobs.push({
      url, title, company, locations, description, salary
    });
  }
});

console.log(JSON.stringify(jobs.slice(0, 2), null, 2));

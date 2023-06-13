const axios = require('axios');
const fs = require('fs');
const dir = __dirname;
let allInstitutions = require('./institutions.json');

async function isValidHomepage({ homepage }) {
  try {
    const response = await axios.get(homepage, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,es;q=0.8,fr;q=0.7,ar;q=0.6,zh;q=0.5,es-ES;q=0.4,da;q=0.3,ru;q=0.2,de-CH;q=0.1,de;q=0.1,ko;q=0.1",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
      }
    });
    const data = response.data;
    if (response.status = 200) {
      return true;
    }
  } catch (error) {
    if (typeof error?.response?.status !== 'undefined') {
      return error.response.status;
    }
    return error.code || false;
  }
}

async function test(batchSize) {
  let institutions = allInstitutions;
  // filter on institutions that have an address field
  institutions = institutions.filter((institution) => institution.homepage);
  institutions = institutions.filter((institution) => typeof institution._isValidHomePage === 'undefined');

  console.log('left: ' + institutions.length);

  const promises = [];
  try {
    for (var i = 0; i < batchSize; i++) {
      const institution = institutions[i];
      if (!institution) break;
      const homepage = institution.homepage;
      const key = institution.key;
      console.log(`${i} : ${key} : ${homepage}`);
      promises.push((async () => {
        const isValid = await isValidHomepage({ homepage, key }, i);
        console.log('result came back: ' + institution.key + ' : ' + isValid);
        institution._isValidHomePage = isValid;
      })());
    }
    const results = await Promise.all(promises);
  } catch (err) {
    fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(allInstitutions, null, 2));
    console.log('file saved - errors caught');
  }

  fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(allInstitutions, null, 2));
  console.log('file saved');
}

async function batchTest() {
  const batchSize = 100;
  const total = allInstitutions.length;
  const batches = Math.ceil(total / batchSize);
  for (var i = 0; i < batches; i++) {
    await test(batchSize);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000 * 10); // wait 10 seconds
    });
  }
}


// batchTest();

// isValidHomepage({homepage: 'http://www.justsdf.edu.cn/', key: '234'}, 1); // code = ENOTFOUND
// isValidHomepage({ homepage: 'https://www.utn.edu.ec/', key: '234' }, 1); // status = 404 && code = ERR_BAD_REQUEST

module.exports = {
  isValidHomepage
}
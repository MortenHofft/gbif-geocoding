const axios = require('axios');
const fs = require('fs');
const dir = __dirname;
const isValidHomepage = require('./checkUrls').isValidHomepage;
let allInstitutions = require('./institutions.json');

async function findValidUpperPath(url) {
  if (typeof url !== 'string') return false;
  if ((url?.length || -1) <= 'https://a'.length) return false;

  const lastIndex = url.lastIndexOf('/');
  const upperUrl = url.substring(0, lastIndex);
  // check that the upper url is not a 404
  const result = await isValidHomepage({ homepage: upperUrl });
  if (result === true) {
    return upperUrl;
  } else {
    return findValidUpperPath(upperUrl);
  }
}

async function test(batchSize) {
  let institutions = allInstitutions;
  institutions = institutions.filter((institution) => institution._isValidHomePage === 404);
  institutions = institutions.filter((institution) => typeof institution._404CorrectedPath === 'undefined');

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
        const validUrl = await findValidUpperPath(homepage);
        console.log('result came back: ' + institution.key + ' : ' + validUrl);
        institution._404CorrectedPath = validUrl;
      })());
    }
    const results = await Promise.all(promises);
  } catch (err) {
    fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(allInstitutions, null, 2));
    console.log('file saved - errors caught');
    console.log(err);
  }

  fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(allInstitutions, null, 2));
  console.log('file saved');
}

async function batchTest() {
  const batchSize = 10;
  const total = allInstitutions.length;
  const batches = Math.ceil(total / batchSize);
  for (var i = 0; i < batches; i++) {
    await test(batchSize);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000 * 1); // wait 10 seconds
    });
  }
}


batchTest();

// findValidUpperPath('https://new.smm.org/biology').then(console.log)
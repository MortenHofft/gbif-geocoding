const fs = require('fs');
const dir = __dirname;
const getCoordinates = require('./getCoordinates');
let allInstitutions = require('./institutions.json');

const geocode = async (batchSize = 200, countryCode) => {
  let instititions = allInstitutions;
  // filter on institutions that have an address field
  let institutions = instititions.filter((institution) => {
    const street = institution?.address?.address || institution?.mailingAddress?.address;
    return street && street.length > 0;
  });

  // only consider institutions without latitude and longitude
  institutions = institutions.filter((institution) => {
    return !institution.latitude && !institution.longitude;
  });

  // only consider records that are not managed with a mastersource elsewhere
  institutions = institutions.filter((institution) => {
    return !institution?.masterSourceMetadata?.source;
  });

  // only consider publishers that do not already have a google_geocode field
  institutions = institutions.filter((institution) => {
    return !institution.google_geocoded;
  });

  // only consider institutions from country XX
  if (countryCode) {
    institutions = institutions.filter((institution) => {
      return institution.address?.country === countryCode || institution.mailingAddress?.country === countryCode;
    });
  }

  console.log('left ', institutions.length);

  for (var i = 0; i < batchSize; i++) {
    const institution = institutions[i];
    if (!institution) break;
    const address = institution?.address?.address ? institution.address : institution.mailingAddress;

    try {
      const geocodedResult = await getCoordinates({ ...address, title: institution.name, key: institution.key }, i);
      institution.google_geocoded = geocodedResult;

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    } catch (err) {
      console.log(err);
      fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(allInstitutions, null, 2));
      console.log('file saved');
      return;
    }
  }

  fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(allInstitutions, null, 2));
  console.log('file saved');
}

async function batchGeocode() {
  const batchSize = 100;
  const total = allPublishers.length;
  const batches = Math.ceil(total / batchSize);
  for (var i = 0; i < batches; i++) {
    await geocode(batchSize);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000 * 10); // wait 10 seconds
    });
  }
}

// batchGeocode();
geocode(100, 'IT');
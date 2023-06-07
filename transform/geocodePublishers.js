// example geocode usage from osm https://nominatim.openstreetmap.org/search?street=Radnicka%2020a&city=Novi%20Sad&country=Serbia&format=json

// iterate over all publishers and add coordinates to the publisher
// wait 10 second between each request to avoid rate limiting

const axios = require('axios');
const fs = require('fs');
const dir = __dirname;
const getCoordinates = require('./getCoordinates');
let allPublishers = require('./publishers.json');

const geocode = async (batchSize = 200) => {
  let publishers = allPublishers;
  // filter on publishers that have an address field
  publishers = publishers.filter((publisher) => {
    const street = publisher?.address ? publisher.address.join(', ') : undefined;
    return street && street.length > 0;
  });

  // only consider publishers without latitude and longitude
  publishers = publishers.filter((publisher) => {
    return !publisher.latitude && !publisher.longitude;
  });

  // only consider publishers that do not already have a google_geocode field
  publishers = publishers.filter((publisher) => {
    return !publisher.google_geocoded;
  });

  console.log('left ', publishers.length);

  for (var i = 0; i < batchSize; i++) {
    const publisher = publishers[i];
    if (!publisher) break;
    
    console.log(`${i} : ${publisher.key} : ${url}`);
    try {
      const geocodedResult = await getCoordinates(publisher);
      publisher.google_geocoded = geocodedResult;

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    } catch (err) {
      console.log(err);
      fs.writeFileSync(`${dir}/publishers.json`, JSON.stringify(allPublishers, null, 2));
      console.log('file saved');
      return;
    }
  }

  fs.writeFileSync(`${dir}/publishers.json`, JSON.stringify(allPublishers, null, 2));
  console.log('file saved');
}

async function batchGeocode() {
  const batchSize = 100;
  const total = allPublishers.length;
  const batches = Math.ceil(total / batchSize);
  for (var i = 0; i < batches; i++) {
    await geocode(batchSize);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000*10); // wait 10 seconds
    });
  }
}

batchGeocode();
// fetch all institutions and collections and write them to a file
// for use in the extractCoordinates script
const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const dir = __dirname;

const getInstitutions = async (rest) => {
  return getData({ url: 'https://api.gbif.org/v1/grscicoll/institution', ...rest });
}

const getCollections = async (rest) => {
  return getData({ url: 'https://api.gbif.org/v1/grscicoll/collection', ...rest });
}

const getPublishers = async (rest) => {
  return getData({ url: 'https://api.gbif.org/v1/organization', ...rest });
}

const getData = async ({ url, limit: size, offset: from } = {}) => {
  const limit = Number.parseInt(size) || 300;
  let offset = Number.parseInt(from) || 0;
  let items = [];
  let total = 0;

  do {
    console.log('fetching ', offset);
    const response = await axios.get(url, {
      params: {
        limit,
        offset,
      }
    });

    items = items.concat(response.data.results);
    total = response.data.count;
    offset += limit;
  } while (offset < total && !size);

  return items;
}

// get institutions and save them to disk
const saveInstitutions = async () => {
  const institutions = await getInstitutions();
  fs.writeFileSync(`${dir}/institutions.json`, JSON.stringify(institutions, null, 2));
  console.log('The institutions have been saved to disk. To used them for geocoding copy to the transform folder, run transform/geocodeInstitutions.js');
}

const saveCollections = async () => {
  const collections = await getCollections();
  fs.writeFileSync(`${dir}/collections.json`, JSON.stringify(collections, null, 2));
}

const savePublishers = async () => {
  const publishers = await getPublishers();
  fs.writeFileSync(`${dir}/publishers.json`, JSON.stringify(publishers, null, 2));
  console.log('The publishers have been saved to disk. To used them for geocoding copy to the transform folder, run transform/geocodePublishers.js');
}

// savePublishers();
// saveCollections();
saveInstitutions();
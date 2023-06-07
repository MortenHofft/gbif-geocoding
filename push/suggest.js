const axios = require('axios');
const fs = require('fs');
const dir = __dirname;
let allInstitutions = require('../transform/institutions.json');
let institutionsWithSuggestions = require('./institutionsWithSuggestions.json');

const geocode = async (batchSize = 200) => {
  let institutions = allInstitutions;

  // only consider institutions that have a google_geocoded field with a latitude
  institutions = institutions.filter((institution) => {
    return institution?.google_geocoded?.latitude;
  });

  // only consider institutions that do not already have been suggested
  institutions = institutions.filter((institution) => {
    return !institutionsWithSuggestions.includes(institution.key);
  });

  for (var i = 0; i < batchSize; i++) {
    const institution = institutions[i];
    if (!institution) break;

    try {
      const cleanedInstitution = { ...institution };
      cleanedInstitution.latitude = institution.google_geocoded.latitude;
      cleanedInstitution.longitude = institution.google_geocoded.longitude;
      delete cleanedInstitution.google_geocoded;
      let payload = {
        type: 'UPDATE',
        suggestedEntity: cleanedInstitution,
        proposerEmail: 'scientific-collections@gbif.org',
        comments: ['The suggestion is based on Google Geocode data. So please check the data before accepting the suggestion. See also https://github.com/gbif/registry-console/issues/528'],
        entityKey: institution.key
      }
      const response = await axios.post('http://api.gbif.org/v1/grscicoll/institution/changeSuggestion', payload);

      institutionsWithSuggestions.push(institution.key);
      fs.writeFileSync(`${dir}/institutionsWithSuggestions.json`, JSON.stringify(institutionsWithSuggestions, null, 2));
    } catch (err) {
      console.log(err);
      console.log('institution: ' + institution?.key);
      fs.writeFileSync(`${dir}/institutionsWithSuggestions.json`, JSON.stringify(institutionsWithSuggestions, null, 2));
    }
  }
}

geocode(19);
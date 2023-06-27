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

  // only consider institutions from country XX
  const countryCodeFilter = 'AU';
  institutions = institutions.filter((institution) => {
    return institution.address?.country === countryCodeFilter || institution.mailingAddress?.country === countryCodeFilter;
  });
  
  console.log('how many left for this filter: ', institutions.length);

  for (var i = 0; i < batchSize; i++) {
    const institution = institutions[i];
    if (!institution) break;

    try {
      const freshInstitution = await axios.get('http://api.gbif.org/v1/grscicoll/institution/' + institution.key);
      const cleanedInstitution = { ...freshInstitution.data };
      
      // check that the homepage hasn't changed since
      if (cleanedInstitution.latitude !== institution.latitude) {
        console.log('latitude has changed since');
        continue;
      }
      if (JSON.stringify(cleanedInstitution.address) !== JSON.stringify(institution.address)) {
        console.log('address has changed since');
        continue;
      }
      if (JSON.stringify(cleanedInstitution.mailingAddress) !== JSON.stringify(institution.mailingAddress)) {
        console.log('mailing address has changed since');
        continue;
      }

      cleanedInstitution.latitude = institution.google_geocoded.latitude;
      cleanedInstitution.longitude = institution.google_geocoded.longitude;

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

geocode(10);
const axios = require('axios');
const fs = require('fs');
const dir = __dirname;
let allInstitutions = require('./institutions.json');
let institutionsWithSuggestions = require('./institutionsWithSuggestions.json');

const suggest = async (batchSize = 200) => {
  let institutions = allInstitutions;

  // only consider records that are not managed with a mastersource elsewhere
  institutions = institutions.filter((institution) => {
    return !institution?.masterSourceMetadata?.source;
  });

  institutions = institutions.filter((institution) => typeof institution._isValidHomePage !== 'undefined');
  institutions = institutions.filter((institution) => [false, 404, 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 500, 504, 502, 503, 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].indexOf(institution._isValidHomePage) !== -1);

  // temp filter on us institutions alone
  // institutions = institutions.filter((institution) => institution?.address?.country === 'US');
  // and only 404s
  // institutions = institutions.filter((institution) => [404].indexOf(institution._isValidHomePage) !== -1);


  // only consider institutions that do not already have been suggested
  institutions = institutions.filter((institution) => {
    return !institutionsWithSuggestions.includes(institution.key);
  });

  for (var i = 0; i < batchSize; i++) {
    const institution = institutions[i];
    if (!institution) break;

    try {
      const freshInstitution = await axios.get('http://api.gbif.org/v1/grscicoll/institution/' + institution.key);
      const cleanedInstitution = { ...freshInstitution.data };
      
      // check that the homepage hasn't changed since
      if (cleanedInstitution.homepage !== institution.homepage) {
        console.log('homepage has changed since');
        continue;
      }
      
      if (institution._404CorrectedPath) {
        cleanedInstitution.homepage = institution._404CorrectedPath
      } else {
        delete cleanedInstitution.homepage;
      }

      let comments = ['The suggestion is based on automated processing. So please check the data before accepting the suggestion. See also https://github.com/gbif/registry-console/issues/532'];
      comments.push(`Suggested google search: https://www.google.com/search?q=${encodeURIComponent(institution.name)}`);

      if (!cleanedInstitution.homepage) {
        comments.push('The homepage was ' + institution.homepage + ' but we failed to fetch it. It might just have been temporarily unavaiable of blocking robots.');
      } else {
        comments.push('The homepage ' + institution.homepage + ' was a 404, but ' + cleanedInstitution.homepage + ' was valid.');
      }
      let payload = {
        type: 'UPDATE',
        suggestedEntity: cleanedInstitution,
        proposerEmail: 'scientific-collections@gbif.org',
        comments: comments,
        entityKey: institution.key
      }
      
      const response = await axios.post('http://api.gbif.org/v1/grscicoll/institution/changeSuggestion', payload);

      institutionsWithSuggestions.push(institution.key);
      fs.writeFileSync(`${dir}/institutionsWithSuggestions.json`, JSON.stringify(institutionsWithSuggestions, null, 2));
    } catch (err) {
      console.log(err);
      console.log('institution: ' + institution?.key);
      // fs.writeFileSync(`${dir}/institutionsWithSuggestions.json`, JSON.stringify(institutionsWithSuggestions, null, 2));
    }
  }
}

suggest(1);

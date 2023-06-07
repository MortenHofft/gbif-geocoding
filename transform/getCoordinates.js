const axios = require('axios');
const countryNames = require('./countryNames.json');
const env = require('../.env.local.json');

const acceptedGooglePlaceTypes = [
  "establishment",
  "point_of_interest",
  "subpremise",
  "street_address",
  "university",
  "premise",
  "route",
  "intersection",
  "school",
  "finance",
  "general_contractor",
  "parking",
  "health",
  "hospital",
  "secondary_school",
  "bank",
  "park",
  "tourist_attraction",
  "zoo",
  "museum"
];

module.exports = async function getCoordinates({ country: countryCode, province, city, postalCode, address, title, key }, i) {
  const country = countryNames[countryCode];
  const street = Array.isArray(address) ? address.join(', ') : address;

  const parts = [];
  if (title) parts.push(title);
  if (street) parts.push(street);
  if (city) parts.push(city);
  if (postalCode) parts.push(postalCode);
  if (province) parts.push(province);
  if (country) parts.push(country);

  const params = {
    text: parts.join(', ')
  };

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.text)}&key=${env.googleApiKey}`;
  console.log(`${i} : ${key} : ${url}`);

  const response = await axios.get(url, { headers: { 'User-Agent': 'GBIF.org' } });
  const data = response.data;

  if (data?.results?.length > 0) {
    const results = data.results;
    let result = results[0];
    result = results.find((result) => {
      return result.types.some((type) => {
        return acceptedGooglePlaceTypes.includes(type);
      });
    });
    if (!result) {
      return { error: 'No results' };
    }
    const lat = result?.geometry?.location?.lat;
    const lng = result?.geometry?.location?.lng;
    return { 
      latitude: lat, 
      longitude: lng,
      link: `http://www.google.com/maps/place/${lat},${lng}`,
      place_id: result.place_id,
      result: result
    }
  } else {
    return { error: 'No results' };
  }
}
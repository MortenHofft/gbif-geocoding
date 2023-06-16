const institutions = require('./institutions.json');
const nameMap = institutions.reduce((acc, institution) => {
  acc[institution.name] = institution;
  return acc;
}, {});

// let names = institutions
//   .filter(x => x.created.startsWith('2015') || x.created.startsWith('2016') || x.created.startsWith('2017') || x.created.startsWith('2018'))
//   .filter((x) => {
//     return !x?.masterSourceMetadata?.source;
//   })
//   .map(i => i.name);

// // remove entries that are not unique
// const uniqueNames = [...new Set(names)];

// // remove entries that contain certain stop words (e.g. 'museum', 'university')
// const stopWords = ['museum', 'zoo', 'musee', 'national park', 'biology', 'universidad', 'museo', 'coleccion cientifica', 'naturelle', 'collection', 'university', 'college', 'department', 'laboratory', 'laboratories', 'center', 'centre', 'botanical', 'herbarium', 'herbaria', 'arboretum', 'garden', 'library', 'observatory', 'station', 'zoo', 'aquarium', 'park', 'reserve', 'society'];
// const filteredNames = uniqueNames.filter(name => {
//   const lowerCaseName = name.toLowerCase();
//   return !stopWords.some(stopWord => lowerCaseName.includes(stopWord));
// });


// // print first 100 names
// console.log(filteredNames.length);
// console.log(`Hi, I'm reviewing a list of organisations like: museums, universities, scientific collections, governmental departments, institutions, nature parks. But there might be outliers in there, with weird entries that do not belong. Could you please help me to identify them, I'd rather that you included too many for review than too few. Thanks!?\n\n`);
// console.log(filteredNames.slice(0, 300).join('\n'));
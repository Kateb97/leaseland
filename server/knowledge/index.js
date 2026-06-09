// Knowledge base index - country → state → rules
// This modular architecture allows adding new countries by adding a new directory

const states = {
  nsw: require('./australia/nsw'),
  vic: require('./australia/vic'),
  qld: require('./australia/qld'),
  wa: require('./australia/wa'),
  sa: require('./australia/sa'),
  act: require('./australia/act'),
};

const countries = {
  australia: {
    name: 'Australia',
    states,
    defaultState: 'nsw',
  },
};

const countryAliases = {
  au: 'australia',
  aus: 'australia',
};

function resolveCountry(country) {
  const key = country?.toLowerCase();
  return countries[key] || countries[countryAliases[key]];
}

function getStateRules(country, state) {
  const countryData = resolveCountry(country);
  if (!countryData) return null;
  
  const stateKey = state?.toLowerCase();
  const stateData = countryData.states[stateKey];
  
  if (!stateData) return null;
  return stateData;
}

function getAllStateKeys(country) {
  const countryData = resolveCountry(country);
  if (!countryData) return [];
  return Object.keys(countryData.states);
}

function getAllStates(country) {
  const countryData = resolveCountry(country);
  if (!countryData) return [];
  return Object.values(countryData.states).map(s => ({
    state: s.state,
    name: s.name,
  }));
}

function getAllStatesList() {
  const result = [];
  for (const [countryKey, countryData] of Object.entries(countries)) {
    for (const [stateKey, stateData] of Object.entries(countryData.states)) {
      result.push({
        country: countryKey,
        countryName: countryData.name,
        stateKey,
        state: stateData.state,
        stateName: stateData.name,
      });
    }
  }
  return result;
}

module.exports = {
  countries,
  getStateRules,
  getAllStateKeys,
  getAllStates,
  getAllStatesList,
};
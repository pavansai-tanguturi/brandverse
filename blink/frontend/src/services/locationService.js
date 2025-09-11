// Service for fetching countries, regions, and cities data
const LOCATION_API_BASE = 'https://restcountries.com/v3.1';

// Cache for location data to avoid repeated API calls
const locationCache = {
  countries: null,
  regions: {},
  cities: {}
};

// Fallback countries list
const fallbackCountries = [
  { name: 'Afghanistan', region: 'Asia', subregion: 'Southern Asia' },
  { name: 'Argentina', region: 'Americas', subregion: 'South America' },
  { name: 'Australia', region: 'Oceania', subregion: 'Australia and New Zealand' },
  { name: 'Austria', region: 'Europe', subregion: 'Central Europe' },
  { name: 'Bangladesh', region: 'Asia', subregion: 'Southern Asia' },
  { name: 'Belgium', region: 'Europe', subregion: 'Western Europe' },
  { name: 'Brazil', region: 'Americas', subregion: 'South America' },
  { name: 'Canada', region: 'Americas', subregion: 'North America' },
  { name: 'China', region: 'Asia', subregion: 'Eastern Asia' },
  { name: 'Denmark', region: 'Europe', subregion: 'Northern Europe' },
  { name: 'France', region: 'Europe', subregion: 'Western Europe' },
  { name: 'Germany', region: 'Europe', subregion: 'Western Europe' },
  { name: 'India', region: 'Asia', subregion: 'Southern Asia' },
  { name: 'Indonesia', region: 'Asia', subregion: 'South-Eastern Asia' },
  { name: 'Ireland', region: 'Europe', subregion: 'Northern Europe' },
  { name: 'Italy', region: 'Europe', subregion: 'Southern Europe' },
  { name: 'Japan', region: 'Asia', subregion: 'Eastern Asia' },
  { name: 'Malaysia', region: 'Asia', subregion: 'South-Eastern Asia' },
  { name: 'Mexico', region: 'Americas', subregion: 'North America' },
  { name: 'Netherlands', region: 'Europe', subregion: 'Western Europe' },
  { name: 'New Zealand', region: 'Oceania', subregion: 'Australia and New Zealand' },
  { name: 'Norway', region: 'Europe', subregion: 'Northern Europe' },
  { name: 'Pakistan', region: 'Asia', subregion: 'Southern Asia' },
  { name: 'Philippines', region: 'Asia', subregion: 'South-Eastern Asia' },
  { name: 'Singapore', region: 'Asia', subregion: 'South-Eastern Asia' },
  { name: 'South Africa', region: 'Africa', subregion: 'Southern Africa' },
  { name: 'South Korea', region: 'Asia', subregion: 'Eastern Asia' },
  { name: 'Spain', region: 'Europe', subregion: 'Southern Europe' },
  { name: 'Sweden', region: 'Europe', subregion: 'Northern Europe' },
  { name: 'Switzerland', region: 'Europe', subregion: 'Western Europe' },
  { name: 'Thailand', region: 'Asia', subregion: 'South-Eastern Asia' },
  { name: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe' },
  { name: 'United States', region: 'Americas', subregion: 'North America' },
  { name: 'Vietnam', region: 'Asia', subregion: 'South-Eastern Asia' }
];

export const locationService = {
  // Get list of all countries
  async getCountries() {
    if (locationCache.countries) {
      return locationCache.countries;
    }

    try {
      const response = await fetch(`${LOCATION_API_BASE}/all?fields=name,region,subregion`);
      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }
      
      const data = await response.json();
      
      const countries = data
        .map(country => ({
          name: country.name.common,
          region: country.region,
          subregion: country.subregion
        }))
        .filter(country => country.name && country.region) // Filter out invalid entries
        .sort((a, b) => a.name.localeCompare(b.name));

      locationCache.countries = countries;
      return countries;
    } catch (error) {
      console.error('Error fetching countries, using fallback data:', error);
      // Return fallback countries if API fails
      locationCache.countries = fallbackCountries;
      return fallbackCountries;
    }
  },

  // Get regions for a specific country (using predefined data for common countries)
  async getRegions(countryName) {
    const cacheKey = countryName.toLowerCase();
    if (locationCache.regions[cacheKey]) {
      return locationCache.regions[cacheKey];
    }

    // Predefined regions for popular countries
    const countryRegions = {
      'india': [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
        'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
        'Uttarakhand', 'West Bengal'
      ],
      'united states': [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
        'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
        'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
        'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
        'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
        'West Virginia', 'Wisconsin', 'Wyoming'
      ],
      'canada': [
        'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
        'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
        'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
        'Yukon'
      ],
      'united kingdom': [
        'England', 'Scotland', 'Wales', 'Northern Ireland'
      ],
      'australia': [
        'Australian Capital Territory', 'New South Wales', 'Northern Territory',
        'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
      ],
      'germany': [
        'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
        'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
        'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
        'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
      ],
      'france': [
        'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany',
        'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France',
        'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie',
        'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
      ],
      'italy': [
        'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
        'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche',
        'Molise', 'Piedmont', 'Puglia', 'Sardinia', 'Sicily', 'Tuscany',
        'Trentino-Alto Adige', 'Umbria', 'Aosta Valley', 'Veneto'
      ],
      'spain': [
        'Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country',
        'Canary Islands', 'Cantabria', 'Castile and León', 'Castile-La Mancha',
        'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid',
        'Murcia', 'Navarre', 'Valencia'
      ],
      'brazil': [
        'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
        'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
        'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
        'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
        'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
        'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
      ],
      'china': [
        'Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong',
        'Guangxi', 'Guizhou', 'Hainan', 'Hebei', 'Heilongjiang', 'Henan',
        'Hubei', 'Hunan', 'Inner Mongolia', 'Jiangsu', 'Jiangxi', 'Jilin',
        'Liaoning', 'Ningxia', 'Qinghai', 'Shaanxi', 'Shandong', 'Shanghai',
        'Shanxi', 'Sichuan', 'Tianjin', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'
      ],
      'japan': [
        'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka',
        'Fukushima', 'Gifu', 'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo',
        'Ibaraki', 'Ishikawa', 'Iwate', 'Kagawa', 'Kagoshima', 'Kanagawa',
        'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 'Miyazaki',
        'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Oita', 'Okayama',
        'Okinawa', 'Osaka', 'Saga', 'Saitama', 'Shiga', 'Shimane',
        'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo', 'Tottori',
        'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
      ],
      'mexico': [
        'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
        'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
        'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico', 'Mexico City', 'Michoacán',
        'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
        'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
        'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
      ]
    };

    const regions = countryRegions[cacheKey] || [];
    locationCache.regions[cacheKey] = regions;
    return regions;
  },

  // Get cities for a specific region/state (using predefined data for popular regions)
  async getCities(countryName, regionName) {
    const cacheKey = `${countryName.toLowerCase()}-${regionName.toLowerCase()}`;
    if (locationCache.cities[cacheKey]) {
      return locationCache.cities[cacheKey];
    }

    // Predefined cities for popular regions
    const regionCities = {
      // India
      'india-maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Akola', 'Nanded'],
      'india-delhi': ['New Delhi', 'Delhi Cantonment', 'Dwarka', 'Rohini', 'Janakpuri', 'Karol Bagh', 'Lajpat Nagar'],
      'india-karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Bellary', 'Bijapur'],
      'india-tamil nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Tiruppur'],
      'india-west bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Kharagpur'],
      'india-gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
      'india-rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar'],
      'india-uttar pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly'],
      'india-telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'],
      'india-punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur'],
      'india-kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha'],
      'india-haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar'],

      // United States
      'united states-california': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Fresno', 'Sacramento', 'Oakland', 'Santa Ana', 'Anaheim'],
      'united states-new york': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers', 'New Rochelle', 'Mount Vernon'],
      'united states-texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano'],
      'united states-florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale'],
      'united states-illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin'],
      'united states-pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem'],
      'united states-ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton'],
      'united states-georgia': ['Atlanta', 'Columbus', 'Augusta', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell'],
      'united states-michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing', 'Ann Arbor', 'Flint'],
      'united states-north carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary'],

      // Canada
      'canada-ontario': ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kitchener', 'Windsor', 'Oshawa', 'Barrie', 'Guelph'],
      'canada-quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Trois-Rivières'],
      'canada-british columbia': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Saanich', 'Delta'],
      'canada-alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie'],
      'canada-manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler'],
      'canada-saskatchewan': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton'],

      // United Kingdom
      'united kingdom-england': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle', 'Nottingham'],
      'united kingdom-scotland': ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee', 'Paisley', 'East Kilbride', 'Hamilton'],
      'united kingdom-wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Rhondda'],
      'united kingdom-northern ireland': ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon'],

      // Australia
      'australia-new south wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Wagga Wagga', 'Albury', 'Maitland'],
      'australia-victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Latrobe', 'Warrnambool'],
      'australia-queensland': ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Mackay', 'Rockhampton'],
      'australia-western australia': ['Perth', 'Fremantle', 'Rockingham', 'Mandurah', 'Bunbury', 'Kalgoorlie', 'Geraldton'],
      'australia-south australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta', 'Port Pirie'],

      // Germany
      'germany-bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Würzburg', 'Regensburg', 'Ingolstadt', 'Fürth'],
      'germany-north rhine-westphalia': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal'],
      'germany-baden-württemberg': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg', 'Heilbronn', 'Ulm'],
      'germany-berlin': ['Berlin'],
      'germany-hamburg': ['Hamburg'],
      'germany-hesse': ['Frankfurt', 'Wiesbaden', 'Kassel', 'Darmstadt', 'Offenbach', 'Hanau', 'Gießen'],

      // France
      'france-île-de-france': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil', 'Créteil'],
      'france-auvergne-rhône-alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Villeurbanne', 'Clermont-Ferrand', 'Annecy'],
      'france-provence-alpes-côte d\'azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Antibes'],
      'france-nouvelle-aquitaine': ['Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'Bayonne', 'La Rochelle'],
      'france-occitanie': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Narbonne'],

      // Brazil
      'brazil-são paulo': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco'],
      'brazil-rio de janeiro': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo'],
      'brazil-minas gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros'],
      'brazil-bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro'],
      'brazil-paraná': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais'],

      // China
      'china-guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan', 'Zhuhai', 'Jiangmen'],
      'china-beijing': ['Beijing'],
      'china-shanghai': ['Shanghai'],
      'china-jiangsu': ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou', 'Nantong', 'Xuzhou', 'Yancheng'],
      'china-shandong': ['Jinan', 'Qingdao', 'Zibo', 'Zaozhuang', 'Yantai', 'Weifang', 'Jining'],
      'china-zhejiang': ['Hangzhou', 'Ningbo', 'Wenzhou', 'Jiaxing', 'Huzhou', 'Shaoxing', 'Jinhua'],

      // Japan
      'japan-tokyo': ['Tokyo', 'Hachioji', 'Machida', 'Fuchu', 'Chofu', 'Komae', 'Higashimurayama'],
      'japan-osaka': ['Osaka', 'Sakai', 'Higashiosaka', 'Hirakata', 'Toyonaka', 'Suita', 'Takatsuki'],
      'japan-kanagawa': ['Yokohama', 'Kawasaki', 'Sagamihara', 'Fujisawa', 'Chigasaki', 'Hiratsuka'],
      'japan-aichi': ['Nagoya', 'Toyota', 'Okazaki', 'Ichinomiya', 'Kasugai', 'Anjo', 'Toyohashi'],
      'japan-hokkaido': ['Sapporo', 'Hakodate', 'Asahikawa', 'Kushiro', 'Tomakomai', 'Obihiro'],

      // Mexico
      'mexico-mexico city': ['Mexico City'],
      'mexico-jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'El Salto', 'Puerto Vallarta'],
      'mexico-nuevo león': ['Monterrey', 'Guadalupe', 'San Nicolás de los Garza', 'Apodaca', 'General Escobedo'],
      'mexico-puebla': ['Puebla', 'Tehuacán', 'San Martín Texmelucan', 'Atlixco', 'San Pedro Cholula'],
      'mexico-veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Poza Rica', 'Minatitlán']
    };

    const cities = regionCities[cacheKey] || [];
    locationCache.cities[cacheKey] = cities;
    return cities;
  }
};

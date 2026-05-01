const mongoose = require('mongoose');
const ThermalBath = require('./models/ThermalBath');
require('dotenv').config();

const baths = [
    {
        name: "Hammam Mellegue",
        location: "Le Kef",
        latitude: 36.183,
        longitude: 8.712,
        temperature: "65",
        type: "Station Thermale",
        indications: "Rhumatologie, Dermatologie",
        description: "Une station historique connue pour ses eaux chaudes et ses vertus curatives au cœur du Kef.",
        imageUrl: "https://1001tunisia.com/wp-content/uploads/2019/03/hammam-mellegue-au-quotidien-scaled.jpg"
    },
    {
        name: "Hammam Bourguiba",
        location: "Aïn Draham",
        latitude: 36.758,
        longitude: 8.685,
        temperature: "50",
        type: "Station Thermale",
        indications: "O.R.L, Rhumatologie",
        description: "Située dans les montagnes de Kroumirie, elle offre un cadre naturel exceptionnel et des soins de pointe.",
        imageUrl: "https://www.voyage-tunisie.info/wp-content/uploads/2017/12/Hammam-Bourguiba.jpg"
    },
    {
        name: "Korbous (Aïn Atrous)",
        location: "Nabeul",
        latitude: 36.822,
        longitude: 10.573,
        temperature: "60",
        type: "Station Thermale",
        indications: "Affections articulaires, Respiratoires",
        description: "Station nichée entre mer et montagne dans le Cap Bon, célèbre pour sa source Aïn Atrous qui se jette dans la mer.",
        imageUrl: "https://tunisie.co/uploads/images/content/korbous-271015-1.jpg"
    },
    {
        name: "Hammam Zriba",
        location: "Zaghouan",
        latitude: 36.330,
        longitude: 10.220,
        temperature: "45",
        type: "Station Thermale",
        indications: "Dermatologie, Bien-être",
        description: "Une destination de détente prisée près du temple des eaux de Zaghouan.",
        imageUrl: "https://www.leconomistemaghrebin.com/wp-content/uploads/2016/09/Zriba-Le-Village-Tunisie.jpg"
    },
    {
        name: "Hammam Sayala",
        location: "Béja",
        latitude: 36.720,
        longitude: 9.110,
        temperature: "40",
        type: "Station Thermale",
        indications: "Relaxation, Récupération",
        description: "Source thermale rurale connue pour ses propriétés apaisantes.",
        imageUrl: "https://i.ytimg.com/vi/aL3pCByWd-8/maxresdefault.jpg"
    },
    {
        name: "Djebel Oust",
        location: "Zaghouan",
        latitude: 36.551,
        longitude: 10.063,
        temperature: "54",
        type: "Station Thermale",
        indications: "Rhumatologie, Traumatologie",
        description: "Station thermale héritière d'une tradition antique, réputée pour ses soins spécialisés.",
        imageUrl: "https://www.leaders.com.tn/uploads/content/2019/04/1554198424_djebel-oust.jpg"
    },
    {
        name: "El Hamma de Gabès",
        location: "Gabès",
        latitude: 33.886,
        longitude: 9.797,
        temperature: "45",
        type: "Station Thermale",
        indications: "Rhumatologie, Gynécologie",
        description: "L'une des plus anciennes stations thermales de Tunisie, située aux portes du désert.",
        imageUrl: "https://directinfo.webmanagercenter.com/wp-content/uploads/2016/01/hamma-gabes.jpg"
    },
    {
        name: "Ain Oktor",
        location: "Korbous",
        latitude: 36.816,
        longitude: 10.566,
        temperature: "38",
        type: "Centre de Thalassothérapie",
        indications: "Amaigrissement, Post-cure",
        description: "Centre de thalassothérapie haut de gamme surplombant le golfe de Tunis.",
        imageUrl: "https://tunisie.co/uploads/images/content/Ain-Oktor-241018-01.jpg"
    },
    {
        name: "Hammam Biadha",
        location: "Siliana",
        latitude: 35.883,
        longitude: 9.166,
        temperature: "42",
        type: "Station Thermale",
        indications: "Dermatologie, Rhumatologie",
        description: "Station thermale calme située dans la région montagneuse de Siliana.",
        imageUrl: "https://tunisie.co/uploads/images/content/elhamma-130418-001.jpg"
    },
    {
        name: "Thalasso Djerba",
        location: "Djerba",
        latitude: 33.875,
        longitude: 10.857,
        temperature: "36",
        type: "Centre de Thalassothérapie",
        indications: "Stress, Remise en forme",
        description: "Centre moderne de renommée internationale sur l'île des rêves.",
        imageUrl: "https://www.hasdrubal-thalassa.com/wp-content/uploads/2021/04/hasdrubal-prestige-thalasso-djerba-hasdrubal-prestige-thalassa-spa-hasdrubal-prestige-djerba-spa-1.jpg"
    }
];

const seedBaths = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');
        
        await ThermalBath.deleteMany({});
        console.log('Cleared existing baths.');
        
        await ThermalBath.insertMany(baths);
        console.log('Successfully seeded thermal baths!');
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedBaths();

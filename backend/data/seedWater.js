require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const WaterBrand = require('../models/WaterBrand');

const waterBrands = [
  { marque: "Hayet (Jelma, Sidi Bouzid)", tds: "~241", ph: "~7.2", nitrates: "8.2", notes: "Excellent (faible minéralisation)" },
  { marque: "Jannet (Haffouz, Kairouan)", tds: "~291.6", ph: "~7.3", nitrates: "5.87", notes: "Excellent" },
  { marque: "Beya (Cherichira, Kairouan)", tds: "~315.75", ph: "~7.4", nitrates: "6.32", notes: "Bien" },
  { marque: "Jektiss (ex-Koutine)", tds: "~328", ph: "~7.63", nitrates: "22.5", notes: "Bien" },
  { marque: "Sabrine (Chébika, Kairouan)", tds: "~338.54", ph: "~7.4", nitrates: "1.20", notes: "Bien" },
  { marque: "Primaqua (Koutine, Médenine)", tds: "~343", ph: "~7.58", nitrates: "5.27", notes: "Bien" },
  { marque: "Safia (Aïn Mizeb) (Le Kef)", tds: "~344", ph: "~7.4", nitrates: "4.5", notes: "Bien" },
  { marque: "Mira (Hajeb, Kairouan)", tds: "~344", ph: "~7.3", nitrates: "3.93", notes: "Bien" },
  { marque: "Fourat (Ouslatia, Kairouan)", tds: "~?", ph: "~7.2", nitrates: "11.7", notes: "Bien" },
  { marque: "Tigen / Tiba (Labiadh / Tlebt)", tds: "~371.7 / ~447", ph: "~7.2", nitrates: "0.8", notes: "Bien" },
  { marque: "Dima (Tajerouine, Le Kef)", tds: "~371.8", ph: "~7.3", nitrates: "0.8", notes: "Bien" },
  { marque: "Palma (Sidi Aich, Gafsa)", tds: "~380", ph: "~7.4", nitrates: "11.7", notes: "Bien" },
  { marque: "Elixir (ex-Rayan, Nefza)", tds: "~428.3", ph: "~7.4", nitrates: "5.27", notes: "Bien" },
  { marque: "Royale (ex-Cristal, Siliana)", tds: "~431", ph: "~7.58", nitrates: "3.93", notes: "Bien" },
  { marque: "Saha (El Fahs, Zaghouan)", tds: "~441", ph: "~7.4", nitrates: "6.32", notes: "Bien" },
  { marque: "Melliti (Téboursouk, Beja)", tds: "~455", ph: "~7.3", nitrates: "1.20", notes: "Bien" },
  { marque: "Bulla Régia (ex-Zullel)", tds: "~?", ph: "~?", nitrates: "~?", notes: "Bien" },
  { marque: "Marwa (Sidi Nsir, Bizerte)", tds: "~?", ph: "~?", nitrates: "~?", notes: "Bien" },
  { marque: "Délice (Jelma)", tds: "~?", ph: "~?", nitrates: "~?", notes: "Bien" },
  { marque: "Denya (Hajeb, Kairouan)", tds: "~522", ph: "7.5", nitrates: "6.87", notes: "Bien" },
  { marque: "Melina (Bargou, Siliana)", tds: "~?", ph: "~?", nitrates: "~?", notes: "Bien" },
  { marque: "May / Aziz / Pristine", tds: "~?", ph: "~?", nitrates: "~?", notes: "Bien" },
  { marque: "Safia (Aïn Ksiba)", tds: "~602", ph: "~7.4", nitrates: "~22.5", notes: "Passable" },
  { marque: "Vivian (ex-Övia)", tds: "~?", ph: "~?", nitrates: "~?", notes: "Passable" },
  { marque: "Rim", tds: "~?", ph: "~6", nitrates: "~?", notes: "Passable" },
  { marque: "Cristaline", tds: "~?", ph: "~6", nitrates: "~?", notes: "Passable" },
  { marque: "Aqualine", tds: "~?", ph: "~?", nitrates: "~?", notes: "Passable" },
  { marque: "Oktor", tds: "> 1200?", ph: "~?", nitrates: "~?", notes: "Inacceptable" },
  { marque: "Garci", tds: "> 1200?", ph: "~?", nitrates: "~?", notes: "Inacceptable" }
];

const seedWaterBrands = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding WaterBrands...');

        // Clear existing data
        await WaterBrand.deleteMany();
        console.log('Cleared existing WaterBrands.');

        // Insert new data
        await WaterBrand.insertMany(waterBrands);
        console.log(`Successfully seeded ${waterBrands.length} WaterBrands.`);

        mongoose.connection.close();
        process.exit();
    } catch (err) {
        console.error('Error seeding WaterBrands:', err.message);
        process.exit(1);
    }
};

seedWaterBrands();

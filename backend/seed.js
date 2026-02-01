require('dotenv').config();
const mongoose = require('mongoose');
const Governorate = require('./models/Governorate');

const tunisiaData = [
    {
        "governorate": "Ariana",
        "delegations": [
            { "name": "Ariana Ville", "zip": "2080" },
            { "name": "Ettadhamen", "zip": "2041" },
            { "name": "Kalaat el Andalous", "zip": "2083" },
            { "name": "Mnihla", "zip": "2094" },
            { "name": "Raoued", "zip": "2056" },
            { "name": "Sidi Thabet", "zip": "2020" },
            { "name": "Soukra", "zip": "2036" }
        ]
    },
    {
        "governorate": "Béja",
        "delegations": [
            { "name": "Amdoun", "zip": "9030" },
            { "name": "Béja Nord", "zip": "9000" },
            { "name": "Béja Sud", "zip": "9000" },
            { "name": "Goubellat", "zip": "9080" },
            { "name": "Medjez el-Bab", "zip": "9070" },
            { "name": "Nefza", "zip": "9010" },
            { "name": "Teboursouk", "zip": "9040" },
            { "name": "Testour", "zip": "9060" },
            { "name": "Thibar", "zip": "9022" }
        ]
    },
    {
        "governorate": "Ben Arous",
        "delegations": [
            { "name": "Ben Arous", "zip": "2013" },
            { "name": "Bou Mhel el-Bassatine", "zip": "2097" },
            { "name": "El Mourouj", "zip": "2074" },
            { "name": "Ezzahra", "zip": "2034" },
            { "name": "Fouchana", "zip": "1135" },
            { "name": "Hammam Chif", "zip": "2050" },
            { "name": "Hammam Lif", "zip": "2050" },
            { "name": "Mohamedia", "zip": "1145" },
            { "name": "Medina Jedida", "zip": "2063" },
            { "name": "Mornag", "zip": "2090" },
            { "name": "Radès", "zip": "2040" }
        ]
    },
    {
        "governorate": "Bizerte",
        "delegations": [
            { "name": "Bizerte Nord", "zip": "7000" },
            { "name": "Bizerte Sud", "zip": "7000" },
            { "name": "Ghar El Melh", "zip": "7033" },
            { "name": "Ghazala", "zip": "7040" },
            { "name": "Joumine", "zip": "7020" },
            { "name": "Mateur", "zip": "7030" },
            { "name": "Menzel Bourguiba", "zip": "7050" },
            { "name": "Menzel Jemil", "zip": "7080" },
            { "name": "Ras Jebel", "zip": "7070" },
            { "name": "Sejnane", "zip": "7010" },
            { "name": "Tinja", "zip": "7032" },
            { "name": "Utique", "zip": "7060" },
            { "name": "Zarzouna", "zip": "7021" }
        ]
    },
    {
        "governorate": "Gabès",
        "delegations": [
            { "name": "Gabès Médina", "zip": "6000" },
            { "name": "Gabès Ouest", "zip": "6011" },
            { "name": "Gabès Sud", "zip": "6012" },
            { "name": "Ghannouch", "zip": "6020" },
            { "name": "El Hamma", "zip": "6020" },
            { "name": "Mareth", "zip": "6080" },
            { "name": "Matmata", "zip": "6070" },
            { "name": "Nouvelle Matmata", "zip": "6044" },
            { "name": "Menzel El Habib", "zip": "6030" },
            { "name": "Métouia", "zip": "6010" }
        ]
    },
    {
        "governorate": "Gafsa",
        "delegations": [
            { "name": "Belkhir", "zip": "2161" },
            { "name": "El Guettar", "zip": "2180" },
            { "name": "El Ksar", "zip": "2111" },
            { "name": "Gafsa Nord", "zip": "2100" },
            { "name": "Gafsa Sud", "zip": "2100" },
            { "name": "Mdhilla", "zip": "2170" },
            { "name": "Métlaoui", "zip": "2130" },
            { "name": "Moularès", "zip": "2110" },
            { "name": "Redeyef", "zip": "2120" },
            { "name": "Sened", "zip": "2190" },
            { "name": "Sidi Aïch", "zip": "2131" }
        ]
    },
    {
        "governorate": "Jendouba",
        "delegations": [
            { "name": "Aïn Draham", "zip": "8130" },
            { "name": "Balta-Bou Aouane", "zip": "8112" },
            { "name": "Bou Salem", "zip": "8170" },
            { "name": "Fernana", "zip": "8140" },
            { "name": "Ghardimaou", "zip": "8160" },
            { "name": "Jendouba", "zip": "8100" },
            { "name": "Jendouba Nord", "zip": "8100" },
            { "name": "Oued Meliz", "zip": "8150" },
            { "name": "Tabarka", "zip": "8110" }
        ]
    },
    {
        "governorate": "Kairouan",
        "delegations": [
            { "name": "Bou Hajla", "zip": "3180" },
            { "name": "Chebika", "zip": "3121" },
            { "name": "Echrarda", "zip": "3110" },
            { "name": "Haffouz", "zip": "3130" },
            { "name": "Hajeb El Ayoun", "zip": "3160" },
            { "name": "Kairouan Nord", "zip": "3100" },
            { "name": "Kairouan Sud", "zip": "3100" },
            { "name": "Nasrallah", "zip": "3170" },
            { "name": "Oueslatia", "zip": "3120" },
            { "name": "Sbikha", "zip": "3105" },
            { "name": "Oulaa", "zip": "3140" }
        ]
    },
    {
        "governorate": "Kasserine",
        "delegations": [
            { "name": "El Ayoun", "zip": "1214" },
            { "name": "Ezzouhour", "zip": "1200" },
            { "name": "Fériana", "zip": "1240" },
            { "name": "Foussana", "zip": "1220" },
            { "name": "Haïdra", "zip": "1231" },
            { "name": "Hassi El Ferid", "zip": "1251" },
            { "name": "Jedelienne", "zip": "1280" },
            { "name": "Kasserine Nord", "zip": "1200" },
            { "name": "Kasserine Sud", "zip": "1200" },
            { "name": "Majel Bel Abbès", "zip": "1210" },
            { "name": "Sbeïtla", "zip": "1250" },
            { "name": "Sbiba", "zip": "1270" },
            { "name": "Thala", "zip": "1210" }
        ]
    },
    {
        "governorate": "Kebili",
        "delegations": [
            { "name": "Douz Nord", "zip": "4260" },
            { "name": "Douz Sud", "zip": "4260" },
            { "name": "Faouar", "zip": "4214" },
            { "name": "Kébili Nord", "zip": "4200" },
            { "name": "Kébili Sud", "zip": "4200" },
            { "name": "Souk Lahad", "zip": "4280" }
        ]
    },
    {
        "governorate": "Kef",
        "delegations": [
            { "name": "Dahmani", "zip": "7170" },
            { "name": "Jérissa", "zip": "7180" },
            { "name": "El Ksour", "zip": "7160" },
            { "name": "Kalaat El Khasba", "zip": "7130" },
            { "name": "Kalaat Senan", "zip": "7120" },
            { "name": "Kef Est", "zip": "7100" },
            { "name": "Kef Ouest", "zip": "7100" },
            { "name": "Nebeur", "zip": "7110" },
            { "name": "Sakiet Sidi Youssef", "zip": "7122" },
            { "name": "Sers", "zip": "7180" },
            { "name": "Tajerouine", "zip": "7150" }
        ]
    },
    {
        "governorate": "Mahdia",
        "delegations": [
            { "name": "Bou Merdes", "zip": "5110" },
            { "name": "Chebba", "zip": "5170" },
            { "name": "Chorbane", "zip": "5140" },
            { "name": "El Jem", "zip": "5160" },
            { "name": "Essouassi", "zip": "5120" },
            { "name": "Hebira", "zip": "5114" },
            { "name": "Ksour Essef", "zip": "5180" },
            { "name": "Mahdia", "zip": "5100" },
            { "name": "Melloulèche", "zip": "5116" },
            { "name": "Ouled Chamekh", "zip": "5130" },
            { "name": "Sidi Alouane", "zip": "5190" }
        ]
    },
    {
        "governorate": "Manouba",
        "delegations": [
            { "name": "Borj El Amri", "zip": "1140" },
            { "name": "Djedeida", "zip": "1120" },
            { "name": "Douar Hicher", "zip": "2086" },
            { "name": "El Batan", "zip": "1114" },
            { "name": "Manouba", "zip": "2010" },
            { "name": "Mornaguia", "zip": "1110" },
            { "name": "Oued Ellil", "zip": "2021" },
            { "name": "Tebourba", "zip": "1130" }
        ]
    },
    {
        "governorate": "Medenine",
        "delegations": [
            { "name": "Ajim", "zip": "4180" },
            { "name": "Ben Guerdane", "zip": "4160" },
            { "name": "Beni Khedache", "zip": "4110" },
            { "name": "Houmt Souk", "zip": "4180" },
            { "name": "Médenine Nord", "zip": "4100" },
            { "name": "Médenine Sud", "zip": "4100" },
            { "name": "Midoun", "zip": "4116" },
            { "name": "Sidi Makhlouf", "zip": "4135" },
            { "name": "Zarzis", "zip": "4170" }
        ]
    },
    {
        "governorate": "Monastir",
        "delegations": [
            { "name": "Bekalta", "zip": "5090" },
            { "name": "Bembla", "zip": "5032" },
            { "name": "Beni Hassen", "zip": "5014" },
            { "name": "Jemmel", "zip": "5020" },
            { "name": "Ksar Hellal", "zip": "5070" },
            { "name": "Ksibet el-Médiouni", "zip": "5031" },
            { "name": "Moknine", "zip": "5050" },
            { "name": "Monastir", "zip": "5000" },
            { "name": "Ouerdanine", "zip": "5010" },
            { "name": "Sahline", "zip": "5012" },
            { "name": "Sayada-Lamta-Bou Hajar", "zip": "5035" },
            { "name": "Téboulba", "zip": "5080" },
            { "name": "Zéramdine", "zip": "5040" }
        ]
    },
    {
        "governorate": "Nabeul",
        "delegations": [
            { "name": "Béni Khiar", "zip": "8023" },
            { "name": "Béni Khalled", "zip": "8021" },
            { "name": "Bou Argoub", "zip": "8040" },
            { "name": "Dar Chaâbane El Fehri", "zip": "8011" },
            { "name": "El Haouaria", "zip": "8045" },
            { "name": "El Mida", "zip": "8090" },
            { "name": "Grombalia", "zip": "8030" },
            { "name": "Hammam Ghezèze", "zip": "8025" },
            { "name": "Hammamet", "zip": "8050" },
            { "name": "Kélibia", "zip": "8090" },
            { "name": "Korba", "zip": "8070" },
            { "name": "Menzel Bouzelfa", "zip": "8010" },
            { "name": "Menzel Temime", "zip": "8080" },
            { "name": "Nabeul", "zip": "8000" },
            { "name": "Soliman", "zip": "8020" },
            { "name": "Takelsa", "zip": "8095" }
        ]
    },
    {
        "governorate": "Sfax",
        "delegations": [
            { "name": "Agareb", "zip": "3030" },
            { "name": "Bir Ali Ben Khalifa", "zip": "3040" },
            { "name": "El Amra", "zip": "3081" },
            { "name": "El Hencha", "zip": "3010" },
            { "name": "Graïba", "zip": "3032" },
            { "name": "Jebiniana", "zip": "3080" },
            { "name": "Kerkennah", "zip": "3070" },
            { "name": "Mahrès", "zip": "3060" },
            { "name": "Menzel Chaker", "zip": "3020" },
            { "name": "Sakiet Eddaïer", "zip": "3011" },
            { "name": "Sakiet Ezzit", "zip": "3021" },
            { "name": "Sfax Ouest", "zip": "3000" },
            { "name": "Sfax Sud", "zip": "3000" },
            { "name": "Sfax Ville", "zip": "3000" },
            { "name": "Skhira", "zip": "3050" },
            { "name": "Thyna", "zip": "3020" }
        ]
    },
    {
        "governorate": "Sidi Bouzid",
        "delegations": [
            { "name": "Bir El Hafey", "zip": "9113" },
            { "name": "Cebbala Ouled Asker", "zip": "9170" },
            { "name": "Jilma", "zip": "9110" },
            { "name": "Menzel Bouzaiane", "zip": "9114" },
            { "name": "Mezzouna", "zip": "9150" },
            { "name": "Ouled Haffouz", "zip": "9180" },
            { "name": "Regueb", "zip": "9170" },
            { "name": "Sidi Ali Ben Aoun", "zip": "9130" },
            { "name": "Sidi Bouzid Est", "zip": "9100" },
            { "name": "Sidi Bouzid Ouest", "zip": "9100" },
            { "name": "Souk Jedid", "zip": "9121" }
        ]
    },
    {
        "governorate": "Siliana",
        "delegations": [
            { "name": "Bargou", "zip": "6170" },
            { "name": "Bou Arada", "zip": "6180" },
            { "name": "El Aroussa", "zip": "6122" },
            { "name": "El Krib", "zip": "6120" },
            { "name": "Gaâfour", "zip": "6110" },
            { "name": "Kesra", "zip": "6114" },
            { "name": "Makthar", "zip": "6140" },
            { "name": "Rouhia", "zip": "6150" },
            { "name": "Sidi Bou Rouis", "zip": "6190" },
            { "name": "Siliana Nord", "zip": "6100" },
            { "name": "Siliana Sud", "zip": "6100" }
        ]
    },
    {
        "governorate": "Sousse",
        "delegations": [
            { "name": "Akouda", "zip": "4022" },
            { "name": "Bouficha", "zip": "4010" },
            { "name": "Enfidha", "zip": "4030" },
            { "name": "Hammam Sousse", "zip": "4011" },
            { "name": "Kalaâ Kebira", "zip": "4060" },
            { "name": "Kalaâ Seghira", "zip": "4021" },
            { "name": "Kondar", "zip": "4020" },
            { "name": "M'saken", "zip": "4070" },
            { "name": "Sidi Bou Ali", "zip": "4040" },
            { "name": "Sidi El Hani", "zip": "4025" },
            { "name": "Sousse Jawhara", "zip": "4000" },
            { "name": "Sousse Médina", "zip": "4000" },
            { "name": "Sousse Riadh", "zip": "4023" },
            { "name": "Sidi Abdelhamid", "zip": "4000" }
        ]
    },
    {
        "governorate": "Tataouine",
        "delegations": [
            { "name": "Bir Lahmar", "zip": "3222" },
            { "name": "Dehiba", "zip": "3220" },
            { "name": "Ghomrassen", "zip": "3220" },
            { "name": "Remada", "zip": "3240" },
            { "name": "Smâr", "zip": "3225" },
            { "name": "Tataouine Nord", "zip": "3200" },
            { "name": "Tataouine Sud", "zip": "3200" }
        ]
    },
    {
        "governorate": "Tozeur",
        "delegations": [
            { "name": "Degache", "zip": "2260" },
            { "name": "Hazoua", "zip": "2223" },
            { "name": "Nefta", "zip": "2240" },
            { "name": "Tameghza", "zip": "2212" },
            { "name": "Tozeur", "zip": "2200" }
        ]
    },
    {
        "governorate": "Tunis",
        "delegations": [
            { "name": "Bab El Bhar", "zip": "1001" },
            { "name": "Bab Souika", "zip": "1006" },
            { "name": "Carthage", "zip": "2016" },
            { "name": "Cité El Khadra", "zip": "1003" },
            { "name": "Djebel Jelloud", "zip": "1004" },
            { "name": "El Kabaria", "zip": "1009" },
            { "name": "El Menzah", "zip": "1004" },
            { "name": "El Omrane", "zip": "1005" },
            { "name": "El Omrane supérieur", "zip": "1005" },
            { "name": "El Ouardia", "zip": "1009" },
            { "name": "Ettahrir", "zip": "2042" },
            { "name": "Ezzouhour", "zip": "1052" },
            { "name": "Hraïria", "zip": "1059" },
            { "name": "La Goulette", "zip": "2060" },
            { "name": "La Marsa", "zip": "2070" },
            { "name": "Le Bardo", "zip": "2000" },
            { "name": "Le Kram", "zip": "2015" },
            { "name": "Médina", "zip": "1000" },
            { "name": "Séjoumi", "zip": "1007" },
            { "name": "Sidi El Béchir", "zip": "1008" },
            { "name": "Sidi Hassine", "zip": "1095" }
        ]
    },
    {
        "governorate": "Zaghouan",
        "delegations": [
            { "name": "Bir Mcherga", "zip": "1141" },
            { "name": "El Fahs", "zip": "1140" },
            { "name": "Nadhour", "zip": "1160" },
            { "name": "Saouaf", "zip": "1150" },
            { "name": "Zaghouan", "zip": "1100" },
            { "name": "Zriba", "zip": "1152" }
        ]
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Clear existing data
        await Governorate.deleteMany({});
        console.log('Old data removed');

        // Insert new data
        await Governorate.insertMany(tunisiaData);
        console.log('Data Imported!');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();

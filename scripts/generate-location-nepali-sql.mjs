import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({ connectionString: 'postgresql://elw@localhost:5432/thulobazaar' });

// Nepal's 7 provinces in Nepali
const PROVINCES = {
  'koshi-province': 'कोशी प्रदेश',
  'madhesh-province': 'मधेश प्रदेश',
  'bagmati-province': 'बागमती प्रदेश',
  'gandaki-province': 'गण्डकी प्रदेश',
  'lumbini-province': 'लुम्बिनी प्रदेश',
  'karnali-province': 'कर्णाली प्रदेश',
  'sudurpashchim-province': 'सुदूरपश्चिम प्रदेश',
};

// Nepal's 77 districts in Nepali
const DISTRICTS = {
  // Koshi Province (1)
  'bhojpur': 'भोजपुर', 'dhankuta': 'धनकुटा', 'ilam': 'इलाम',
  'jhapa': 'झापा', 'khotang': 'खोटाङ', 'morang': 'मोरङ',
  'okhaldhunga': 'ओखलढुङ्गा', 'panchthar': 'पाँचथर', 'sankhuwasabha': 'सङ्खुवासभा',
  'solukhumbu': 'सोलुखुम्बु', 'sunsari': 'सुनसरी', 'taplejung': 'ताप्लेजुङ',
  'terhathum': 'तेह्रथुम', 'udayapur': 'उदयपुर',
  // Madhesh Province (2)
  'bara': 'बारा', 'dhanusha': 'धनुषा', 'mahottari': 'महोत्तरी',
  'parsa': 'पर्सा', 'rautahat': 'रौतहट', 'saptari': 'सप्तरी',
  'sarlahi': 'सर्लाही', 'siraha': 'सिराहा',
  // Bagmati Province (3)
  'bhaktapur': 'भक्तपुर', 'chitwan': 'चितवन', 'dhading': 'धादिङ',
  'dolakha': 'दोलखा', 'kathmandu': 'काठमाडौं', 'kavrepalanchok': 'काभ्रेपलाञ्चोक',
  'lalitpur': 'ललितपुर', 'makwanpur': 'मकवानपुर', 'nuwakot': 'नुवाकोट',
  'ramechhap': 'रामेछाप', 'rasuwa': 'रसुवा', 'sindhuli': 'सिन्धुली',
  'sindhupalchok': 'सिन्धुपाल्चोक',
  // Gandaki Province (4)
  'baglung': 'बागलुङ', 'gorkha': 'गोरखा', 'kaski': 'कास्की',
  'lamjung': 'लमजुङ', 'manang': 'मनाङ', 'mustang': 'मुस्ताङ',
  'myagdi': 'म्याग्दी', 'nawalpur': 'नवलपुर', 'parbat': 'पर्वत',
  'syangja': 'स्याङजा', 'tanahun': 'तनहुँ',
  // Lumbini Province (5)
  'arghakhanchi': 'अर्घाखाँची', 'banke': 'बाँके', 'bardiya': 'बर्दिया',
  'dang': 'दाङ', 'gulmi': 'गुल्मी', 'kapilvastu': 'कपिलवस्तु',
  'nawalparasi-west': 'नवलपरासी (बर्दघाट सुस्ता पश्चिम)',
  'palpa': 'पाल्पा', 'pyuthan': 'प्युठान', 'rolpa': 'रोल्पा',
  'rupandehi': 'रुपन्देही', 'rukum-east': 'रुकुम (पूर्वी)',
  'eastern-rukum': 'रुकुम (पूर्वी)',
  // Karnali Province (6)
  'dailekh': 'दैलेख', 'dolpa': 'डोल्पा', 'humla': 'हुम्ला',
  'jajarkot': 'जाजरकोट', 'jumla': 'जुम्ला', 'kalikot': 'कालिकोट',
  'mugu': 'मुगु', 'rukum-west': 'रुकुम (पश्चिमी)', 'salyan': 'सल्यान',
  'surkhet': 'सुर्खेत', 'western-rukum': 'रुकुम (पश्चिमी)',
  // Sudurpashchim Province (7)
  'achham': 'अछाम', 'baitadi': 'बैतडी', 'bajhang': 'बझाङ',
  'bajura': 'बाजुरा', 'dadeldhura': 'डडेलधुरा', 'darchula': 'दार्चुला',
  'doti': 'डोटी', 'kailali': 'कैलाली', 'kanchanpur': 'कञ्चनपुर',
  // Extra variants that might be in DB
  'nawalparasi': 'नवलपरासी', 'parasi': 'परासी',
  'kavrepalanchowk': 'काभ्रेपलाञ्चोक',
};

// Municipality type suffixes for auto-translation
const MUNICIPALITY_SUFFIXES = {
  'Metropolitan City': 'महानगरपालिका',
  'Sub-Metropolitan City': 'उप-महानगरपालिका',
  'Municipality': 'नगरपालिका',
  'Rural Municipality': 'गाउँपालिका',
};

// Well-known municipality Nepali names (major ones)
const KNOWN_MUNICIPALITIES = {
  'kathmandu-metropolitan-city': 'काठमाडौं महानगरपालिका',
  'lalitpur-metropolitan-city': 'ललितपुर महानगरपालिका',
  'bharatpur-metropolitan-city': 'भरतपुर महानगरपालिका',
  'pokhara-metropolitan-city': 'पोखरा महानगरपालिका',
  'biratnagar-metropolitan-city': 'विराटनगर महानगरपालिका',
  'birgunj-metropolitan-city': 'वीरगञ्ज महानगरपालिका',
  'butwal-sub-metropolitan-city': 'बुटवल उप-महानगरपालिका',
  'dharan-sub-metropolitan-city': 'धरान उप-महानगरपालिका',
  'hetauda-sub-metropolitan-city': 'हेटौंडा उप-महानगरपालिका',
  'itahari-sub-metropolitan-city': 'इटहरी उप-महानगरपालिका',
  'janakpur-sub-metropolitan-city': 'जनकपुरधाम उप-महानगरपालिका',
  'nepalgunj-sub-metropolitan-city': 'नेपालगञ्ज उप-महानगरपालिका',
  'tulsipur-sub-metropolitan-city': 'तुलसीपुर उप-महानगरपालिका',
  'ghorahi-sub-metropolitan-city': 'घोराही उप-महानगरपालिका',
  'kalaiya-sub-metropolitan-city': 'कलैया उप-महानगरपालिका',
  'mechinagar-municipality': 'मेचीनगर नगरपालिका',
  'damak-municipality': 'दमक नगरपालिका',
  'birtamod-municipality': 'विर्तामोड नगरपालिका',
  'inaruwa-municipality': 'इनरुवा नगरपालिका',
  'rajbiraj-municipality': 'राजविराज नगरपालिका',
  'lahan-municipality': 'लहान नगरपालिका',
  'gaur-municipality': 'गौर नगरपालिका',
  'chandragiri-municipality': 'चन्द्रागिरी नगरपालिका',
  'budhanilkantha-municipality': 'बूढानीलकण्ठ नगरपालिका',
  'tokha-municipality': 'टोखा नगरपालिका',
  'kirtipur-municipality': 'कीर्तिपुर नगरपालिका',
  'madhyapur-thimi-municipality': 'मध्यपुर थिमी नगरपालिका',
  'bhaktapur-municipality': 'भक्तपुर नगरपालिका',
  'godawari-municipality': 'गोदावरी नगरपालिका',
  'lekhnath-municipality': 'लेखनाथ नगरपालिका',
  'gorkha-municipality': 'गोरखा नगरपालिका',
  'tansen-municipality': 'तानसेन नगरपालिका',
  'siddharthanagar-municipality': 'सिद्धार्थनगर नगरपालिका',
  'birendranagar-municipality': 'वीरेन्द्रनगर नगरपालिका',
  'dhangadhi-sub-metropolitan-city': 'धनगढी उप-महानगरपालिका',
  'mahendranagar-municipality': 'महेन्द्रनगर नगरपालिका',
  'tikapur-municipality': 'टीकापुर नगरपालिका',
  'gulariya-municipality': 'गुलरिया नगरपालिका',
};

async function generateSQL() {
  const { rows: locations } = await pool.query(
    "SELECT id, name, slug, type, parent_id FROM locations ORDER BY type, id"
  );

  const lines = ['-- ============================================'];
  lines.push('-- POPULATE NEPALI NAMES FOR LOCATIONS');
  lines.push('-- ============================================');
  lines.push('');

  let updated = 0;
  let skipped = 0;

  for (const loc of locations) {
    let nameNe = null;

    if (loc.type === 'province') {
      nameNe = PROVINCES[loc.slug];
    } else if (loc.type === 'district') {
      nameNe = DISTRICTS[loc.slug];
    } else if (loc.type === 'municipality') {
      // Check known municipalities first
      nameNe = KNOWN_MUNICIPALITIES[loc.slug];

      if (!nameNe) {
        // Auto-generate: try to transliterate the base name
        // Pattern: "XYZ Municipality" or "XYZ Rural Municipality"
        const name = loc.name;
        let suffix = '';
        let baseName = name;

        for (const [eng, nep] of Object.entries(MUNICIPALITY_SUFFIXES)) {
          if (name.endsWith(eng)) {
            suffix = nep;
            baseName = name.replace(eng, '').trim();
            break;
          }
        }

        // Handle names with district in parentheses: "XYZ Municipality (District)"
        if (!suffix) {
          // Try removing parenthesized district name first
          const withoutDistrict = name.replace(/\s*\([^)]+\)/, '');
          for (const [eng, nep] of Object.entries(MUNICIPALITY_SUFFIXES)) {
            if (withoutDistrict.endsWith(eng)) {
              suffix = nep;
              baseName = withoutDistrict.replace(eng, '').trim();
              break;
            }
          }
        }

        // Use the English base name + Nepali suffix
        if (suffix) {
          nameNe = `${baseName} ${suffix}`;
        }
      }
    } else if (loc.type === 'area') {
      // Areas: keep English name (proper nouns / neighborhood names)
      // These are very local and often used in English even in Nepali context
      nameNe = loc.name; // Same as English for areas
    }

    if (nameNe) {
      const escaped = nameNe.replace(/'/g, "''");
      lines.push(`UPDATE locations SET name_ne = '${escaped}' WHERE id = ${loc.id};`);
      updated++;
    } else {
      skipped++;
    }
  }

  lines.push('');
  lines.push(`-- Updated: ${updated}, Skipped: ${skipped}`);

  fs.writeFileSync('scripts/populate-location-nepali-names.sql', lines.join('\n'));
  console.log(`Generated SQL: ${updated} updates, ${skipped} skipped`);

  await pool.end();
}

generateSQL();

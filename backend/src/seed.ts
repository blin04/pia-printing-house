import 'dotenv/config'
import mongoose, { Types } from 'mongoose'
import bcrypt from 'bcryptjs'

import UserModel from './models/user'
import CategoryModel from './models/category'
import ProductModel from './models/product'
import OrderModel, { ORDER_STATUSES } from './models/order'
import CommentModel from './models/comment'
import AuctionModel from './models/auction'

const MONGODB_URI = 'mongodb://127.0.0.1:27017/stamparija'

// Every demo user shares this password. It satisfies the project's password
// rule (8–12 chars, starts with a letter, ≥1 uppercase, ≥1 digit, ≥1 special).
const DEMO_PASSWORD = 'Sifra123!'
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10)

// Small helper: money rounding to whole dinars.
const rsd = (n: number) => Math.round(n)

// Set an exact createdAt on an already-saved doc (Mongoose timestamps would
// otherwise force "now"). Used to backdate orders for the admin statistics.
async function backdate(model: mongoose.Model<any>, id: Types.ObjectId, when: Date) {
  await model.updateOne({ _id: id }, { $set: { createdAt: when } }, { timestamps: false })
}

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000)

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log(`Povezan na ${MONGODB_URI}`)

  // ---- Clean slate ------------------------------------------------------
  await Promise.all([
    UserModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    OrderModel.deleteMany({}),
    CommentModel.deleteMany({}),
    AuctionModel.deleteMany({}),
  ])
  console.log('Kolekcije ispražnjene.')

  // ---- Categories (inferred from the project specification) -------------
  const [maliFormat, velikiFormat, kreativne] = (await CategoryModel.create([
    {
      naziv: 'Štampa malih formata',
      podkategorije: [
        { naziv: 'Olovke' },
        { naziv: 'Vizit karte' },
        { naziv: 'Flajeri' },
        { naziv: 'Zahvalnice' },
        { naziv: 'Pozivnice' },
        { naziv: 'Fascikle' },
      ],
    },
    {
      naziv: 'Štampa velikih formata',
      podkategorije: [{ naziv: 'Posteri' }, { naziv: 'Rollups' }, { naziv: 'Fototapete' }],
    },
    {
      naziv: 'Kreativne štampe',
      podkategorije: [
        { naziv: 'Šolje' },
        { naziv: 'Štampa na majicama' },
        { naziv: 'Štampa na duksevima' },
        { naziv: 'Štampa na cegerima' },
      ],
    },
  ])) as any[]
  console.log('Kategorije kreirane: 3')

  // ---- Users ------------------------------------------------------------
  // Admin (login je na posebnoj, nejavnoj ruti).
  const [admin] = (await UserModel.create([
    {
      username: 'admin',
      passwordHash,
      ime: 'Nikola',
      prezime: 'Petrović',
      telefon: '+381641112233',
      email: 'admin@printinghouse.rs',
      tip: 'admin',
      status: 'odobren',
    },
  ])) as any[]

  // Štampari (pravna lica) — svi odobreni.
  const [copyStudio, grafikaPlus, printExpress] = (await UserModel.create([
    {
      username: 'copystudio',
      passwordHash,
      ime: 'Milan',
      prezime: 'Jovanović',
      telefon: '+381112223344',
      email: 'kontakt@copystudio.rs',
      tip: 'stampar',
      lice: 'pravno',
      status: 'odobren',
      institucija: {
        naziv: 'Copy Studio Kumanovska',
        adresaSedista: 'Kumanovska 12, Beograd',
        grad: 'Beograd',
        maticniBroj: '20345678',
        pib: '101234567',
        lokacija: { lat: 44.7866, lng: 20.4489 },
      },
    },
    {
      username: 'grafikaplus',
      passwordHash,
      ime: 'Ana',
      prezime: 'Kovačević',
      telefon: '+381212334455',
      email: 'office@grafikaplus.rs',
      tip: 'stampar',
      lice: 'pravno',
      status: 'odobren',
      institucija: {
        naziv: 'Štamparija Grafika Plus',
        adresaSedista: 'Bulevar oslobođenja 45, Novi Sad',
        grad: 'Novi Sad',
        maticniBroj: '20345679',
        pib: '101234568',
        lokacija: { lat: 45.2671, lng: 19.8335 },
      },
    },
    {
      username: 'printexpress',
      passwordHash,
      ime: 'Stefan',
      prezime: 'Nikolić',
      telefon: '+381182445566',
      email: 'info@printexpress.rs',
      tip: 'stampar',
      lice: 'pravno',
      status: 'odobren',
      institucija: {
        naziv: 'Print Express',
        adresaSedista: 'Obrenovićeva 8, Niš',
        grad: 'Niš',
        maticniBroj: '20345680',
        pib: '101234569',
        lokacija: { lat: 43.3209, lng: 21.8958 },
      },
    },
  ])) as any[]

  // Klijenti — fizička lica.
  const [marko, jovana] = (await UserModel.create([
    {
      username: 'marko',
      passwordHash,
      ime: 'Marko',
      prezime: 'Marković',
      telefon: '+381631234567',
      email: 'marko.markovic@gmail.com',
      tip: 'klijent',
      lice: 'fizicko',
      status: 'odobren',
    },
    {
      username: 'jovana',
      passwordHash,
      ime: 'Jovana',
      prezime: 'Ilić',
      telefon: '+381649876543',
      email: 'jovana.ilic@gmail.com',
      tip: 'klijent',
      lice: 'fizicko',
      status: 'odobren',
    },
  ])) as any[]

  // Klijent — pravno lice (ima pravo na javne nabavke).
  const [kreativa] = (await UserModel.create([
    {
      username: 'kreativa',
      passwordHash,
      ime: 'Dragana', // odgovorno lice
      prezime: 'Đorđević',
      telefon: '+381115556677',
      email: 'nabavka@kreativa.rs',
      tip: 'klijent',
      lice: 'pravno',
      status: 'odobren',
      institucija: {
        naziv: 'Agencija Kreativa doo',
        adresaSedista: 'Terazije 3, Beograd',
        grad: 'Beograd',
        maticniBroj: '20345681',
        pib: '101234570',
        lokacija: { lat: 44.8125, lng: 20.4612 },
      },
    },
  ])) as any[]

  // Neodobreni zahtev za registraciju (za demo administratorovog odobravanja).
  await UserModel.create([
    {
      username: 'novastamparija',
      passwordHash,
      ime: 'Petar',
      prezime: 'Simić',
      telefon: '+381113334455',
      email: 'kontakt@novastamparija.rs',
      tip: 'stampar',
      lice: 'pravno',
      status: 'neodobren',
      institucija: {
        naziv: 'Nova Štamparija',
        adresaSedista: 'Cara Dušana 100, Beograd',
        grad: 'Beograd',
        maticniBroj: '20345682',
        pib: '101234571',
      },
    },
  ])
  console.log('Korisnici kreirani: 1 admin, 3 štampara, 3 klijenta, 1 neodobren.')

  // ---- Products ---------------------------------------------------------
  // Copy Studio — tri proizvoda iz Priloga 1 projektnog zadatka.
  const [poloMajica, solja, rollup] = (await ProductModel.create([
    {
      stampar: copyStudio._id,
      sifra: 'PR-001',
      naziv: 'Pamucna Polo Majica',
      opis:
        'Kvalitetna pamučna polo majica 180g/m2, pogodna za brendiranje i korporativne uniforme.',
      kategorija: kreativne._id,
      potkategorija: 'Štampa na majicama',
      jedinicnaCena: 1200,
      kolicinaNaLageru: 150,
      dostupneBoje: ['Bela', 'Crna', 'Tamno plava', 'Siva'],
      slikaUrl: 'polo_majica.jpg',
      dodatneSlike: [],
      uslugeStampe: [
        {
          idUsluge: 'USL-01',
          tipStampe: 'Direktna štampa na tekstil (DTG)',
          dodatnaCenaPoKomadu: 350,
          maxSirinaMm: 300,
          maxVisinaMm: 400,
        },
        {
          idUsluge: 'USL-02',
          tipStampe: 'Preslikač (Sito preslikač)',
          dodatnaCenaPoKomadu: 200,
          maxSirinaMm: 280,
          maxVisinaMm: 350,
        },
      ],
      likes: 42,
      dislikes: 3,
    },
    {
      stampar: copyStudio._id,
      sifra: 'PR-002',
      naziv: 'Keramička šolja 330ml',
      opis: 'Bela keramička šolja visokog sjaja, idealna za sublimacionu štampu visoke rezolucije.',
      kategorija: kreativne._id,
      potkategorija: 'Šolje',
      jedinicnaCena: 320,
      kolicinaNaLageru: 500,
      dostupneBoje: ['Bela'],
      slikaUrl: 'solja.jpg',
      dodatneSlike: [],
      uslugeStampe: [
        {
          idUsluge: 'USL-03',
          tipStampe: 'Sublimaciona štampa',
          dodatnaCenaPoKomadu: 150,
          maxSirinaMm: 200,
          maxVisinaMm: 85,
        },
      ],
      likes: 58,
      dislikes: 2,
    },
    {
      stampar: copyStudio._id,
      sifra: 'PR-003',
      naziv: 'Promotivni Roll-up Baner 85x200cm',
      opis: 'Lagan aluminijumski mehanizam sa torbom i štampom na kvalitetnom baner platnu.',
      kategorija: velikiFormat._id,
      potkategorija: 'Rollups',
      jedinicnaCena: 4500,
      kolicinaNaLageru: 20,
      dostupneBoje: ['Bela', 'Crna'],
      slikaUrl: 'rollup.jpg',
      dodatneSlike: [],
      uslugeStampe: [
        {
          idUsluge: 'USL-04',
          tipStampe: 'Eko-solventna štampa visoke rezolucije',
          dodatnaCenaPoKomadu: 800,
          maxSirinaMm: 850,
          maxVisinaMm: 2000,
        },
      ],
      likes: 15,
      dislikes: 1,
    },
  ])) as any[]

  // Grafika Plus.
  const [vizitKarte, poster] = (await ProductModel.create([
    {
      stampar: grafikaPlus._id,
      sifra: 'GP-001',
      naziv: 'Vizit karte Premium 350g',
      opis: 'Dvostrane vizit karte na premium mat kartonu 350g, sa opcionom plastifikacijom.',
      kategorija: maliFormat._id,
      potkategorija: 'Vizit karte',
      jedinicnaCena: 25,
      kolicinaNaLageru: 10000,
      dostupneBoje: ['Bela'],
      slikaUrl: 'vizit_karte.jpg',
      uslugeStampe: [
        {
          idUsluge: 'USL-05',
          tipStampe: 'Mat plastifikacija',
          dodatnaCenaPoKomadu: 8,
          maxSirinaMm: 90,
          maxVisinaMm: 50,
        },
      ],
      likes: 30,
      dislikes: 0,
    },
    {
      stampar: grafikaPlus._id,
      sifra: 'GP-002',
      naziv: 'Poster A1 sjajni',
      opis: 'Poster formata A1 na sjajnom foto papiru 200g, žive boje.',
      kategorija: velikiFormat._id,
      potkategorija: 'Posteri',
      jedinicnaCena: 650,
      kolicinaNaLageru: 300,
      dostupneBoje: ['Bela'],
      slikaUrl: 'poster.jpg',
      uslugeStampe: [],
      likes: 22,
      dislikes: 4,
    },
  ])) as any[]

  // Print Express.
  const [ceger, flajer] = (await ProductModel.create([
    {
      stampar: printExpress._id,
      sifra: 'PE-001',
      naziv: 'Platneni ceger',
      opis: 'Ekološki platneni ceger 140g/m2, duge drške, pogodan za štampu logotipa.',
      kategorija: kreativne._id,
      potkategorija: 'Štampa na cegerima',
      jedinicnaCena: 280,
      kolicinaNaLageru: 400,
      dostupneBoje: ['Bela', 'Bež', 'Crna'],
      slikaUrl: 'ceger.jpg',
      uslugeStampe: [
        {
          idUsluge: 'USL-06',
          tipStampe: 'Sito štampa',
          dodatnaCenaPoKomadu: 120,
          maxSirinaMm: 250,
          maxVisinaMm: 300,
        },
      ],
      likes: 37,
      dislikes: 2,
    },
    {
      stampar: printExpress._id,
      sifra: 'PE-002',
      naziv: 'Flajer A5 obostrani',
      opis: 'Flajer A5 na 135g kunstdruku, puni kolor obostrano.',
      kategorija: maliFormat._id,
      potkategorija: 'Flajeri',
      jedinicnaCena: 12,
      kolicinaNaLageru: 20000,
      dostupneBoje: ['Bela'],
      slikaUrl: 'flajer.jpg',
      uslugeStampe: [],
      likes: 9,
      dislikes: 1,
    },
  ])) as any[]
  console.log('Proizvodi kreirani: 7')

  // ---- Orders / Invoices (razni statusi + datumi za statistiku) --------
  // Marko: primljena porudžbina polo majica (za arhivu + komentare).
  const poloJed = 1200 + 350 // osnovna + DTG usluga
  const [ord1] = (await OrderModel.create([
    {
      klijent: marko._id,
      stampar: copyStudio._id,
      stamparija: 'Copy Studio Kumanovska',
      grad: 'Beograd',
      proizvodi: [
        {
          proizvod: poloMajica._id,
          naziv: 'Pamucna Polo Majica',
          kolicina: 2,
          boja: 'Crna',
          idUsluge: 'USL-01',
          tipStampe: 'Direktna štampa na tekstil (DTG)',
          tekst: 'ETF',
          jedinicnaCena: poloJed,
          ukupnaCena: rsd(poloJed * 2),
        },
      ],
      cena: rsd(poloJed * 2),
      status: 'primljeno',
      izvor: 'direct',
    },
  ])) as any[]
  await backdate(OrderModel, ord1._id, daysAgo(70))

  // Marko: isporučena porudžbina šolja (može da je prebaci u "primljeno").
  const soljaJed = 320 + 150
  const [ord2] = (await OrderModel.create([
    {
      klijent: marko._id,
      stampar: copyStudio._id,
      stamparija: 'Copy Studio Kumanovska',
      grad: 'Beograd',
      proizvodi: [
        {
          proizvod: solja._id,
          naziv: 'Keramička šolja 330ml',
          kolicina: 5,
          boja: 'Bela',
          idUsluge: 'USL-03',
          tipStampe: 'Sublimaciona štampa',
          tekst: 'Najbolji tata',
          jedinicnaCena: soljaJed,
          ukupnaCena: rsd(soljaJed * 5),
        },
      ],
      cena: rsd(soljaJed * 5),
      status: 'isporuceno',
      izvor: 'direct',
    },
  ])) as any[]
  await backdate(OrderModel, ord2._id, daysAgo(20))

  // Jovana: porudžbina vizit karti u štampi.
  const vizitJed = 25 + 8
  const [ord3] = (await OrderModel.create([
    {
      klijent: jovana._id,
      stampar: grafikaPlus._id,
      stamparija: 'Štamparija Grafika Plus',
      grad: 'Novi Sad',
      proizvodi: [
        {
          proizvod: vizitKarte._id,
          naziv: 'Vizit karte Premium 350g',
          kolicina: 200,
          boja: 'Bela',
          idUsluge: 'USL-05',
          tipStampe: 'Mat plastifikacija',
          jedinicnaCena: vizitJed,
          ukupnaCena: rsd(vizitJed * 200),
        },
      ],
      cena: rsd(vizitJed * 200),
      status: 'u stampi',
      izvor: 'direct',
    },
  ])) as any[]
  await backdate(OrderModel, ord3._id, daysAgo(10))

  // Jovana: sveža porudžbina — status "naruceno" (može da se otkaže).
  const [ord4] = (await OrderModel.create([
    {
      klijent: jovana._id,
      stampar: printExpress._id,
      stamparija: 'Print Express',
      grad: 'Niš',
      proizvodi: [
        {
          proizvod: ceger._id,
          naziv: 'Platneni ceger',
          kolicina: 30,
          boja: 'Bež',
          idUsluge: 'USL-06',
          tipStampe: 'Sito štampa',
          jedinicnaCena: 280 + 120,
          ukupnaCena: rsd((280 + 120) * 30),
        },
      ],
      cena: rsd((280 + 120) * 30),
      status: 'naruceno',
      izvor: 'direct',
    },
  ])) as any[]
  await backdate(OrderModel, ord4._id, daysAgo(2))
  console.log('Narudžbine kreirane: 4 (+1 iz licitacije niže)')

  // ---- Comments (za primljeni proizvod iz ord1) ------------------------
  await CommentModel.create([
    {
      proizvod: poloMajica._id,
      autorObjekat: marko._id,
      autor: 'marko',
      narudzbina: ord1._id,
      reakcija: 'like',
      komentar: 'Odličan kvalitet majice, štampa se ne skida nakon pranja. Preporučujem!',
    },
  ])
  console.log('Komentari kreirani: 1')

  // ---- Public procurement / Javna nabavka ------------------------------
  // Kreativa doo raspisuje nabavku; unapred generišemo _id-jeve traženih
  // stavki da bi ponude mogle da referenciraju konkretnu stavku.
  const trazenaMajica = new Types.ObjectId()
  const trazenaSolja = new Types.ObjectId()

  // Zatvorena nabavka sa pobednikom -> generisana narudžbina (izvor 'auction').
  const [ordAukcija] = (await OrderModel.create([
    {
      klijent: kreativa._id,
      stampar: copyStudio._id,
      stamparija: 'Copy Studio Kumanovska',
      grad: 'Beograd',
      proizvodi: [
        {
          proizvod: poloMajica._id,
          naziv: 'Pamucna Polo Majica',
          kolicina: 100,
          boja: 'Crna',
          idUsluge: 'USL-01',
          tipStampe: 'Direktna štampa na tekstil (DTG)',
          jedinicnaCena: poloJed,
          ukupnaCena: rsd(poloJed * 100),
        },
      ],
      cena: rsd(poloJed * 100),
      status: 'u stampi',
      izvor: 'auction',
    },
  ])) as any[]
  await backdate(OrderModel, ordAukcija._id, daysAgo(15))

  const pobednickaPonudaId = new Types.ObjectId()
  await AuctionModel.create([
    {
      klijent: kreativa._id,
      nazivKlijenta: 'Agencija Kreativa doo',
      potrebniProizvodi: [
        {
          _id: trazenaMajica,
          naziv: 'Pamucna Polo Majica',
          kategorija: 'Kreativne štampe',
          potkategorija: 'Štampa na majicama',
          kolicina: 100,
          boja: 'Crna',
          tipStampe: 'Direktna štampa na tekstil (DTG)',
        },
      ],
      ponude: [
        {
          _id: pobednickaPonudaId,
          stampar: copyStudio._id,
          stamparija: 'Copy Studio Kumanovska',
          proizvodi: [
            {
              potrebanProizvod: trazenaMajica,
              proizvod: poloMajica._id,
              jedinicnaCena: poloJed,
              ukupnaCena: rsd(poloJed * 100),
            },
          ],
          ukupnacena: rsd(poloJed * 100),
          naStanju: true,
        },
        {
          stampar: printExpress._id,
          stamparija: 'Print Express',
          proizvodi: [
            {
              potrebanProizvod: trazenaMajica,
              proizvod: ceger._id, // najbliži proizvod koji nudi
              jedinicnaCena: 1800,
              ukupnaCena: rsd(1800 * 100),
            },
          ],
          ukupnacena: rsd(1800 * 100),
          naStanju: true,
        },
      ],
      zavrsetak: daysAgo(15), // već istekla
      status: 'closed',
      pobednik: pobednickaPonudaId,
      narudzbina: ordAukcija._id,
      zavrseno: daysAgo(15),
    },
  ])

  // Otvorena nabavka (licitacija u toku, ističe za 10 minuta) — bez ponuda još.
  await AuctionModel.create([
    {
      klijent: kreativa._id,
      nazivKlijenta: 'Agencija Kreativa doo',
      potrebniProizvodi: [
        {
          _id: trazenaSolja,
          naziv: 'Keramička šolja 330ml',
          kategorija: 'Kreativne štampe',
          potkategorija: 'Šolje',
          kolicina: 50,
          boja: 'Bela',
          tipStampe: 'Sublimaciona štampa',
        },
      ],
      ponude: [],
      zavrsetak: new Date(Date.now() + 10 * 60 * 1000),
      status: 'open',
    },
  ])
  console.log('Javne nabavke kreirane: 1 zatvorena (sa pobednikom), 1 otvorena')

  // ---- Indexes ----------------------------------------------------------
  // Build the unique/query indexes declared on the schemas so the constraints
  // exist in the DB (the app itself will run with autoIndex disabled).
  await Promise.all([
    UserModel.syncIndexes(),
    CategoryModel.syncIndexes(),
    ProductModel.syncIndexes(),
    OrderModel.syncIndexes(),
    CommentModel.syncIndexes(),
    AuctionModel.syncIndexes(),
  ])
  console.log('Indeksi izgrađeni.')

  console.log(`\nGotovo. Lozinka za sve demo naloge: ${DEMO_PASSWORD}`)
  console.log(`Statusi narudžbina: ${ORDER_STATUSES.join(' → ')}`)
}

main()
  .catch((err) => {
    console.error('Greška pri popunjavanju baze:', err)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())

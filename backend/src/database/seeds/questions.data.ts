import { TestQuestion } from '../entities/test.entity';

export const TEST_TITLE = "Sarguzasht: O'zingni tanish";
export const TEST_DESCRIPTION =
  "Qiziqarli vaziyatlar orqali o'zingni yaxshiroq tanib oling. 15 daqiqa, to'g'ri yoki noto'g'ri javob yo'q - muhimi sizning fikringiz!";

export const QUESTIONS: TestQuestion[] = [
  {
    id: 'q1',
    domain: 'aggression',
    text: "Sinfdoshing sendan kulib qaradi va hamma oldida masxara qildi. Nima qilasan?",
    options: [
      { key: 'A', text: "Kulib qo'yib, e'tibor bermayman", riskWeight: 0 },
      { key: 'B', text: 'Unga gapni tushuntiraman, nega bunday qilganini so\'rayman', riskWeight: 0 },
      { key: 'C', text: "Jahlim chiqib, unga qarata baqirib tashlayman", riskWeight: 2 },
      { key: 'D', text: "Uni urib, o'chimni olaman", riskWeight: 3 },
    ],
  },
  {
    id: 'q2',
    domain: 'bullying',
    text: 'Tanaffusda bir guruh o\'quvchi yangi kelgan o\'quvchini doim masxara qiladi. Sen buni ko\'rib turasan.',
    options: [
      { key: 'A', text: "Borib to'xtatishga harakat qilaman yoki o'qituvchiga aytaman", riskWeight: 0 },
      { key: 'B', text: "Yoningdan o'tib ketaman, aralashmayman", riskWeight: 1 },
      { key: 'C', text: 'Ularga qo\'shilib kulaman', riskWeight: 2 },
      { key: 'D', text: "Men ham unga shunday munosabatda bo'laman", riskWeight: 3 },
    ],
  },
  {
    id: 'q3',
    domain: 'bullying',
    text: "Kimdir senga til tegizsa yoki haqorat qilsa, odatda nima qilasan?",
    options: [
      { key: 'A', text: "Katta odamga (ota-ona yoki o'qituvchi) aytaman", riskWeight: 0 },
      { key: 'B', text: "Do'stlarimga aytib, birgalikda hal qilamiz", riskWeight: 0 },
      { key: 'C', text: 'Hech kimga aytmayman, ichimda saqlayman', riskWeight: 2 },
      { key: 'D', text: "O'zim ham boshqasiga shunday qilib, \"qaytarib beraman\"", riskWeight: 3 },
    ],
  },
  {
    id: 'q4',
    domain: 'emotional',
    text: "O'zingni qanchalik tez-tez yolg'iz his qilasan?",
    options: [
      { key: 'A', text: 'Hech qachon', riskWeight: 0 },
      { key: 'B', text: 'Kamdan-kam', riskWeight: 1 },
      { key: 'C', text: 'Tez-tez', riskWeight: 2 },
      { key: 'D', text: 'Doimo', riskWeight: 3 },
    ],
  },
  {
    id: 'q5',
    domain: 'emotional',
    text: 'Kelajak haqida o\'ylaganda qanday his qilasan?',
    options: [
      { key: 'A', text: 'Ishonch va umid bilan qarayman', riskWeight: 0 },
      { key: 'B', text: 'Ba\'zan xavotirlanaman, lekin umuman yaxshi', riskWeight: 1 },
      { key: 'C', text: "Ko'pincha xavotir va qo'rqinch his qilaman", riskWeight: 2 },
      { key: 'D', text: "Hech narsa yaxshi bo'lmaydi deb o'ylayman", riskWeight: 3 },
    ],
  },
  {
    id: 'q6',
    domain: 'peer',
    text: 'Sinfda yaqin do\'stlaring bormi?',
    options: [
      { key: 'A', text: "Ha, bir nechta yaqin do'stim bor", riskWeight: 0 },
      { key: 'B', text: "Bir-ikkita do'stim bor", riskWeight: 1 },
      { key: 'C', text: "Deyarli yo'q", riskWeight: 2 },
      { key: 'D', text: 'Yo\'q, hamma men bilan gaplashishni xohlamaydi', riskWeight: 3 },
    ],
  },
  {
    id: 'q7',
    domain: 'peer',
    text: "Sen uchun og'ir bir muammo bo'lsa, kimga murojaat qilasan?",
    options: [
      { key: 'A', text: "Ota-onam yoki o'qituvchimga", riskWeight: 0 },
      { key: 'B', text: "Yaqin do'stimga", riskWeight: 0 },
      { key: 'C', text: "Hech kimga, o'zim hal qilishga harakat qilaman", riskWeight: 1 },
      { key: 'D', text: "Hech kim menga yordam bera olmaydi deb o'ylayman, hech kimga aytmayman", riskWeight: 3 },
    ],
  },
  {
    id: 'q8',
    domain: 'conduct',
    text: "O'qituvchi yo'q paytda sinfdoshlaring qoidani buzishni taklif qilsa (masalan, darsdan qochish), nima qilasan?",
    options: [
      { key: 'A', text: "Yo'q deyman va ularni ham qaytaraman", riskWeight: 0 },
      { key: 'B', text: "Yo'q deyman, lekin ularga gap qaytarmayman", riskWeight: 0 },
      { key: 'C', text: "Ikkilanib turib, ularga qo'shilaman", riskWeight: 2 },
      { key: 'D', text: "Albatta qo'shilaman, qiziq-ku", riskWeight: 3 },
    ],
  },
  {
    id: 'q9',
    domain: 'conduct',
    text: "Maktab devoriga yoki partaga chizish/yozish haqida fikring qanday?",
    options: [
      { key: 'A', text: "Bu maktab mol-mulki, buzmaslik kerak", riskWeight: 0 },
      { key: 'B', text: "Yoqmaydi, lekin boshqalar qilsa e'tiroz bildirmayman", riskWeight: 1 },
      { key: 'C', text: "Ba'zan o'zim ham qiziqib chizib qo'yaman", riskWeight: 2 },
      { key: 'D', text: "Bunda hech qanday yomon narsa yo'q, hamma qiladi", riskWeight: 3 },
    ],
  },
  {
    id: 'q10',
    domain: 'aggression',
    text: 'Juda jahling chiqqanda odatda qanday harakat qilasan?',
    options: [
      { key: 'A', text: "Chuqur nafas olib, o'zimni bosib olishga harakat qilaman", riskWeight: 0 },
      { key: 'B', text: "Birozdan keyin sokin joyga borib, o'zimni tinchlantiraman", riskWeight: 0 },
      { key: 'C', text: 'Narsalarni uloqtiraman yoki uraman', riskWeight: 2 },
      { key: 'D', text: 'Yonimdagi odamga jismoniy hujum qilib yuboraman', riskWeight: 3 },
    ],
  },
  {
    id: 'q11',
    domain: 'substance',
    text: "Do'stlaring chekish yoki spirtli ichimlik ichishni taklif qilsa, nima qilasan?",
    options: [
      { key: 'A', text: 'Qat\'iy rad etaman, bu zararli ekanini bilaman', riskWeight: 0 },
      { key: 'B', text: "Rad etaman, lekin noqulay his qilaman", riskWeight: 1 },
      { key: 'C', text: "Bir marta sinab ko'rishdan zarar yo'q deb o'ylayman", riskWeight: 2 },
      { key: 'D', text: "Roziman, do'stlarimdan ajralib qolishni xohlamayman", riskWeight: 3 },
    ],
  },
  {
    id: 'q12',
    domain: 'substance',
    text: 'Atrofingdagi kattalar chekayotganini ko\'rganda fikring qanday?',
    options: [
      { key: 'A', text: 'Bu sog\'liqqa zarar, men bunday qilmayman', riskWeight: 0 },
      { key: 'B', text: "Ularning ishi, menga aloqasi yo'q", riskWeight: 1 },
      { key: 'C', text: "Kattalar bo'lsam, men ham sinab ko'raman", riskWeight: 2 },
      { key: 'D', text: "Bu kattalik belgisi, qiziqarli ko'rinadi", riskWeight: 3 },
    ],
  },
  {
    id: 'q13',
    domain: 'prosocial',
    text: "Sinfdoshingga yordam kerak bo'lsa (masalan, darsni tushunmayapti), nima qilasan?",
    options: [
      { key: 'A', text: "Albatta yordam beraman, tushuntirib beraman", riskWeight: 0 },
      { key: 'B', text: "Vaqtim bo'lsa yordam beraman", riskWeight: 0 },
      { key: 'C', text: "O'zim ham bilmayman deb, e'tibor bermayman", riskWeight: 1 },
      { key: 'D', text: "Menga foydasi yo'q ishlarga vaqt sarflamayman", riskWeight: 2 },
    ],
  },
  {
    id: 'q14',
    domain: 'emotional',
    text: "O'zing haqingda qanday fikrdasan?",
    options: [
      { key: 'A', text: 'O\'zimni yoqtiraman, kamchiliklarim bilan ham qabul qilaman', riskWeight: 0 },
      { key: 'B', text: "Ko'pincha o'zimdan mamnunman", riskWeight: 0 },
      { key: 'C', text: "Ko'pincha o'zimni yoqtirmayman", riskWeight: 2 },
      { key: 'D', text: "O'zimni hech kimga keraksiz his qilaman", riskWeight: 3 },
    ],
  },
  {
    id: 'q15',
    domain: 'conduct',
    text: "Agar yerda kimningdir pulini topib olsang, nima qilasan?",
    options: [
      { key: 'A', text: "Egasini topishga harakat qilaman yoki o'qituvchiga topshiraman", riskWeight: 0 },
      { key: 'B', text: "Olib, keyin o'ylab ko'raman", riskWeight: 1 },
      { key: 'C', text: "Olib qolaman, kim bilibdi qaytarib berishni", riskWeight: 2 },
      { key: 'D', text: "Olib qolaman, bu omad-ku", riskWeight: 3 },
    ],
  },
];

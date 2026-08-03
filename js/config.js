/* =============================================================
   ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ / SETTINGS
   Այս ֆայլում են բոլոր փոփոխվող արժեքները։
   This file holds every value you need to change.
   ============================================================= */

window.CONFIG = {

  /* -----------------------------------------------------------
     1) ՀԱՐՍԱՆԻՔԻ ԱՄՍԱԹԻՎԸ — հետհաշվարկի համար
        WEDDING DATE — used by the countdown.
        Ձևաչափ / Format: 'YYYY-MM-DDTHH:mm:ss+04:00'
        (+04:00 = Հայաստանի ժամանակ / Armenia time)
     ----------------------------------------------------------- */
  weddingDate: '2026-09-26T14:00:00+04:00',


  /* -----------------------------------------------------------
     2) GOOGLE SHEETS-Ի ՀԱՍՑԵՆ
        Google Apps Script Web App URL.
        Տես apps-script/SETUP.md — 5 րոպեի աշխատանք։
        See apps-script/SETUP.md for how to get this URL.

        Օրինակ / Example:
        'https://script.google.com/macros/s/AKfycb.../exec'

        Քանի դեռ դատարկ է, ձևաթուղթը կաշխատի «փորձնական» ռեժիմով՝
        տվյալները կցուցադրվեն browser-ի console-ում, չեն պահվի։
     ----------------------------------------------------------- */
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbydCnvwm-akjcKuvyew7wPe5q0REPqMpP96SgGsDcHB7VimWXdSrYIdP5DVzZW2_3iV/exec',


  /* -----------------------------------------------------------
     3) ՀՅՈՒՐԵՐԻ ԱՌԱՎԵԼԱԳՈՒՅՆ ՔԱՆԱԿԸ մեկ հայտում
        Max guests per submission.
     ----------------------------------------------------------- */
  maxGuests: 10,


  /* -----------------------------------------------------------
     4) YANDEX MAPS-Ի ԴՈՄԵՆԸ
        'yandex.com' — միջազգային (խորհուրդ է տրվում)
        'yandex.ru'  — ռուսերեն ինտերֆեյս
     ----------------------------------------------------------- */
  yandexDomain: 'yandex.com',


  /* -----------------------------------------------------------
     5) ՔԱՐՏԵԶԻ ԿՈՃԱԿՆԵՐԻ ՏԵՔՍՏԸ
        Map button labels.
     ----------------------------------------------------------- */
  mapLabels: {
    google: 'Google Maps',
    yandex: 'Yandex Navi'
  },


  /* -----------------------------------------------------------
     6) ԼՈՒՍԱՆԿԱՐՆԵՐԸ
        PHOTOS

        Պարզապես դրեք ձեր նկարները img/ պանակում այս անուններով։
        Կայքն ինքը կգտնի և կփոխարինի ժամանակավոր նկարները։
        Եթե ֆայլը չկա, կմնա գեղեցիկ placeholder-ը — ոչինչ չի կոտրվի։

        Just drop your photos into img/ with these names. The site
        detects them and swaps them in. If a file is missing, the
        placeholder stays — nothing breaks.

        Ուրիշ անուն կամ ձևաչափ (.png, .jpeg, .webp) եք ուզում՝
        պարզապես փոխեք ուղին այստեղ։
     ----------------------------------------------------------- */
  photos: {
    hero:   'img/hero.jpg',      // գլխավոր էկրան — ուղղահայաց, min 1200×1500
    story1: 'img/story-1.jpg',   // հրավերի բաժին — 4:5
    story2: 'img/story-2.jpg'    // հրավերի բաժին — 4:5
  }
};

export const EXAMPLES = {
  'example-dana': {
    meta: {
      displayName: 'Dana Cohen',
      birthday: '2026-04-22',
      photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rapunzel&backgroundColor=b6e3f4',
      pin: '1234',
      tagline: 'Turning 30! Help me celebrate',
      adminTokenHash: '0000000000000000000000000000000000000000000000000000000000000000',
      createdAt: Date.now(),
      isExample: true
    },
    gifts: {
      g1: {
        name: 'Harry Potter Box Set (Hebrew edition)',
        link: 'https://www.steimatzky.co.il/%D7%A1%D7%A4%D7%A8%D7%99%D7%9D/sub-cat-popular-series/harry-potter',
        price: '~180 ILS',
        status: 'claimed',
        order: 1,
        addedBy: 'admin',
        claims: {
          c1: {
            name: 'Yoni',
            portion: 'full',
            customNote: '',
            message: 'Happy 30th! Enjoy reading on the beach',
            claimedAt: Date.now() - 86400000
          }
        }
      },
      g2: {
        name: 'Cozy pajama set from Fox',
        link: 'https://fox.co.il/collections/%D7%A4%D7%99%D7%92%D7%9E%D7%95%D7%AA-%D7%A0%D7%A9%D7%99%D7%9D',
        price: '~200 ILS',
        status: 'partial',
        order: 2,
        addedBy: 'admin',
        claims: {
          c2: {
            name: 'Maya',
            portion: 'half',
            customNote: "I'll cover 100 ILS",
            message: 'Love you!',
            claimedAt: Date.now() - 43200000
          }
        }
      },
      g3: {
        name: '2x Movie tickets - Planet Cinema (Ayalon)',
        link: 'https://www.planetcinema.co.il/cinemas/ayalon/1025',
        price: '~80 ILS',
        status: 'unclaimed',
        order: 3,
        addedBy: 'admin',
        claims: {}
      },
      g4: {
        name: 'Yoga mat from Decathlon Givat Shmuel',
        link: 'https://www.decathlon.co.il/6413-%D7%9E%D7%96%D7%A8%D7%A0%D7%99-%D7%99%D7%95%D7%92%D7%94',
        price: '~120 ILS',
        status: 'unclaimed',
        order: 4,
        addedBy: 'admin',
        claims: {}
      },
      g5: {
        name: 'A good cookbook from Tzomet Sfarim',
        link: 'https://www.booknet.co.il/%D7%A7%D7%98%D7%92%D7%95%D7%A8%D7%99%D7%95%D7%AA/%D7%A1%D7%A4%D7%A8%D7%99-%D7%91%D7%99%D7%A9%D7%95%D7%9C-%D7%A8%D7%9B%D7%94-5006',
        price: '',
        status: 'suggested',
        order: 5,
        addedBy: 'guest:Tali',
        claims: {}
      }
    }
  }
};

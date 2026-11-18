window.SITE = {
  nome: "withGrowth",

  whatsapp: {
    numero: "966115001518", // digits only, with country code
    mensagem: "Hi withGrowth, I'd like to talk to a growth consultant.",
  },

  contato: {
    email: "hello@withgrowth.io",
    // Optional: Web3Forms key (https://web3forms.com). Empty = FormSubmit.
    web3formsChave: "",
    assunto: "New contact from withgrowth.io",
  },

  frames: {
    total: 384,
    mobileTotal: 384, // portrait 9:16 film for phones, 16 fps, 720px wide
    desktop: "assets/frames/desktop/f_{n}.webp?v=15",
    mobile: "assets/frames/mobile/f_{n}.webp?v=16",
    // Film script, both formats: act 1 (threads merge and the light reaches the city) = hero,
    // act 2 (the city brightens) = About + Services,
    // act 3 (night turns to morning) = Process to Contact.
    roteiro: [
      { em: "#about", filme: 1 / 3 },
      { em: "#process", filme: 2 / 3 },
    ],
    mobileRoteiro: [
      { em: "#about", filme: 1 / 3 },
      { em: "#process", filme: 2 / 3 },
    ],
  },
};

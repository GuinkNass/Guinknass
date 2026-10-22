/**
 * CONFIGURAÇÃO CENTRAL - GUINKNASS SITE OFICIAL
 * Este arquivo concentra todos os dados comerciais, obras, referências de mídia
 * e parâmetros de integração (WhatsApp, Google Forms, Google Sheets e E-mail).
 */

const GUINKNASS_CONFIG = {
  artist: {
    name: "GuinkNass",
    role: "Artista Visual & Tatuador",
    experienceYearsArt: 20,
    experienceYearsTattoo: 13,
    experienceText: "Mais de 20 anos de trajetória como artista visual e mais de 13 anos dedicados à tatuagem.",
    heroSubtitle: "Mais de 20 anos de trajetória artística. Mais de 13 anos transformando ideias em tatuagens autorais.",
    whatsappNumber: "+55 11 99580-2338",
    whatsappClean: "5511995802338",
    whatsappBaseUrl: "https://wa.me/5511995802338"
  },

  // Configurações de Integrações Externas
  integrations: {
    googleSheetsBudgetUrl: "https://docs.google.com/spreadsheets/d/1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE/edit?usp=sharing",
    googleSheetsBudgetSpreadsheetId: "1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE",
    googleSheetsBudgetWebhookUrl: "https://script.google.com/macros/s/AKfycbznrzPLyTQ0BA23BXwhcXq0R1tJeMojvCK7nOAPOVHrW0XAPR3eO56ShDnuVM-XXZgu3Q/exec",

    googleSheetsAnamneseUrl: "https://docs.google.com/spreadsheets/d/1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI/edit?usp=sharing",
    googleSheetsAnamneseSpreadsheetId: "1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI",
    googleSheetsAnamneseWebhookUrl: "https://script.google.com/macros/s/AKfycbxVTHimb55J8e1O1RRGFi4nh3uRipRWiKqRWAiYWDTmw5WYzLo84PnTzpx3I5abvy2U1g/exec",

    googleFormsBudgetUrl: "",
    googleFormsAnamneseUrl: "",
    emailServiceEndpoint: "",
    enableLocalFallback: true
  },

  // Templates de mensagens para WhatsApp
  whatsappMessages: {
    budget: "Olá, GuinkNass! Gostaria de solicitar um orçamento para uma tatuagem autoral.",
    general: "Olá, GuinkNass! Gostaria de tirar algumas dúvidas sobre o seu trabalho artístico.",
    quadroInterest: (quadroTitle, price) => {
      let msg = 'Olá, GuinkNass! Tenho interesse em comprar a obra "' + quadroTitle + '".';
      if (price && price !== "Sob consulta") {
        msg += ' (Valor: ' + price + ')';
      }
      msg += " Gostaria de saber mais sobre disponibilidade, frete e pagamento.";
      return msg;
    },
    quadroQuestions: (quadroTitle) => {
      return 'Olá, GuinkNass! Tenho dúvidas sobre a obra "' + quadroTitle + '". Gostaria de saber mais detalhes técnicos sobre o quadro.';
    },
    budgetSummary: (data) => {
      let text = '*SOLICITAÇÃO DE ORÇAMENTO - TATUAGEM*\n';
      text += '*Nome:* ' + (data.name || '') + '\n';
      text += '*WhatsApp:* ' + (data.phone || '') + '\n';
      text += '*E-mail:* ' + (data.email || '') + '\n';
      if (data.city) text += '*Cidade/UF:* ' + data.city + '\n';
      text += '*Local do corpo:* ' + (data.bodyLocation || '') + '\n';
      text += '*Tamanho aprox.:* ' + (data.sizeCm ? data.sizeCm + ' cm' : 'A combinar') + '\n';
      text += '*Cores:* ' + (data.colorPreference || 'Preto e Cinza') + '\n';
      if (data.style) text += '*Estilo:* ' + data.style + '\n';
      text += '*Descrição da ideia:*\n' + (data.ideaDescription || '') + '\n';
      if (data.meaning) text += '*Significado/Contexto:*\n' + data.meaning + '\n';
      if (data.notes) text += '*Observações:*\n' + data.notes + '\n';
      text += '\n_Enviado pelo formulário oficial de orçamentos do site GuinkNass._';
      return text;
    }
  },

  estudos: {
    isPublished: true,
    requireAccessKey: false,
    accessKey: "guinknass"
  },

  // Dados dos Quadros Físicos (Galeria)
  quadros: [
  {
    "id": "quadro-1",
    "title": "Quadro 01 - O Alquimista",
    "image": "Portifolio/quadros/quadro 1.png",
    "video": "Portifolio/quadros/videopintandoquadro1.mp4",
    "hasVideo": true,
    "technique": "Acrílica e óleo sobre tela",
    "materials": "Tintas artísticas profissionais, verniz fosco de proteção",
    "dimensions": "Dimensões sob consulta",
    "year": "2024",
    "price": "Sob consulta",
    "availability": "Disponível",
    "statusBadge": "available",
    "description": "Obra autoral figurativa e surrealista. Uma profunda exploração de texturas, contrastes de luz e sombra, expressões faciais densas e elementos narrativos instigantes.",
    "details": [
      "Obra original e exclusiva pintada à mão",
      "Acompanha certificado de autenticidade assinado pelo artista",
      "Vídeo do processo de criação registrado em ateliê"
    ]
  },
  {
    "id": "quadro-2",
    "title": "Quadro 02 - A Ilha Flutuante & Ghost",
    "image": "Portifolio/quadros/quadro 2.png",
    "video": "Portifolio/quadros/Videopintandoquadro2.mp4",
    "hasVideo": true,
    "technique": "Técnica mista sobre tela",
    "materials": "Tinta acrílica, aerografia e acabamento a óleo",
    "dimensions": "Dimensões sob consulta",
    "year": "2024",
    "price": "Sob consulta",
    "availability": "Disponível",
    "statusBadge": "available",
    "description": "Pintura surrealista vertical retratando uma figura com escafandro em ilha flutuante, um abismo oceânico com ruínas e a icônica baleia com castelo ('Ghost') suspensa nos céus.",
    "details": [
      "Composição vertical de forte impacto visual",
      "Técnica apurada de profundidade atmosférica e marítima",
      "Processo de pintura registrado em vídeo"
    ]
  }
],

  // Rascunhos e Estudos Artísticos
  estudosList: [
  {
    "id": 1,
    "file": "Portifolio/quadros/aquaerla.jpg",
    "title": "Estudo em Aquarela",
    "subtitle": "Pesquisa de transparências, fluidez e luz"
  },
  {
    "id": 2,
    "file": "Portifolio/quadros/fine colorido.jpg",
    "title": "Fine Art Colorido",
    "subtitle": "Harmonia cromática e contrastes finos"
  },
  {
    "id": 3,
    "file": "Portifolio/quadros/guache.jpg",
    "title": "Estudo em Guache",
    "subtitle": "Opacidade e sobreposição tonal"
  },
  {
    "id": 4,
    "file": "Portifolio/quadros/lapis colorido.jpg",
    "title": "Lápis de Cor Artístico",
    "subtitle": "Técnica apurada de gradiente e textura"
  },
  {
    "id": 5,
    "file": "Portifolio/quadros/laspis grafite.jpg",
    "title": "Lápis Grafite & Sombra",
    "subtitle": "Estudo anatômico e profundidade de cinzas"
  },
  {
    "id": 6,
    "file": "Portifolio/quadros/pastel seco.jpg",
    "title": "Pastel Seco I",
    "subtitle": "Textura aveludada e transições suaves"
  },
  {
    "id": 7,
    "file": "Portifolio/quadros/pastel seco 2.jpg",
    "title": "Pastel Seco II",
    "subtitle": "Contraste dramático de iluminação"
  },
  {
    "id": 8,
    "file": "Portifolio/quadros/pastel seco 3.jpg",
    "title": "Pastel Seco III",
    "subtitle": "Composição de expressão figurativa"
  },
  {
    "id": 9,
    "file": "Portifolio/quadros/pastel seco 4.jpg",
    "title": "Pastel Seco IV",
    "subtitle": "Pesquisa de volume e formas"
  },
  {
    "id": 10,
    "file": "Portifolio/quadros/pastel sexo 5.jpg",
    "title": "Pastel Seco V",
    "subtitle": "Estudo gestual e sombras densas"
  },
  {
    "id": 11,
    "file": "Portifolio/quadros/pastel seco 6.jpg",
    "title": "Pastel Seco VI",
    "subtitle": "Pesquisa de luz e atmosfera"
  },
  {
    "id": 12,
    "file": "Portifolio/quadros/tinta oleo.jpg",
    "title": "Pintura a Óleo I",
    "subtitle": "Processo pictórico clássico sobre suporte"
  },
  {
    "id": 13,
    "file": "Portifolio/quadros/tinta oleo 2.jpg",
    "title": "Pintura a Óleo II",
    "subtitle": "Camadas densas e riqueza textural"
  }
],

  // Carrossel de Destaques da Página Inicial
  featuredCarousel: [
  {
    "file": "Portifolio/foto tattoo/asas (fechamento, preto e branco, freehand, realismo)).jpg",
    "title": "Asas Anatômicas (Costas)",
    "tag": "Fechamento / Preto e Cinza"
  },
  {
    "file": "Portifolio/foto tattoo/walter white (realismo, portrait, colorido).jpg",
    "title": "Walter White — Breaking Bad",
    "tag": "Realismo & Portrait Colorido"
  },
  {
    "file": "Portifolio/foto tattoo/Coruja (Realismo, colorido).jpg",
    "title": "Coruja Guardiã",
    "tag": "Realismo Colorido"
  },
  {
    "file": "Portifolio/foto tattoo/leao de juda (realismo, preto e branco).webp",
    "title": "Leão de Judá",
    "tag": "Preto e Cinza / Sombras"
  },
  {
    "file": "Portifolio/foto tattoo/Autoral convencao (realismo, colorido).jpg",
    "title": "Arte Autoral de Convenção",
    "tag": "Projeto Autoral"
  },
  {
    "file": "Portifolio/foto tattoo/tigre (realismo, preto e branco).jpg",
    "title": "Tigre Predador",
    "tag": "Realismo & Preto e Cinza"
  },
  {
    "file": "Portifolio/foto tattoo/Projeto original (realismo, colorido, freehand).jpg",
    "title": "Projeto Original Freehand",
    "tag": "Freehand Autoral"
  },
  {
    "file": "Portifolio/foto tattoo/vikings (realismo, preto e branco, portait).jpg",
    "title": "Ragnar — Vikings Portrait",
    "tag": "Portrait em Preto e Cinza"
  }
],

  // Portfólio Completo de Tatuagens (58 Obras catalogadas com títulos e categorias)
  tattoos: [
  {
    "id": 1,
    "file": "Portifolio/foto tattoo/abelha (realismo, preto e branco, mini).jpg",
    "title": "Abelha em Realismo",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza",
      "mini"
    ]
  },
  {
    "id": 2,
    "file": "Portifolio/foto tattoo/abstrato (realismo, colorido).webp",
    "title": "Composição Abstrata Autoral",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 3,
    "file": "Portifolio/foto tattoo/anubis (realismo, colorido, preto e branco).webp",
    "title": "Anúbis Mitológico",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "colorido",
      "pretoecinza"
    ]
  },
  {
    "id": 4,
    "file": "Portifolio/foto tattoo/asas (fechamento, preto e branco, freehand, realismo)).jpg",
    "title": "Asas Anatômicas (Fechamento de Costas)",
    "category": "fechamento",
    "tags": [
      "fechamento",
      "pretoecinza",
      "freehand",
      "realismo"
    ]
  },
  {
    "id": 5,
    "file": "Portifolio/foto tattoo/Autoral convencao (realismo, colorido).jpg",
    "title": "Arte Autoral de Convenção",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 6,
    "file": "Portifolio/foto tattoo/batman (realismo, preto e branco).jpg",
    "title": "Batman Dark Knight",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 7,
    "file": "Portifolio/foto tattoo/bdsm (raalismo, protrait, colorido).webp",
    "title": "Expressão BDSM Figurativa",
    "category": "portrait",
    "tags": [
      "realismo",
      "portrait",
      "colorido"
    ]
  },
  {
    "id": 8,
    "file": "Portifolio/foto tattoo/bird watercolor (realsimo, colorido, fechamento).jpg",
    "title": "Pássaro em Watercolor Floral",
    "category": "fechamento",
    "tags": [
      "realismo",
      "colorido",
      "fechamento"
    ]
  },
  {
    "id": 9,
    "file": "Portifolio/foto tattoo/bolo (realismo, colorido, mini)_.jpg",
    "title": "Bolo (realismo, colorido, mini)_",
    "category": "autorais",
    "tags": []
  },
  {
    "id": 10,
    "file": "Portifolio/foto tattoo/capa de album (realismo, colorido).jpg",
    "title": "Capa de Álbum Autoral",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 11,
    "file": "Portifolio/foto tattoo/cat portrait (realismo, preto e branco, mini, portrait).jpg",
    "title": "Portrait Felino (Cat)",
    "category": "portrait",
    "tags": [
      "realismo",
      "pretoecinza",
      "mini",
      "portrait"
    ]
  },
  {
    "id": 12,
    "file": "Portifolio/foto tattoo/catrina (colorido, realismo).jpg",
    "title": "La Catrina Mexicana em Cores",
    "category": "colorido",
    "tags": [
      "colorido",
      "realismo"
    ]
  },
  {
    "id": 13,
    "file": "Portifolio/foto tattoo/cobetura(realismo, colorido).webp",
    "title": "Cobertura Artística (Cover-Up)",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 14,
    "file": "Portifolio/foto tattoo/cobra (realismo, preto e branco).jpg",
    "title": "Serpente em Preto e Cinza",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 15,
    "file": "Portifolio/foto tattoo/Coruja (Realismo, colorido).jpg",
    "title": "Coruja Guardiã em Cores",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 16,
    "file": "Portifolio/foto tattoo/dog portrait ( realismo, colorido, mini).jpg",
    "title": "Portrait Canino Realista (Pet Dog)",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "mini"
    ]
  },
  {
    "id": 17,
    "file": "Portifolio/foto tattoo/formhell 7 (relaismo, fromhell, preto e branco, fechamento).jpg",
    "title": "From Hell Series — Obra VII",
    "category": "fechamento",
    "tags": [
      "realismo",
      "fromhell",
      "pretoecinza",
      "fechamento"
    ]
  },
  {
    "id": 18,
    "file": "Portifolio/foto tattoo/frohell (realimo, preto e branco, fechamneto).jpg",
    "title": "From Hell Series — Obra I",
    "category": "fechamento",
    "tags": [
      "realismo",
      "pretoecinza",
      "fechamento"
    ]
  },
  {
    "id": 19,
    "file": "Portifolio/foto tattoo/fromhell 2 (realismo, preto e branco, fechamento).jpg",
    "title": "From Hell Series — Obra II",
    "category": "fechamento",
    "tags": [
      "realismo",
      "pretoecinza",
      "fechamento"
    ]
  },
  {
    "id": 20,
    "file": "Portifolio/foto tattoo/fromhell 3 (realismo, fromhell, fechamento, preto e branco).jpg",
    "title": "From Hell Series — Obra III",
    "category": "fechamento",
    "tags": [
      "realismo",
      "fromhell",
      "fechamento",
      "pretoecinza"
    ]
  },
  {
    "id": 21,
    "file": "Portifolio/foto tattoo/fromhell 4 (realismo,fromhell, preto e branco).jpg",
    "title": "From Hell Series — Obra IV",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "fromhell",
      "pretoecinza"
    ]
  },
  {
    "id": 22,
    "file": "Portifolio/foto tattoo/fromhell 5( realismo, preto e branco, from hell, ).jpg",
    "title": "From Hell Series — Obra V",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza",
      "fromhell"
    ]
  },
  {
    "id": 23,
    "file": "Portifolio/foto tattoo/fromhell 6 ( relaismo, preto e branco, formhell, fechamentyo).jpg",
    "title": "From Hell Series — Obra VI",
    "category": "fechamento",
    "tags": [
      "realismo",
      "pretoecinza",
      "fromhell",
      "fechamento"
    ]
  },
  {
    "id": 24,
    "file": "Portifolio/foto tattoo/futuro deus (realismo, colorido).jpg",
    "title": "Futuro Deus — Criação Autoral",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 25,
    "file": "Portifolio/foto tattoo/game of thrones (realismo, colorido).jpg",
    "title": "Game of Thrones Tribute",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 26,
    "file": "Portifolio/foto tattoo/god of war (realismo, cartom, colorido).jpg",
    "title": "Kratos — God of War em Cores",
    "category": "colorido",
    "tags": [
      "realismo",
      "geek",
      "colorido"
    ]
  },
  {
    "id": 27,
    "file": "Portifolio/foto tattoo/homem aranha (realimso, colorido, cartom).webp",
    "title": "Homem-Aranha Comic Art",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "geek"
    ]
  },
  {
    "id": 28,
    "file": "Portifolio/foto tattoo/homem aranha grande (realismo, colorido, cartom).jpg",
    "title": "Homem-Aranha Fechamento Corporal",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "geek"
    ]
  },
  {
    "id": 29,
    "file": "Portifolio/foto tattoo/jesus(realismo, preto e branco, portrait).jpg",
    "title": "Jesus Cristo em Preto e Cinza",
    "category": "portrait",
    "tags": [
      "realismo",
      "pretoecinza",
      "portrait"
    ]
  },
  {
    "id": 30,
    "file": "Portifolio/foto tattoo/leao 2 (realismo, preto e branco).jpg",
    "title": "Leão Majestoso Realista",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 31,
    "file": "Portifolio/foto tattoo/leao de juda (realismo, preto e branco).webp",
    "title": "Leão de Judá em Sombras",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 32,
    "file": "Portifolio/foto tattoo/leoa 3 (realismo, preto e branco).jpg",
    "title": "Leoa e Proteção Familiar",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 33,
    "file": "Portifolio/foto tattoo/mario nintendo (cartom, colorido).jpg",
    "title": "Super Mario Geek Art",
    "category": "colorido",
    "tags": [
      "geek",
      "colorido"
    ]
  },
  {
    "id": 34,
    "file": "Portifolio/foto tattoo/menina (realismo, colorido, portrait).webp",
    "title": "Menina Figurativa em Cores",
    "category": "portrait",
    "tags": [
      "realismo",
      "colorido",
      "portrait"
    ]
  },
  {
    "id": 35,
    "file": "Portifolio/foto tattoo/menino (realismo, portrait, mini, cartom, preto e branco).jpg",
    "title": "Menino Portrait Delicado",
    "category": "portrait",
    "tags": [
      "realismo",
      "portrait",
      "mini",
      "geek",
      "pretoecinza"
    ]
  },
  {
    "id": 36,
    "file": "Portifolio/foto tattoo/micro portrait (realismo, colorido, portrait).jpg",
    "title": "Micro Portrait Realista",
    "category": "portrait",
    "tags": [
      "realismo",
      "colorido",
      "portrait"
    ]
  },
  {
    "id": 37,
    "file": "Portifolio/foto tattoo/mini portrait 2 (realismo, colorido).jpg",
    "title": "Mini Portrait Autoral",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 38,
    "file": "Portifolio/foto tattoo/mulher maravilhsa ( realismo, colorido).jpg",
    "title": "Mulher-Maravilha DC Comics",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 39,
    "file": "Portifolio/foto tattoo/naruto (cartom, preto e branco).jpg",
    "title": "Naruto Uzumaki Geek Art",
    "category": "pretoecinza",
    "tags": [
      "geek",
      "pretoecinza"
    ]
  },
  {
    "id": 40,
    "file": "Portifolio/foto tattoo/nirvana (realismo, colorido).webp",
    "title": "Nirvana — In Utero Tribute",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 41,
    "file": "Portifolio/foto tattoo/passaro (colorido, realimso).jpg",
    "title": "Pássaro da Floresta em Cores",
    "category": "colorido",
    "tags": [
      "colorido",
      "realismo"
    ]
  },
  {
    "id": 42,
    "file": "Portifolio/foto tattoo/pata de pet (realismo, colorido, mini).webp",
    "title": "Pata Pet Delicada com Aquarela",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "mini"
    ]
  },
  {
    "id": 43,
    "file": "Portifolio/foto tattoo/pet protrait 2 (realismo, colorido, mini).jpg",
    "title": "Portrait Canino Realista II",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "mini"
    ]
  },
  {
    "id": 44,
    "file": "Portifolio/foto tattoo/poderoso chefao (preto e branco, realismo).jpg",
    "title": "O Poderoso Chefão (The Godfather)",
    "category": "pretoecinza",
    "tags": [
      "pretoecinza",
      "realismo"
    ]
  },
  {
    "id": 45,
    "file": "Portifolio/foto tattoo/portrait convensao tattoo week 2016 (realismo, colorido, portrait).jpg",
    "title": "Portrait Tattoo Week 2016",
    "category": "portrait",
    "tags": [
      "realismo",
      "colorido",
      "portrait"
    ]
  },
  {
    "id": 46,
    "file": "Portifolio/foto tattoo/Portrait Pet (Realismo,Colorido,mini).jpg",
    "title": "Portrait Pet Realista III",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "mini"
    ]
  },
  {
    "id": 47,
    "file": "Portifolio/foto tattoo/Projeto original (realismo, colorido, freehand).jpg",
    "title": "Projeto Original Freehand Autoral I",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "freehand"
    ]
  },
  {
    "id": 48,
    "file": "Portifolio/foto tattoo/Projeto Original 2 (Realismo, Colorido, freehand).jpg",
    "title": "Projeto Original Freehand Autoral II",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido",
      "freehand"
    ]
  },
  {
    "id": 49,
    "file": "Portifolio/foto tattoo/raposa (realismo, colorido).jpg",
    "title": "Raposa da Natureza em Cores",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 50,
    "file": "Portifolio/foto tattoo/relogio (realismo, preto e branco).jpg",
    "title": "Relógio do Tempo e Rosas",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 51,
    "file": "Portifolio/foto tattoo/rosas (realismo, colorido).jpg",
    "title": "Rosas em Realismo Colorido",
    "category": "colorido",
    "tags": [
      "realismo",
      "colorido"
    ]
  },
  {
    "id": 52,
    "file": "Portifolio/foto tattoo/senhora portrait (realismo, preto e branco, portrait).jpg",
    "title": "Portrait Expressivo Senhora",
    "category": "portrait",
    "tags": [
      "realismo",
      "pretoecinza",
      "portrait"
    ]
  },
  {
    "id": 53,
    "file": "Portifolio/foto tattoo/soldado (preto e branco, realismo).jpg",
    "title": "Soldado de Batalha em Sombras",
    "category": "pretoecinza",
    "tags": [
      "pretoecinza",
      "realismo"
    ]
  },
  {
    "id": 54,
    "file": "Portifolio/foto tattoo/tigre (realismo, preto e branco).jpg",
    "title": "Tigre Predador em Preto e Cinza",
    "category": "pretoecinza",
    "tags": [
      "realismo",
      "pretoecinza"
    ]
  },
  {
    "id": 55,
    "file": "Portifolio/foto tattoo/vikings (realismo, preto e branco, portait).jpg",
    "title": "Ragnar — Vikings Portrait",
    "category": "portrait",
    "tags": [
      "realismo",
      "pretoecinza",
      "portrait"
    ]
  },
  {
    "id": 56,
    "file": "Portifolio/foto tattoo/walter white (realismo, portrait, colorido).jpg",
    "title": "Walter White — Breaking Bad",
    "category": "portrait",
    "tags": [
      "realismo",
      "portrait",
      "colorido"
    ]
  },
  {
    "id": 57,
    "file": "Portifolio/foto tattoo/watercolor (realismo, colorido, fechamento).jpg",
    "title": "Composição Floral em Watercolor",
    "category": "fechamento",
    "tags": [
      "realismo",
      "colorido",
      "fechamento"
    ]
  },
  {
    "id": 58,
    "file": "Portifolio/foto tattoo/woman (realismo, colorido, fechamento).jpg",
    "title": "Figura Feminina em Cores",
    "category": "fechamento",
    "tags": [
      "realismo",
      "colorido",
      "fechamento"
    ]
  }
]
};

if (typeof window !== "undefined") {
  window.GUINKNASS_CONFIG = GUINKNASS_CONFIG;
}

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
    // Planilha Oficial de Orçamentos (GuinkNass)
    googleSheetsBudgetUrl: "https://docs.google.com/spreadsheets/d/1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE/edit?usp=sharing",
    googleSheetsBudgetSpreadsheetId: "1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE",
    googleSheetsBudgetWebhookUrl: "https://script.google.com/macros/s/AKfycbznrzPLyTQ0BA23BXwhcXq0R1tJeMojvCK7nOAPOVHrW0XAPR3eO56ShDnuVM-XXZgu3Q/exec",

    // Planilha Oficial de Anamnese (GuinkNass - Restrita)
    googleSheetsAnamneseUrl: "https://docs.google.com/spreadsheets/d/1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI/edit?usp=sharing",
    googleSheetsAnamneseSpreadsheetId: "1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI",
    googleSheetsAnamneseWebhookUrl: "https://script.google.com/macros/s/AKfycbxVTHimb55J8e1O1RRGFi4nh3uRipRWiKqRWAiYWDTmw5WYzLo84PnTzpx3I5abvy2U1g/exec",

    // URL ou ID do Google Forms (caso opte pelo formulário externo ou fallback)
    googleFormsBudgetUrl: "",
    googleFormsAnamneseUrl: "",

    // Endpoint para automação de e-mails (ex: Formspree, EmailJS ou backend proprietário)
    emailServiceEndpoint: "",
    
    // Modo de contingência / fallback: se o webhook não estiver configurado, salva localmente e permite envio via WhatsApp
    enableLocalFallback: true
  },

  // Templates de mensagens para WhatsApp
  whatsappMessages: {
    budget: "Olá, GuinkNass! Gostaria de solicitar um orçamento para uma tatuagem autoral.",
    general: "Olá, GuinkNass! Gostaria de tirar algumas dúvidas sobre o seu trabalho artístico.",
    quadroInterest: (quadroTitle, price) => {
      let msg = `Olá, GuinkNass! Tenho interesse em comprar a obra "${quadroTitle}".`;
      if (price && price !== "Sob consulta") {
        msg += ` (Valor: ${price})`;
      }
      msg += " Gostaria de saber mais sobre disponibilidade, frete e pagamento.";
      return msg;
    },
    quadroQuestions: (quadroTitle) => {
      return `Olá, GuinkNass! Tenho dúvidas sobre a obra "${quadroTitle}". Gostaria de saber mais detalhes técnicos sobre o quadro.`;
    },
    budgetSummary: (data) => {
      let text = `*SOLICITAÇÃO DE ORÇAMENTO - TATUAGEM*\n`;
      text += `*Nome:* ${data.name || ''}\n`;
      text += `*WhatsApp:* ${data.phone || ''}\n`;
      text += `*E-mail:* ${data.email || ''}\n`;
      if (data.city) text += `*Cidade/UF:* ${data.city}\n`;
      text += `*Local do corpo:* ${data.bodyLocation || ''}\n`;
      text += `*Tamanho aprox.:* ${data.sizeCm ? data.sizeCm + ' cm' : 'A combinar'}\n`;
      text += `*Cores:* ${data.colorPreference || 'Preto e Cinza'}\n`;
      if (data.style) text += `*Estilo:* ${data.style}\n`;
      text += `*Descrição da ideia:*\n${data.ideaDescription || ''}\n`;
      if (data.meaning) text += `*Significado/Contexto:*\n${data.meaning}\n`;
      if (data.notes) text += `*Observações:*\n${data.notes}\n`;
      text += `\n_Enviado pelo formulário oficial de orçamentos do site GuinkNass._`;
      return text;
    }
  },

  // Controle de publicação da Galeria de Rascunhos e Estudos
  estudos: {
    isPublished: true, // O artista pode alternar para false se desejar manter a galeria privada
    requireAccessKey: false,
    accessKey: "guinknass"
  },

  // Dados dos Quadros Físicos (Galeria)
  quadros: [
    {
      id: "quadro-1",
      title: "Quadro 01 - O Alquimista",
      image: "Portifolio/quadro 1.png",
      video: "Portifolio/videopintandoquadro1.mp4",
      hasVideo: true,
      technique: "Acrílica e óleo sobre tela",
      materials: "Tintas artísticas profissionais, verniz fosco de proteção",
      dimensions: "Dimensões sob consulta",
      year: "2024",
      price: "Sob consulta",
      availability: "Disponível", // "Disponível", "Reservado", "Vendido"
      statusBadge: "available",
      description: "Obra autoral figurativa e surrealista. Uma profunda exploração de texturas, contrastes de luz e sombra, expressões faciais densas e elementos narrativos instigantes.",
      details: [
        "Obra original e exclusiva pintada à mão",
        "Acompanha certificado de autenticidade assinado pelo artista",
        "Vídeo do processo de criação registrado em ateliê"
      ]
    },
    {
      id: "quadro-2",
      title: "Quadro 02 - A Ilha Flutuante & Ghost",
      image: "Portifolio/quadro 2.png",
      video: "Portifolio/Videopintandoquadro2.mp4",
      hasVideo: true,
      technique: "Técnica mista sobre tela",
      materials: "Tinta acrílica, aerografia e acabamento a óleo",
      dimensions: "Dimensões sob consulta",
      year: "2024",
      price: "Sob consulta",
      availability: "Disponível",
      statusBadge: "available",
      description: "Pintura surrealista vertical retratando uma figura com escafandro em ilha flutuante, um abismo oceânico com ruínas e a icônica baleia com castelo ('Ghost') suspensa nos céus.",
      details: [
        "Composição vertical de forte impacto visual",
        "Técnica apurada de profundidade atmosférica e marítima",
        "Processo de pintura registrado em vídeo"
      ]
    }
  ],

  // Rascunhos e Estudos Artísticos (Arte 1 até Arte 13)
  estudosList: [
    { id: 1, file: "Portifolio/arte1.jpg", title: "Estudo 01", subtitle: "Processo pictórico em preto e cinza" },
    { id: 2, file: "Portifolio/arte2.jpg", title: "Estudo 02", subtitle: "Composição anatômica e sombras" },
    { id: 3, file: "Portifolio/arte3.jpg", title: "Estudo 03", subtitle: "Pesquisa de texturas e contrastes" },
    { id: 4, file: "Portifolio/arte4.jpg", title: "Estudo 04", subtitle: "Estudo de iluminação dramática" },
    { id: 5, file: "Portifolio/arte5.jpg", title: "Estudo 05", subtitle: "Exploração de formas orgânicas" },
    { id: 6, file: "Portifolio/arte6.jpg", title: "Estudo 06", subtitle: "Esboço de figura e expressão" },
    { id: 7, file: "Portifolio/arte7.jpg", title: "Estudo 07", subtitle: "Desenvolvimento linear e hachuras" },
    { id: 8, file: "Portifolio/arte8.jpg", title: "Estudo 08", subtitle: "Pesquisa visual contemporânea" },
    { id: 9, file: "Portifolio/arte9.jpg", title: "Estudo 09", subtitle: "Estudo de proporção e volume" },
    { id: 10, file: "Portifolio/arte10.jpg", title: "Estudo 10", subtitle: "Composição e equilíbrio visual" },
    { id: 11, file: "Portifolio/arte11.jpg", title: "Estudo 11", subtitle: "Detalhes e texturas de superfície" },
    { id: 12, file: "Portifolio/arte12.jpg", title: "Estudo 12", subtitle: "Estudo de caráter e simbolismo" },
    { id: 13, file: "Portifolio/arte13.jpg", title: "Estudo 13", subtitle: "Processo de criação autoral" }
  ],

  // Carrossel de Destaques da Página Inicial
  featuredCarousel: [
    { file: "Portifolio/619595456_18090306311019603_5119368485686912011_n.jpg", title: "Asas e Detalhes Anatômicos", tag: "Costas Inteiras / Preto e Cinza" },
    { file: "Portifolio/652913473_18135876922507866_148223513842771613_n.jpg", title: "Composição Escultórica", tag: "Arte Autoral" },
    { file: "Portifolio/459198171_18455803027029439_45768444753459029_n.jpg", title: "Texturas e Profundidade", tag: "Realismo e Sombra" },
    { file: "Portifolio/636736293_18567921427059652_5337885739071783445_n.jpg", title: "Expressão Figurativa", tag: "Autoral" },
    { file: "Portifolio/626627208_18344012395233696_5965385203013725302_n.jpg", title: "Composição Fechamento", tag: "Contraste Alto" },
    { file: "Portifolio/616517090_17986996754927794_398199431995173497_n.webp", title: "Trabalho Detalhado", tag: "Arte Visual & Pele" },
    { file: "Portifolio/481318067_18487122331029439_2367846724219285111_n.jpg", title: "Fluidez e Movimento", tag: "Projeto Exclusivo" },
    { file: "Portifolio/506036287_18507716902029439_2243392264806245793_n.jpg", title: "Sombra Densa e Luz", tag: "Autoral" }
  ],

  // Portfólio Completo de Tatuagens (Imagens reais em alta resolução)
  tattoos: [
    { id: 1, file: "Portifolio/619595456_18090306311019603_5119368485686912011_n.jpg", title: "Asas em Realismo e Textura", category: "costas" },
    { id: 2, file: "Portifolio/652913473_18135876922507866_148223513842771613_n.jpg", title: "Obra Autoral em Preto e Cinza", category: "autorais" },
    { id: 3, file: "Portifolio/459198171_18455803027029439_45768444753459029_n.jpg", title: "Composição Escultórica e Sombra", category: "realismo" },
    { id: 4, file: "Portifolio/459246378_18455803015029439_5386372987761598091_n.jpg", title: "Detalhe de Aplicação e Contraste", category: "detalhes" },
    { id: 5, file: "Portifolio/481318067_18487122331029439_2367846724219285111_n.jpg", title: "Projeto Exclusivo Personalizado", category: "autorais" },
    { id: 6, file: "Portifolio/481625855_18487122304029439_8428758647720124302_n.jpg", title: "Harmonia e Enquadramento Corporal", category: "fechamento" },
    { id: 7, file: "Portifolio/481668713_18487474273029439_6902697669021690816_n.jpg", title: "Texturas Finas e Gradiente", category: "detalhes" },
    { id: 8, file: "Portifolio/481876372_18487122316029439_8755283413526773861_n.jpg", title: "Equilíbrio de Luz e Sombra", category: "pretoecinza" },
    { id: 9, file: "Portifolio/506036287_18507716902029439_2243392264806245793_n.jpg", title: "Expressão Artística Autoral", category: "autorais" },
    { id: 10, file: "Portifolio/616517090_17986996754927794_398199431995173497_n.webp", title: "Definição e Nitidez de Traço", category: "detalhes" },
    { id: 11, file: "Portifolio/617541029_18116990797600444_254157364112716017_n.jpg", title: "Composição Dinâmica", category: "autorais" },
    { id: 12, file: "Portifolio/618641331_17988737429762673_5393846432585008965_n.webp", title: "Preto Intenso e Sombreamento Suave", category: "pretoecinza" },
    { id: 13, file: "Portifolio/619506580_18117066553607780_509016048998611997_n.jpg", title: "Arte Aplicada à Anatomia", category: "autorais" },
    { id: 14, file: "Portifolio/619667462_18116586544610715_6156421637241375327_n.jpg", title: "Profundidade e Perspectiva", category: "realismo" },
    { id: 15, file: "Portifolio/620444221_18141224017422826_1098379079674216458_n.jpg", title: "Gradientes Contínuos", category: "detalhes" },
    { id: 16, file: "Portifolio/620860069_18066645845240640_93957307146095321_n.webp", title: "Solidez Técnica", category: "pretoecinza" },
    { id: 17, file: "Portifolio/620923530_18114064705625568_8739401321980614091_n.jpg", title: "Arte e Expressão Singular", category: "autorais" },
    { id: 18, file: "Portifolio/621210239_18106152355776804_7919111892553461848_n.jpg", title: "Contrastes Expressivos", category: "pretoecinza" },
    { id: 19, file: "Portifolio/621534115_18320549143219548_2846680076391438224_n.jpg", title: "Elegância e Sofisticação no Traço", category: "detalhes" },
    { id: 20, file: "Portifolio/621546327_18096430027925089_4208273616402702794_n.jpg", title: "Sombra Suave e Volume", category: "realismo" },
    { id: 21, file: "Portifolio/621995946_18342597448229527_5640599178656996943_n.jpg", title: "Técnica Autoral em Pele", category: "autorais" },
    { id: 22, file: "Portifolio/623256502_18109731976637436_2497721534396758369_n.jpg", title: "Detalhismo e Definição", category: "detalhes" },
    { id: 23, file: "Portifolio/623306117_18039497957724568_893765394404553494_n.webp", title: "Composição Estética", category: "autorais" },
    { id: 24, file: "Portifolio/624731006_18254740588291860_3118302104055425781_n.jpg", title: "Nuances e Meio-Tons", category: "pretoecinza" },
    { id: 25, file: "Portifolio/624905652_18104766544758998_7474607553096848078_n.webp", title: "Impacto Visual Autoral", category: "autorais" },
    { id: 26, file: "Portifolio/625012201_18338520436210172_5664043849179961943_n.jpg", title: "Projeto em Andamento e Cura", category: "processo" },
    { id: 27, file: "Portifolio/625140266_18199098367333453_8030220823623603220_n.webp", title: "Trabalho Minucioso", category: "detalhes" },
    { id: 28, file: "Portifolio/626046589_18328593709170474_6804275460213067041_n.jpg", title: "Traço Firme e Enquadramento", category: "autorais" },
    { id: 29, file: "Portifolio/626440524_18395470207178979_4325330092879633807_n.jpg", title: "Textura Visual Intensa", category: "pretoecinza" },
    { id: 30, file: "Portifolio/626627208_18344012395233696_5965385203013725302_n.jpg", title: "Grande Extensão e Densidade", category: "fechamento" },
    { id: 31, file: "Portifolio/626961983_18393048163194778_1064451459836084766_n.webp", title: "Equilíbrio de Luz Orgânica", category: "detalhes" },
    { id: 32, file: "Portifolio/627723465_18330296194169690_3698468822680298905_n.jpg", title: "Arte Corporal Expressiva", category: "autorais" },
    { id: 33, file: "Portifolio/628366845_18507836206073561_766007981373377070_n.jpg", title: "Contraste e Profundidade Escura", category: "pretoecinza" },
    { id: 34, file: "Portifolio/628992248_18507082285077554_2856834111607216275_n.jpg", title: "Fluidez Anatômica", category: "autorais" },
    { id: 35, file: "Portifolio/629149437_18500076754079332_8543344894597162431_n.jpg", title: "Sombra Densa e Detalhes Finos", category: "pretoecinza" },
    { id: 36, file: "Portifolio/629516473_18408907381121440_8202809707201040698_n.jpg", title: "Harmonia Visual e Precisão", category: "detalhes" },
    { id: 37, file: "Portifolio/630116619_18451842724101349_6187323250247834665_n.jpg", title: "Composição Completa", category: "autorais" },
    { id: 38, file: "Portifolio/636736293_18567921427059652_5337885739071783445_n.jpg", title: "Figurativo e Atmosfera", category: "realismo" },
    { id: 39, file: "Portifolio/651096691_18096953803962924_7110418527340279664_n.jpg", title: "Estudo e Aplicação em Pele", category: "autorais" },
    { id: 40, file: "Portifolio/652748770_18311389012286311_1389861903676957717_n.jpg", title: "Presença e Solidez de Linhas", category: "pretoecinza" },
    { id: 41, file: "Portifolio/357832582_18371998339029439_2394629786688882044_n.jpg", title: "Obra Autoral em Preto e Cinza", category: "autorais" }
  ]
};

// Exporta globalmente para uso direto em qualquer script do site
if (typeof window !== "undefined") {
  window.GUINKNASS_CONFIG = GUINKNASS_CONFIG;
}

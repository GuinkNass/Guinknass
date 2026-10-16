# GUINKNASS — GUIA DE INTEGRAÇÕES, CONFIGURAÇÃO E PUBLICAÇÃO

Este documento contém todas as orientações técnicas para conectar o site oficial de **GuinkNass** às integrações externas (Google Sheets, Google Forms, Envio de E-mails, WhatsApp) e publicá-lo em servidores de produção.

---

## 1. PÁGINAS IMPLEMENTADAS

| Página | Arquivo | Finalidade e Destaques |
| :--- | :--- | :--- |
| **Página Inicial** | `index.html` | Hero imersivo com vídeo de fundo `eu.mp4`, carrossel automático de tatuagens com navegação por toque e indicadores, pilares de experiência (+20 anos artes visuais, +13 anos tatuagem), vitrine de quadros e chamadas para ação. |
| **Portfólio** | `portfolio.html` | Galeria responsiva completa com todas as fotos reais em alta resolução da pasta `Portifolio`, sistema de filtros por categoria (Autorais, Preto e Cinza, Realismo, Detalhes, Fechamento) e Lightbox ampliado com navegação por setas e gestos touch. |
| **Quadros Originais** | `galeria.html` | Apresentação editorial dos quadros físicos (`quadro 1.png` e `quadro 2.png`), reprodutor de vídeo dos processos de pintura (`videopintandoquadro1.mp4` e `Videopintandoquadro2.mp4`), metadados editáveis, botão de compra direta e esclarecimento de dúvidas via WhatsApp. |
| **Estudos e Rascunhos** | `estudos.html` | Área dedicada aos 13 processos e estudos pictóricos (`arte1.jpg` a `arte13.jpg`), com zoom em alta definição e banner de controle de visibilidade sob autorização do artista. |
| **Sobre o Artista** | `sobre.html` | Apresentação da trajetória artística, destaque dos números consolidados (+20 anos arte visual, +13 anos tatuador), campos editoriais preparados para futuras inserções de biografias e exposições. |
| **Orçamentos** | `orcamentos.html` | Formulário completo de solicitação de orçamento com dados do cliente, especificações anatômicas da tatuagem, área de upload de referências visuais com miniaturas e remoção individual, validação e integração com Google Sheets/WhatsApp. |
| **Anamnese** | `anamnese.html` | Ficha digital de anamnese e biossegurança em 4 etapas (Identificação, Fatores de Segurança, Declarações/LGPD, Assinatura Eletrônica e Revisão), com canvas para desenho de assinatura e proteção integral de dados sensíveis. |
| **Contato** | `contato.html` | Central de atendimento com links diretos de WhatsApp para orçamentos, compra de obras e dúvidas gerais, além de formulário de contato e localização do estúdio. |

---

## 2. INVENTÁRIO DE ARQUIVOS DE MÍDIA UTILIZADOS

| Arquivo Real | Formato | Finalidade no Site |
| :--- | :--- | :--- |
| `Portifolio/eu.mp4` | MP4 (25.48 MB) | Vídeo de apresentação em background no topo da página inicial (`index.html`) com `autoplay`, `muted`, `loop`, `playsinline` e camadas de contraste de texto. |
| `Portifolio/quadro 1.png` | PNG (3.6 MB) | Obra física original "Quadro 01 - O Alquimista" exibida na galeria de quadros e na home page. |
| `Portifolio/videopintandoquadro1.mp4` | MP4 (3.48 MB) | Registro em vídeo do processo de pintura da obra Quadro 01, reproduzido em modal com controles. |
| `Portifolio/quadro 2.png` | PNG (2.7 MB) | Obra física original "Quadro 02 - A Ilha Flutuante & Ghost" exibida na galeria de quadros e na home page. |
| `Portifolio/Videopintandoquadro2.mp4` | MP4 (6.69 MB) | Registro em vídeo do processo de pintura da obra Quadro 02, reproduzido em modal com controles. |
| `Portifolio/arte1.jpg` até `arte13.jpg` | JPG | 13 estudos e rascunhos visuais exibidos com exclusividade na página `estudos.html`. |
| 41 Imagens de Tatuagem (nomes originais) | JPG / WEBP | Fotografias reais das tatuagens exibidas no carrossel da home (`carousel.js`) e no portfólio completo (`portfolio.js`). |

---

## 3. ARQUIVO CENTRAL DE CONFIGURAÇÃO

Todas as informações de contato, links de integração e dados de obras estão centralizados em:
👉 `js/config.js`

```javascript
const GUINKNASS_CONFIG = {
  artist: {
    name: "GuinkNass",
    whatsappNumber: "+55 11 99580-2338",
    whatsappBaseUrl: "https://wa.me/5511995802338"
  },
  integrations: {
    googleSheetsBudgetWebhookUrl: "", // URL do Webhook do Google Apps Script
    googleSheetsAnamneseWebhookUrl: "", // URL do Webhook da Anamnese
    googleFormsBudgetUrl: "",
    emailServiceEndpoint: ""
  }
  // ...
};
```

---

## 4. INSTRUÇÕES DE INTEGRAÇÃO COM GOOGLE SHEETS & GOOGLE FORMS

Como o formulário padrão do Google Forms não oferece controle de upload sem exigência de conta Google para o visitante, o site foi desenvolvido com uma arquitetura direta via **Google Apps Script Web App**. Esta solução grava os dados diretamente em uma planilha privada do Google Sheets sem expor credenciais.

### 4.1. Planilha de Orçamentos (GuinkNass)
**URL:** [https://docs.google.com/spreadsheets/d/1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE/edit?usp=sharing)  
**ID:** `1KLlUlClEVo6MwR_hy1lTmFPke_gtFWt4MGpdvc_iZIE`

#### Passo a passo para ativar:
1. Abra a planilha de Orçamentos acima.
2. No menu superior, clique em **Extensões > Apps Script**.
3. Apague o código padrão que estiver lá e cole este script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Cria cabeçalho automático se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Data/Hora", "Nome", "WhatsApp", "E-mail", "Cidade/UF",
        "Local do Corpo", "Tamanho (cm)", "Preferência de Cores", "Estilo",
        "Descrição da Ideia", "Significado", "Observações", "Qtd Referências"
      ]);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("pt-BR"),
      data.name || "",
      data.phone || "",
      data.email || "",
      data.city || "",
      data.bodyLocation || "",
      data.sizeCm || "",
      data.colorPreference || "",
      data.style || "",
      data.ideaDescription || "",
      data.meaning || "",
      data.notes || "",
      data.referenceFilesCount || 0
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Clique no botão azul **Implantar > Nova Implantação**.
8. Clique em **Implantar** e confirme a URL.
9. **URL Já Configurada no Site:**
   ```
   https://script.google.com/macros/s/AKfycby1PrwIql2yT_BMQ2_txseZB4Yzf1kf6GO54QrJEtjAZimCwGXO5-oXshR085mjD6vqYw/exec
   ```

> **Atenção Importante sobre Permissões:** Na janela de implantação, certifique-se de que o campo **"Quem pode acessar"** esteja selecionado como **"Qualquer pessoa" (Anyone)**. Se estiver como "Somente eu", o Google exigirá login do visitante e o envio falhará.

---

### 4.2. Planilha de Anamnese Digital (GuinkNass - Restrita)
**URL:** [https://docs.google.com/spreadsheets/d/1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI/edit?usp=sharing)  
**ID:** `1OmdWYXa2MlHAfpX3kmFbGHSuW3B47KnEeTUWTGwcrzI`

#### Passo a passo para ativar:
1. Abra a planilha de Anamnese acima.
2. No menu superior, clique em **Extensões > Apps Script**.
3. Apague o código padrão e cole este script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    // Cria cabeçalho automático com todos os campos da ficha
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Data/Hora Preenchimento", "Nome Completo", "Data Nascimento", "E-mail", "WhatsApp", "Data Prevista Sessão",
        "Alergias?", "Detalhes Alergias",
        "Cicatrização/Queloides?", "Detalhes Cicatrização",
        "Condições de Saúde?", "Detalhes Saúde",
        "Medicamentos Contínuos?", "Detalhes Medicamentos",
        "Afecções na Pele no Local?", "Detalhes Pele",
        "Histórico Desmaios/Pressão?",
        "Outras Observações",
        "Declaração Veracidade", "Ciência Conversa Presencial", "Consentimento LGPD Dados Sensíveis", "Status Assinatura"
      ]);
    }
    
    var client = payload.client || {};
    var safety = payload.safety || {};
    var consent = payload.consent || {};
    
    sheet.appendRow([
      consent.timestamp || new Date().toLocaleString("pt-BR"),
      client.name || "",
      client.birthDate || "",
      client.email || "",
      client.phone || "",
      client.sessionDate || "",
      safety.allergies || "",
      safety.allergiesDetails || "",
      safety.healing || "",
      safety.healingDetails || "",
      safety.healthConditions || "",
      safety.healthDetails || "",
      safety.medications || "",
      safety.medicationsDetails || "",
      safety.skinConditions || "",
      safety.skinDetails || "",
      safety.fainting || "",
      safety.otherNotes || "",
      consent.truthfulInfo ? "SIM" : "NÃO",
      consent.talkNeeded ? "SIM" : "NÃO",
      consent.lgpdSensivel ? "AUTORIZADO" : "NÃO",
      "ASSINATURA ELETRÔNICA CONFIRMADA"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Clique em **Implantar > Nova Implantação**, selecione **App da Web**, escolha **Executar como: Eu** e **Quem pode acessar: Qualquer pessoa (Anyone)**.
5. Clique em **Implantar** e confirme a URL gerada.
6. **URL Já Configurada no Site:**
   ```
   https://script.google.com/macros/s/AKfycbzUxpAYUFdXcLXbzaoLxsT4dqbZkIUQvmKUDxkJTIKJermjh8XHiShLPKPAeoXGOzyDjg/exec
   ```

> **Atenção:** Da mesma forma, certifique-se de que a opção **"Quem pode acessar"** esteja como **"Qualquer pessoa" (Anyone)** para que o preenchimento da ficha envie os dados à planilha sem exigir login Google dos clientes.

---

## 5. INTEGRAÇÃO COM WHATSAPP

O número oficial configurado é:
**+55 11 99580-2338** (Link padrão: `https://wa.me/5511995802338`)

O site implementa:
1. **Botão Flutuante Responsivo:** presente em todas as páginas, com menu rápido de escolha contextualizada.
2. **Compra Dinâmica de Quadros:** ao clicar em "COMPRAR VIA WHATSAPP" na galeria, abre uma mensagem pré-preenchida com o nome da obra e valor.
3. **Fallback Instantâneo de Orçamento:** caso o cliente prefira, ou caso esteja offline, um botão permite enviar todo o resumo estruturado da tatuagem diretamente para o WhatsApp com 1 clique.

---

## 6. INSTRUÇÕES PARA PUBLICAÇÃO DO SITE

Como o site foi construído em tecnologia padrão moderna (HTML5 semântico, CSS3 e JavaScript modular ES6), ele pode ser publicado gratuitamente ou em qualquer servidor web com performance imediata:

### Opção A: Vercel / Netlify (Recomendado - Gratuito e com SSL Automático)
1. Suba a pasta do projeto para um repositório no GitHub ou faça upload da pasta diretamente no painel do [Netlify Drop](https://app.netlify.com/drop) ou [Vercel](https://vercel.com).
2. O site não exige comando de build — o diretório raiz é servido instantaneamente com CDN global e carregamento ultrarrápido dos vídeos.

### Opção B: GitHub Pages
1. Crie um repositório no GitHub e envie os arquivos.
2. Acesse **Settings > Pages** e defina a fonte como `Deploy from a branch (main / root)`.
3. O site estará online no domínio `seunome.github.io/GUINKNASS_SITE`.

### Opção C: Hospedagem Tradicional (cPanel / Hostinger / Locaweb)
1. Acesse o gerenciador de arquivos da hospedagem.
2. Envie todos os arquivos e as pastas `css`, `js` e `Portifolio` para a pasta pública `public_html`.

---

## 7. TESTES EXECUTADOS

1. **Servidor Local e Código de Resposta HTTP:** Todas as 8 páginas HTML, 9 folhas de estilo CSS e 9 scripts JS responderam com `Status: 200 OK`.
2. **Reprodução de Mídia Real:** O vídeo `Portifolio/eu.mp4` (25.48 MB) e os vídeos de pintura dos quadros (`videopintandoquadro1.mp4` e `Videopintandoquadro2.mp4`) foram testados com retorno `200` e suporte nativo a streaming HTML5.
3. **Carrossel Automático:** Testado com avanço a cada 4.5s, navegação por setas, indicadores e touch swipe em telas móveis.
4. **Lightbox de Imagens:** Testado com ampliação em alta resolução de 100% das fotos de tatuagens, telas e estudos com teclas `ESC`, `ArrowLeft` e `ArrowRight`.
5. **Formulário de Orçamentos:** Validação de campos obrigatórios, dropzone com drag-and-drop de referências, pré-visualização de miniaturas e contingência local/WhatsApp.
6. **Ficha de Anamnese:** Assistente em 4 etapas verificado, alternância dinâmica de respostas condicionais ("Sim"), pad de assinatura eletrônica em Canvas e conformidade com termos LGPD.
7. **Sintaxe de Código:** Verificação com Node.js (`node --check`) sem erros ou alertas de sintaxe.

import type {
  Template,
  TemplateItem,
  TemplateSection,
} from "./allegroDescriptionTemplate";
import {
  monitorCaseVC,
  monitorVC,
} from "../additionalDescriptions/visualConditionDescriptions";

export type MonitorAllegroDescriptionInput = {
  producer: string;
  model: string;
  name: string;
  visualCondition: string;
  caseCondition: string;
  stand: string;
  resolution: string;
  diagonal: string;
  panelType: string;
  refreshRate: string;
  responseTime: string;
  brightness: string;
  contrast: string;
  connectors: string;
  hdr: string;
  pivot: string;
  additionalInfo: string;
  frame: boolean;
  design: boolean;
};

const ASSETS = {
  fullHd: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/full-HD.png",
  twoK: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/2k.png",
  fourK: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/4k.png",
  ips: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/ips.png",
  usbHub: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/HUBU.png",
  dell: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/dell.png",
  hp: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/logoHp.png",
  lenovo: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/logoL.png",
  pivot: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/pivot.jpeg",
  eco: "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/eko.jpeg",
} as const;

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isYes = (value: unknown) =>
  ["tak", "true", "1", "yes", "on"].includes(normalize(value));

const isWithoutStand = (value: unknown) => {
  const normalized = normalize(value);
  return normalized === "brak"
    || normalized === "nie"
    || normalized.includes("bez nogi")
    || normalized.includes("bez podstaw")
    || normalized.includes("brak nogi")
    || normalized.includes("brak podstaw");
};

const splitConnectors = (value: string) => {
  const connectors: string[] = [];
  let current = "";
  let parenthesisDepth = 0;

  for (const character of String(value ?? "")) {
    if (character === "(") parenthesisDepth += 1;
    if (character === ")") parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    if (character === "," && parenthesisDepth === 0) {
      if (current.trim()) connectors.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) connectors.push(current.trim());
  return connectors;
};

const text = (content: string): TemplateItem => ({
  type: "TEXT",
  content,
});

const image = (url: string): TemplateItem => ({
  type: "IMAGE",
  url,
});

const section = (
  id: string,
  imageUrl: string | undefined,
  content: string,
): TemplateSection => ({
  id,
  origin: "auto",
  items: imageUrl !== undefined ? [image(imageUrl), text(content)] : [text(content)],
});

const resolveResolutionSection = (resolution: string) => {
  const value = normalize(resolution).replace(/×/g, "x");
  if (value.includes("3840") || value.includes("2160") || value.includes("4k") || value.includes("uhd")) {
    return {
      id: "resolution-4k",
      image: ASSETS.fourK,
      content: `<h2>Rozdzielczość 4K</h2>
        <p>Rozdzielczość 4K, znana również jako Ultra High Definition (UHD), zapewnia niezwykle szczegółowy obraz. Standard 3840 x 2160 oferuje ponad 8 milionów pikseli, dzięki czemu obraz jest ostry, a drobne detale bardzo dobrze widoczne.</p>
        <p>To doskonały wybór do pracy z grafiką, edycji materiałów wideo, analizy danych oraz oglądania treści wysokiej jakości.</p>`,
    };
  }
  if (value.includes("2560") || value.includes("1440") || value.includes("2k") || value.includes("qhd")) {
    return {
      id: "resolution-2k",
      image: ASSETS.twoK,
      content: `<h2>Rozdzielczość 2K</h2>
        <p>Rozdzielczość 2K, znana także jako QHD (Quad High Definition), oferuje więcej przestrzeni roboczej i szczegółów niż standard Full HD. Typowa rozdzielczość 2560 x 1440 zapewnia ponad 3,6 miliona pikseli.</p>
        <p>Sprawdza się w pracy biurowej, projektowaniu graficznym, edycji wideo oraz grach, pozwalając jednocześnie wyświetlać więcej treści na ekranie.</p>`,
    };
  }
  if (value.includes("1920") || value.includes("1080") || value.includes("full hd") || value.includes("fhd")) {
    return {
      id: "resolution-full-hd",
      image: ASSETS.fullHd,
      content: `<h2>Rozdzielczość Full HD</h2>
        <p>Full HD oferuje ostry i szczegółowy obraz. Rozdzielczość 1920 x 1080 umożliwia wygodne wyświetlanie dokumentów, filmów i stron internetowych z dużą precyzją.</p>
        <p>To popularny, uniwersalny standard zapewniający dobrą jakość obrazu przy zachowaniu atrakcyjnej ceny.</p>`,
    };
  }
  return null;
};

const resolveProducerSection = (producer: string) => {
  const value = normalize(producer);
  if (value.includes("dell")) {
    return {
      id: "producer-dell",
      image: ASSETS.dell,
      content: `<h2>Światowy producent</h2>
        <p>Monitory Dell są cenione za jakość obrazu, ergonomię i niezawodność. Producent wykorzystuje technologie takie jak IPS, dbając o szerokie kąty widzenia i spójność kolorów.</p>
        <p>To rozwiązania odpowiednie zarówno do pracy biurowej, zastosowań profesjonalnych, jak i domowego stanowiska komputerowego.</p>`,
    };
  }
  if (value === "hp" || value.includes("hewlett") || value.startsWith("hp ")) {
    return {
      id: "producer-hp",
      image: ASSETS.hp,
      content: `<h2>Sprawdzona marka HP</h2>
        <p>HP (Hewlett-Packard) jest jednym z najbardziej rozpoznawalnych producentów technologii. Monitory tej marki łączą funkcjonalność, niezawodność i rozwiązania projektowane z myślą o codziennej pracy.</p>
        <p>Szeroka gama modeli pozwala dobrać urządzenie zarówno do domu, jak i środowiska firmowego.</p>`,
    };
  }
  if (value.includes("lenovo")) {
    return {
      id: "producer-lenovo",
      image: ASSETS.lenovo,
      content: `<h2>Technologia Lenovo</h2>
        <p>Lenovo jest globalnym producentem komputerów i urządzeń technologicznych. Monitory tej marki projektowane są z myślą o ergonomii, trwałości i wygodnej pracy przez wiele godzin.</p>
        <p>To praktyczne rozwiązania dla użytkowników domowych oraz stanowisk biznesowych.</p>`,
    };
  }
  return null;
};

export const buildMonitorAllegroDescription = (
  input: MonitorAllegroDescriptionInput,
): { description: Template; assetImages: string[] } => {
  const sections: Template["sections"] = [];
  const assets: string[] = [];
  const addAssetSection = (resolved: { id: string; image: string; content: string } | null) => {
    if (!resolved) return;
    assets.push(resolved.image);
    sections.push(section(resolved.id, resolved.image, resolved.content));
  };

  const monitorName = escapeHtml(input.model ? `Monitor ${input.model}` : input.name || "Monitor");
  const visualConditionKey = input.visualCondition.trim();
  const caseConditionKey = input.caseCondition.trim();
  const visualConditionDescription = monitorVC[visualConditionKey]?.trim() ?? "";
  const caseConditionDescription = monitorCaseVC[caseConditionKey]?.trim() ?? "";
  const visualConditionText = visualConditionKey
    ? `${escapeHtml(visualConditionKey)}${visualConditionDescription ? ` = <b>${escapeHtml(visualConditionDescription)}</b>` : ""}`
    : "";
  const caseConditionText = caseConditionKey
    ? `Stan obudowy: <b>${escapeHtml(caseConditionKey)}</b>${caseConditionDescription ? ` (${escapeHtml(caseConditionDescription)})` : ""}`
    : "";
  const connectorItems = splitConnectors(input.connectors);
  const featureItems = [
    input.additionalInfo && `<li><b>${escapeHtml(input.additionalInfo)}</b></li>`,
    isWithoutStand(input.stand) && "<li><b>Monitor sprzedawany bez nogi!</b></li>",
    visualConditionKey && `<li>Stan matrycy: <b>${escapeHtml(visualConditionKey)}</b>${visualConditionDescription ? ` (${escapeHtml(visualConditionDescription)})` : ""}</li>`,
    caseConditionKey && `<li>Stan obudowy: <b>${escapeHtml(caseConditionKey)}</b>${caseConditionDescription ? ` (${escapeHtml(caseConditionDescription)})` : ""}</li>`,
    "<li>Kabel zasilający w komplecie</li>",
  ].filter(Boolean).join("");

  sections.push(section("monitor-intro", "", `<h1>${monitorName}</h1>
    ${visualConditionText ? `<p>✅ ${visualConditionText}</p>` : ""}
    ${input.design ? "<p>✅ Nowoczesny design</p>" : ""}
    ${input.frame ? "<p>✅ Ultra cienka ramka matrycy</p>" : ""}
    <p>✅ Kabel zasilający w komplecie</p>
    ${caseConditionText ? `<p>${caseConditionText}</p>` : ""}`));

  const screenDetails = [
    input.diagonal && escapeHtml(input.diagonal),
    input.resolution && escapeHtml(input.resolution),
  ].filter(Boolean).join(" ");
  sections.push(section("monitor-summary", undefined, `<p>🖥️ <b>${monitorName}</b>${screenDetails ? ` posiada ekran <b>${screenDetails}</b>` : ""}${input.panelType ? ` z matrycą <b>${escapeHtml(input.panelType)}</b>` : ""}, oferujący wysoką jakość obrazu do pracy biurowej i multimediów.${input.connectors ? ` Wyposażony w porty <b>${escapeHtml(input.connectors)}</b>, zapewnia wszechstronne możliwości podłączenia urządzeń.` : ""}</p>`));

  sections.push(section("monitor-features", undefined, `<h2>Cechy:</h2>
    <ul>${featureItems}</ul>
    ${connectorItems.length ? `<h2>Szerokie możliwości połączeń dzięki portom:</h2><ul>${connectorItems.map((connector) => `<li>${escapeHtml(connector)}</li>`).join("")}</ul>` : ""}
    <p><b>📦 Do monitora dodajemy kabel zasilający.</b></p>
    <p><b>🚫 Kabel sygnałowy nie jest dodawany do monitorów.</b></p>
    <p><b>🛒 Kable do kupienia na innych aukcjach.</b></p>`));

  const specifications = [
    ["Rozdzielczość", input.resolution],
    ["Przekątna", input.diagonal],
    ["Typ matrycy", input.panelType],
    ["Częstotliwość odświeżania", input.refreshRate],
    ["Czas reakcji", input.responseTime],
    ["Jasność", input.brightness],
    ["Kontrast", input.contrast],
    ["Złącza", input.connectors],
    ["HDR", input.hdr],
  ]
    .filter(([, value]) => String(value ?? "").trim())
    .map(([label, value]) => `<li>✅ ${label}: ${escapeHtml(value)}</li>`)
    .join("");
  if (specifications) {
    sections.push(section("monitor-specification", "", `<h2>Specyfikacja</h2><ul>${specifications}</ul>`));
  }

  addAssetSection(resolveResolutionSection(input.resolution));

  if (normalize(input.panelType).includes("ips")) {
    addAssetSection({
      id: "panel-ips",
      image: ASSETS.ips,
      content: `<h2>Postaw na jakość</h2>
        <p>Technologia IPS zapewnia szerokie kąty widzenia, lepszą reprodukcję kolorów i płynne wyświetlanie obrazu. Jest dobrym wyborem dla osób pracujących z grafiką, dokumentami i multimediami.</p>`,
    });
  }

  const connectors = normalize(input.connectors);
  if (connectors.includes("hub") || connectors.includes("usb-b") || connectors.includes("usb b")) {
    addAssetSection({
      id: "usb-hub",
      image: ASSETS.usbHub,
      content: `<h2>HUB USB</h2>
        <p>Wbudowany HUB USB pozwala wygodnie podłączyć urządzenia peryferyjne bez sięgania do portów komputera. Ułatwia organizację stanowiska i ogranicza liczbę przewodów.</p>
        <ul><li><b>Porządek i wygoda:</b> szybki dostęp do portów USB.</li><li><b>Oszczędność miejsca:</b> akcesoria podłączasz bezpośrednio do monitora.</li></ul>
        <p><b>Aby HUB USB działał, kabel USB B monitora musi być podłączony do gniazda USB A w komputerze.</b></p>`,
    });
  }

  addAssetSection(resolveProducerSection(input.producer));

  if (isYes(input.pivot)) {
    addAssetSection({
      id: "pivot",
      image: ASSETS.pivot,
      content: `<h2>Zalety funkcji Pivot</h2>
        <ol><li><b>Elastyczność orientacji:</b> obrót ekranu o 90 stopni.</li><li><b>Lepsza ergonomia:</b> wygodniejsze czytanie długich dokumentów i kodu.</li><li><b>Dopasowanie stanowiska:</b> możliwość ustawienia orientacji zgodnie z wykonywaną pracą.</li><li><b>Szerokie zastosowanie:</b> przydatna funkcja dla grafików, programistów i analityków.</li></ol>`,
    });
  }

  addAssetSection({
    id: "eco",
    image: ASSETS.eco,
    content: `<h2>Zadbaj o środowisko</h2>
      <p>Monitor poleasingowy to ponowne wykorzystanie sprawnego sprzętu i ograniczenie ilości elektroodpadów. Urządzenie zostało dokładnie sprawdzone i przetestowane przed sprzedażą.</p>
      <p>Stan wizualny określamy według klas. Podstawa i obudowa mogą posiadać ślady wcześniejszego użytkowania, takie jak ryski lub przetarcia, zgodnie z opisem oferty.</p>`,
  });

  return {
    description: { sections },
    assetImages: Array.from(new Set(assets)),
  };
};

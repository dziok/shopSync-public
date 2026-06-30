export const dellSeriesHtml = `
  <h2>⭐ Seria Dell Latitude</h2>
  <p>
    Seria Dell Latitude jest znana jako jedna z najbardziej <b>zaawansowanych i niezawodnych serii</b> laptopów, które są idealne dla profesjonalistów. Zaprojektowane z myślą o pracy w biznesie, szkole, domu i wymagających środowiskach, laptopy z serii Dell Latitude oferują nie tylko wydajność, ale także doskonałą trwałość.
  </p>
`;

const clean = (value: unknown) => String(value ?? "").trim();

const formatCapacity = (value: unknown) => {
  const raw = clean(value);
  if (!raw) return "";
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (/(\bGB\b|\bTB\b)/i.test(normalized)) {
    return normalized.replace(/\s*(GB|TB)\s*/i, " $1").trim();
  }
  return `${normalized} GB`;
};

const formatResolution = (value: unknown) => {
  const raw = clean(value).replace(/px/gi, "").trim();
  if (!raw) return "";
  const normalized = raw.replace(/\s*[x×]\s*/i, " x ");
  if (/1920\s*x\s*1080/i.test(normalized)) return "1920 x 1080 FULL HD";
  return normalized;
};

const formatDiagonal = (value: unknown) => {
  const raw = clean(value);
  if (!raw) return "";
  return raw.includes('"') ? raw : `${raw}"`;
};

const buildScreenSentence = (matrixSize: unknown, resolution: unknown) => {
  const diagonal = formatDiagonal(matrixSize);
  const res = formatResolution(resolution);
  if (!diagonal && !res) return "";
  if (res) {
    return `${diagonal} calowy wyświetlacz doskonale nadaje się do oglądania zdjęć lub filmów.`;
  }
  return `${diagonal} calowy wyświetlacz doskonale nadaje się do oglądania zdjęć lub filmów.`;
};


export const buildIntroText = (
  producer: string | string[],
  model: string | string[],
  cpu: string | string[],
  ramAmount: string | string[],
  ramType: string | string[],
  matrixSize: string | string[],
  resolution: string | string[],
) => `
  <h2>⭐ Gotowy do pracy! ⭐</h2>
  <p>
    Przedstawiamy <b>${producer} ${model}</b> - najwyższa wydajność biznesowa.
    Dzięki wydajnemu procesorowi <b>${cpu}</b> i
    ${formatCapacity(ramAmount)} pamięci RAM <b>${ramType}</b>
    ten laptop jest w stanie sprostać nawet najbardziej wymagającym zadaniom.

    ${buildScreenSentence(matrixSize, resolution)}
    Ponadto, dzięki eleganckiej i nowoczesnej konstrukcji,
    ten laptop będzie <b>przyciągał wzrok</b> gdziekolwiek się znajdziesz.

    Dlaczego więc warto czekać?<b>
    ✅ Zamów swój ${producer} ${model} już dziś!
  </b> </p>
  `.trim();

export const laptopAdditionalText2 = (
  producer: string | string[],
  model: string | string[],
  ports: string | string[]
) => `
  <h2>⭐Laptop idealny dla Ciebie!⭐</h2>
  <p>Idealnie sprawdzi się podczas codziennej gonitwy, zarówno w pracy, w szkole czy podczas relaksu. Wyjątkowy laptop stworzony przez najlepszych inżynierów z <b>${producer}</b></p>
    <h2>⭐Cienka konstrukcja wyposażona we wszystkie potrzebne porty⭐</h2>
  <p>Już nie musisz używać kluczy sprzętowych, aby skorzystać ze wszystkich najważniejszych portów, które oferuje ta wyjątkowo cienka konstrukcja. Laptop jest wyposażony w nowoczesne porty.</p>
  `

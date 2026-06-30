export type TemplateItem =
    | { type: "TEXT"; content: string }
    | { type: "IMAGE"; url: string; locked?: boolean };

export type TemplateSection = {
    items: TemplateItem[];
    origin?: "auto" | "user";
    id: string;
};

export type Template = {
    sections: TemplateSection[];
};

const clean = (value: unknown) => String(value ?? "").trim();

const formatCapacity = (value: unknown) => {
    const raw = clean(value);
    if (!raw) return "";
    const normalized = raw.replace(/\s+/g, " ").trim();
    const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*(GB|TB)/i);
    if (match) {
        const number = match[1].replace(",", ".");
        const trimmed = number.replace(/(\.\d)0$/, "$1");
        return `${trimmed} ${match[2].toUpperCase()}`.trim();
    }
    const numericMatch = normalized.match(/\d+(?:[.,]\d+)?/);
    if (numericMatch) {
        const number = numericMatch[0].replace(",", ".");
        const trimmed = number.replace(/(\.\d)0$/, "$1");
        return `${trimmed} GB`;
    }
    return "";
};

const formatGHz = (value: unknown) => {
    const raw = clean(value);
    if (!raw) return "";
    if (/ghz/i.test(raw)) return raw.replace(/\s*ghz\s*/i, " GHz").trim();
    return `${raw} GHz`;
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

import { batteryDescription, GradeDescriptios, matrixGradeDescriptios } from "../templates/laptopTemplate";

const cleanDiskType = (value: unknown) => {
    const raw = clean(value);
    if (!raw) return "";
    return raw
        .replace(/\b\d+([.,]\d+)?\s*(GB|TB)\b/gi, "")
        .replace(/\b(GB|TB)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
};

const stripDescription = (value: string) => {
    const trimmed = value.trim();
    const dashIndex = trimmed.indexOf(" - ");
    if (dashIndex >= 0) return trimmed.slice(0, dashIndex).trim();
    const lower = trimmed.toLowerCase();
    const naIndex = lower.indexOf(" na ");
    if (naIndex >= 0) return trimmed.slice(0, naIndex).trim();
    return trimmed;
};

export function AllegroLaptopTemplate({
    system,
    cpuSeries,
    cpuModel,
    cpuClockSpeed,
    cpuMaxClockSpeed,
    cpuCores,
    cpuThreads,
    gpuName,
    diskType,
    diskSize,
    ramType,
    ramAmount,
    resolution,
    diagonal,
    matrixGrade,
    matrixType,
    showVebCam,
    showLibre,
    battery,
    caseGrade,
    keyboard,
    showMacOS,
    additionalInfo_keyboard,
    additionalInfo_case,
    additionalInfo_matrix,
    touchScreen,
    showModem,
    showWin11info,
    producer,
    model,
    ports,
    series,
    introText,
    introText2,
    showRefurbProcess,
    refurbProcessImageUrl,
    skipCaseDescription,
    skipMatrixDescription,
}: {
    system: string;
    cpuSeries: string;
    cpuModel: string;
    cpuClockSpeed: string;
    cpuMaxClockSpeed: string;
    cpuCores: string;
    cpuThreads: string;
    gpuName: string;
    diskType: string;
    diskSize: string;
    ramType: string;
    ramAmount: string;
    resolution: string;
    diagonal: string;
    matrixGrade: string;
    matrixType: string;
    showVebCam: boolean;
    showLibre: boolean;
    battery: string;
    caseGrade: string;
    keyboard: string;
    showMacOS: boolean;
    additionalInfo_keyboard: string;
    additionalInfo_case: string;
    additionalInfo_matrix: string;
    touchScreen: string;
    showModem: boolean;
    showWin11info: boolean;
    producer: string;
    model: string;
    ports: string[];
    series: string;
    introText: string;
    introText2: string;
    showRefurbProcess: boolean;
    refurbProcessImageUrl: string;
    skipCaseDescription: boolean;
    skipMatrixDescription: boolean;
}): Template {
    const hasNoSystem = system.toLowerCase().includes("brak systemu");
    const seriesText = series?.trim();
    const displayName = [producer, model].filter(Boolean).join(" ").trim();
    const cpuTurbo = formatGHz(cpuMaxClockSpeed) || formatGHz(cpuClockSpeed);
    const ramLabel = formatCapacity(ramAmount);
    const diskLabel = formatCapacity(diskSize);
    const diskTypeLabel = cleanDiskType(diskType) || clean(diskType);
    const resolutionLabel = formatResolution(resolution);
    const diagonalLabel = formatDiagonal(diagonal);
    const screenLabel = [diagonalLabel, resolutionLabel].filter(Boolean).join(" ");
    const caseLabelRaw = GradeDescriptios[caseGrade] ?? caseGrade;
    const matrixLabelRaw = matrixGradeDescriptios[matrixGrade] ?? matrixGrade;
    const caseLabelBase = skipCaseDescription ? stripDescription(caseLabelRaw) : caseLabelRaw;
    const matrixLabelBase = skipMatrixDescription ? stripDescription(matrixLabelRaw) : matrixLabelRaw;
    const caseLabel = [clean(caseLabelBase), clean(additionalInfo_case)].filter(Boolean).join(" ");
    const matrixLabel = [clean(matrixLabelBase), clean(additionalInfo_matrix)].filter(Boolean).join(" ");
    const batteryLabel = clean(batteryDescription[battery] ?? battery).replace(/(\d),(\d)/g, "$1.$2");
    const batteryLine = batteryLabel
        ? `<b>W komplecie zasilacz i bateria - </b>${batteryLabel}`
        : "<b>W komplecie zasilacz i bateria</b>";

    const sections: (TemplateSection | null)[] = [
        {
            id: "mainImage",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
            ],
        },

        seriesText
            ? {
                id: "seriesText",
                origin: "auto",
                items: [
                    {
                        type: "TEXT",
                        content: seriesText,
                    },
                ],
            }
            : null,

        {
            id: "cechyText",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
                {
                    type: "TEXT",
                    content: `
            <h1>${displayName}</h1>
            <h2>Cechy:</h2>

            <p>✅ ${cpuThreads}-wątkowy procesor <b>${cpuModel} | ${cpuCores} x ${cpuTurbo}</b> gwarantujący niesamowitą wydajność i szybkość</p>
            <p>✅ Szybki dysk <b>${diskTypeLabel}</b> o pojemności <b>${diskSize}</b>, zapewniający błyskawiczny dostęp do danych</p>
            <p>✅ Pamięć RAM <b>${ramType}</b> o pojemności <b>${ramLabel}</b> zapewniająca niezrównaną płynność działania i możliwość wykonywania jednocześnie wielu zadań</p>
            ${!hasNoSystem
                            ? `<p>✅ Oryginalny system operacyjny <b>${system}</b>, zapewniający nowoczesne funkcje i intuicyjną obsługę</p>`
                            : ""
                        }
            ${resolutionLabel
                            ? `<p>✅ Wysokiej jakości matryca o rozdzielczości <b>${resolutionLabel}</b> gwarantująca wyraziste i realistyczne obrazy</p>`
                            : ""
                        }
            ${showVebCam
                            ? `<p>✅ Wbudowana <b>kamerka internetowa</b>, idealna do zdalnej nauki czy wideokonferencji</p>`
                            : ""
                        }
          `,
                },
            ],
        },

        !hasNoSystem
            ? {
                id: "2ndText",
                origin: "auto",
                items: [
                    {
                        type: "TEXT",
                        content: `<p>Laptop został ✔️ <b>dokładnie</b> przetestowany przed wysyłką. Posiada zainstalowany ✔️ <b>oryginalny</b> system ✔️ <b>${system} w polskiej wersji językowej</b>, wraz z ✔️ <b>sterownikami</b>, oprogramowaniem <b>biurowym</b> oraz dodatkową przeglądarką Internetową. Laptop po rozpakowaniu z pudełka jest ✔️ <b>gotowy do pracy.</b></p>`,
                    },
                ],
            }
            : null,

        {
            id: "1stImg",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
            ],
        },

        {
            id: "introText",
            origin: "auto",
            items: [
                {
                    type: "TEXT",
                    content: introText,
                },
            ],
        },

        {
            id: "2ndImage",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
            ],
        },

        {
            id: "introText2",
            origin: "auto",
            items: [
                {
                    type: "TEXT",
                    content: introText2,
                },
            ],
        },

        showRefurbProcess
            ? {
                id: "refurbProcess",
                origin: "auto",
                items: [
                    {
                        type: "IMAGE",
                        url: refurbProcessImageUrl,
                    },
                    {
                        type: "TEXT",
                        content: `
            <h2>Każdy laptop przechodzi kompleksowy proces odnawiania</h2>
            <p>✅ Urządzenie jest dokładnie czyszczone (obudowa, klawiatura, porty) w celu przywrócenia estetycznego wyglądu.</p>
            <p>✅ Laptop przechodzi szczegółowe testy techniczne, gwarantujące pełną sprawność wszystkich podzespołów.</p>
            <p>✅ Wykonywana jest kontrola wizualna, oceniająca stan obudowy i elementów zewnętrznych. Dzięki temu laptop jest zgodny z opisem aukcji.</p>
            <p>✅ W razie potrzeby obudowa zostaje zabezpieczona dedykowaną folią ochronną, która poprawia estetykę urządzenia oraz pomaga zamaskować ryski lub przetarcia wynikające z normalnego użytkowania.</p>
          `,
                    },
                ],
            }
            : null,

        {
            id: "spec",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
                {
                    type: "TEXT",
                    content: `
            <h2>Specyfikacja:</h2>
            <ul>
              <li><b>Procesor ${cpuSeries} ${cpuModel}:</b> ${cpuCores} rdzeni ${cpuThreads} wątków, taktowanie TURBO ${cpuTurbo}</li>
              <li><b>Pamięć RAM:</b> ${ramLabel} ${ramType}</li>
              <li><b>Karta graficzna:</b> ${gpuName}</li>
              <li><b>Dysk:</b> ${diskLabel} ${diskTypeLabel}</li>
              <li><b>Układ klawiatury:</b> ${keyboard} ${additionalInfo_keyboard}</li>
              <li><b>Stan wizualny:</b> ${caseLabel}</li>
              <li><b>Matryca:</b> ${matrixLabel}</li>
              <li><b>Typ ekranu:</b> ${matrixType} ${touchScreen === "tak" ? "dotykowy" : ""
                        } ${showMacOS ? "Retina" : ""} ${screenLabel}</li>
              ${!hasNoSystem
                            ? `<li><b>System operacyjny:</b> Zainstalowany ${system}</li>`
                            : ""
                        }
              <li><p>${batteryLine}</p></li>
            </ul>
          `,
                },
            ],
        },

        {
            id: "3rdImg",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
                {
                    type: "TEXT",
                    content: `
            <h2>Specyfikacja portów laptopa:</h2>
            <ul>
              ${Array.isArray(ports) ? ports.map((p) => `<li>${p}</li>`).join("") : ""}
            </ul>
          `,
                },
            ],
        },

        {
            id: "ports",
            origin: "auto",
            items: [
                {
                    type: "IMAGE",
                    url: "",
                },
                {
                    type: "TEXT",
                    content: `
            <h2>Kupując na tej aukcji, otrzymujesz:</h2>

              <p>✔️ laptopa zgodnego z powyższą specyfikacją</p>
              <p>✔️ sprawny, przetestowany zasilacz</p>
              <p>✔️ sprawną przetestowaną baterię</p>
              ${!hasNoSystem
                            ? `<p>✔️ Zainstalowany system operacyjny <b>${system}</b>, gotowy do pracy wraz z najnowszymi sterownikami</p>`
                            : ""
                        }
              ${showLibre
                            ? `<p>✔️ Zainstalowane darmowe oprogramowanie biurowe LibreOffice, pozwalające np. na edycję dokumentów, tworzenie arkuszy kalkulacyjnych czy prezentacji</p>`
                            : ""
                        }

          `,
                },
            ],
        },

        showLibre
            ? {
                id: "4thImg",
                origin: "auto",
                items: [
                    {
                        type: "IMAGE",
                        url: "",
                    },
                ],
            }
            : null,

        showLibre
            ? {
                id: "libre",
                origin: "auto",
                items: [
                    {
                        type: "TEXT",
                        content: `
                <h2>Twórz szybko i wygodnie</h2>
                <p><b>LibreOffice</b> to wolny, darmowy i wieloplatformowy pakiet biurowy o szerokich możliwościach. Jest następcą OpenOffice używanym codziennie przez miliony osób na całym świecie. Czytelne i wszechstronne narzędzia pozwolą Ci na wykorzystanie Twojego potencjału w pracy biurowej i własnych projektach. Na pakiet LibreOffice składa się kilka programów, które razem tworzą najlepsze wolne i darmowe rozwiązanie na rynku, a dzięki silnej społeczności stają się one lepsze z każdą wydaną wersją. Należą do nich: <b>Writer</b> (edytor tekstu), Calc (arkusze kalkulacyjne), <b>Impress</b> (prezentacje), <b>Draw</b> (diagramy i grafika wektorowa), <b>Base</b> (bazy danych) i <b>Math</b> (formuły matematyczne), a także narzędzia na Androida i online.</p>
              `,
                    },
                ],
            }
            : null,


        system.includes("Windows 10")
            ? {
                id: "win10",
                origin: "auto",
                items: [
                    {
                        type: "IMAGE",
                        url: "",
                    },
                    {
                        type: "TEXT",
                        content: `<h2>${system}</h2> 
                <ul>
                  <li>Rozbudowane, znajome menu Start zapewnia szybki dostęp do ulubionych funkcji</li>
                  <li>Szybkie i płynne działanie. Obsługuje wszystko, czym dysponujesz</li>
                  <li>Dzięki zawsze włączonym aktualizacjom masz zapewnione najnowsze funkcje i zabezpieczenia</li>
                  <li>Dołącz do domeny firmowej lub szkolnej i zyskaj dostęp do plików sieciowych, serwerów i drukarek</li>
                  <li>Lepsze zabezpieczenia dzięki szyfrowaniu danych i ochronie z funkcją BitLocker</li>
                </ul>
              `,
                    },
                ],
            }
            : null,

        system.includes("Windows 10")
            ? {
                id: "win10info",
                origin: "auto",
                items: [
                    {
                        type: "TEXT",
                        content: `
                <p>❗UWAGA❗ To urządzenie zawiera system operacyjny Windows 10 i nie kwalifikuje się do aktualizacji do systemu Windows 11. Po 14 października 2025 r. firma Microsoft nie będzie już zapewniać standardowego wsparcia dla systemu Windows 10. Twój komputer będzie nadal działał, a Ty możesz kwalifikować się do subskrypcji rozszerzonych aktualizacji zabezpieczeń (ESU) firmy Microsoft. ESU zapewnia ograniczone krytyczne aktualizacje, patrz https://www.microsoft.com/windows/end-of-support.</p>
              `,
                    },
                ],
            }
            : null,

        system.includes("Windows 11")
            ? {
                id: "win11",
                origin: "auto",
                items: [
                    {
                        type: "IMAGE",
                        url: "",
                    },
                    {
                        type: "TEXT",
                        content: `<h2>${system}</h2> 
                <ul>
                  <li>Nowy, bardziej spójny design</li>
                  <li>Układy okien na ekranie – funkcja ułatwiająca pracę wielozadaniową</li>
                  <li>Funkcje ułatwiające produktywną pracę</li>
                  <li>Wsparcie dla aplikacji z Androida</li>
                  <li>Funkcje poprawiające wydajność</li>
                </ul>

              `,
                    },
                ],
            }
            : null,


        diskTypeLabel.toUpperCase().includes("SSD")
            ? {
                id: "SSD",
                origin: "auto",
                items: [

                    {
                        type: 'IMAGE',
                        url: ''
                    },
                    {
                        type: "TEXT",
                        content:
                            `
      <h2>Dysk SSD</h2>
      <ul>
        <li>To dysk półprzewodnikowy, dzięki niemu laptop działa znacznie szybciej. W odróżnieniu od klasycznych dysków HDD nie ma ruchomych części, dlatego też działa niezwykle cicho i sprawia, że laptop zużywa mniej energii.</li>
        <li>Dzięki SSD komputer jest gotów do pracy w ciągu kilku sekund i znacznie szybciej wykonuje różne operacje, takie jak np. kopiowanie plików.</li>
      </ul>
    `,
                    },
                ],
            }
            : null,


        showWin11info
            ? {
                id: "win11Info",
                origin: "auto",
                items: [
                    {
                        type: "TEXT",
                        content:
                            '<p>Laptop został wydany wcześniej niż Windows 11, dlatego ten system <b>nie jest oficjalnie wspierany przez producenta</b> (producent wspiera tylko najnowszy sprzęt), jednak <b>laptop jest w pełni kompatybilny z tym systemem</b> i posiada wymagane do poprawnego działania szyfrowanie TPM 2.0 oraz UEFI. <b>Działa bez żadnych problemów</b>, umożliwiając pobieranie najnowszych sterowników oraz aktualizacji systemu. Chcesz laptopa z zainstalowanym systemem Windows 10? Nie ma problemu, napisz w "uwagach do sprzedającego" podczas składania zamówienia.</p>',
                    },
                ],
            }
            : null,
    ];

    return {
        sections: sections.filter(
            (s): s is TemplateSection => s !== null
        ),
    };
}

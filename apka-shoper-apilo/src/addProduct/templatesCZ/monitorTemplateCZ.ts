export const monitorTemplateCZ = (
    producer: string,
    name: string,
    model: string,
    visualCondition: string,
    resolution: string,
    chasingCondition: string,
    diagonal: string,
    monitorPanel: string,
    refreshRate: string,
    responseTime: string,
    brightness: string,
    contrast: string,
    ports: string,
    HDR: string,
    pivot: string,
    additionalInfo1: string,
    showIps: string,
    showTn: string,
    portsLI: string

) => `
<div id="mainContainer" style="display: flex; align-items: center; flex-direction: column;">

    <div class="monitors_section">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../lcd.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/lcd.png" alt="lcd" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">${name}</h2>
            <div class="monitors_text_container">

                <p class="monitors_p"> Monitor ${producer} ${model} má displej ${diagonal} ${resolution}px s panelem ${monitorPanel}, který nabízí široké pozorovací úhly a vynikající kvalitu obrazu pro kancelářskou práci a multimédia. Vybaven porty ${ports}, poskytuje všestrannost připojení zařízení. <br></p>
                <p class="monitors_p">Vlastnosti:</p>
                <ul class="monitors_ul">

                    <li>Stav displeje: ${visualCondition}</li>
                    <li>Stav krytu: ${chasingCondition}</li>
                    ${additionalInfo1}
                    <li> Napájecí kabel je součástí balení </li>

                </ul>
                <p class="monitors_p">Specifikace:</p>
                <ul class="monitors_ul">
                    <li>Rozlišení: ${resolution}px</li>
                    <li>Úhlopříčka: ${diagonal}</li>
                    <li>Typ panelu: ${monitorPanel}</li>
                    <li>Obnovovací frekvence: ${refreshRate}</li>
                    <li>Doba odezvy: ${responseTime}</li>
                    <li>Jas: ${brightness}</li>
                    <li>Kontrast: ${contrast}</li>
                    <li>Porty: ${ports}</li>
                    <li>HDR: ${HDR}</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="monitors_section" style="display: ${showIps}">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../ips.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ips.png" alt="ips" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Zaměřte se na kvalitu</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Technologie IPS zajišťuje široké pozorovací úhly, lepší reprodukci barev, vyšší kvalitu obrazu, minimální zkreslení barev a plynulé zobrazování obrazu. Proto je široce používána v monitorech pro profesionály, grafické nadšence, designéry a osoby, které si cení vysoké vizuální kvality.
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section" style="display: ${showTn}">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../tn.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/tn.png" alt="tn" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Zaměřte se na kvalitu</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Monitory TN se vyznačují krátkou dobou odezvy, což je činí ideální volbou pro hráče a dynamické aplikace. Zajišťují vysokou plynulost obrazu, minimalizují efekt rozmazání. Ačkoli pozorovací úhly a reprodukce barev jsou poněkud slabší než u panelů IPS, TN je ekonomické a výkonné řešení pro uživatele, kteří si cení rychlosti.
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../resolution.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/resolution.png" alt="resolution" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Rozlišení ${resolution}px</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Rozlišení ${resolution}px nabízí ostrý a detailní obraz. Každý pixel je dostatečně malý, aby nebyly viditelné jednotlivé pixely pouhým okem.
                    <br>
                    Takové rozlišení umožňuje zobrazování obrazů, videí a textů s velkou přesností a detailností. Barvy jsou výrazné, kontrasty hluboké a detaily dobře viditelné.
                    <br><br>
                    ${resolution}px je populárním standardem v mnoha zařízeních, jako jsou televizory, počítačové monitory, projektory nebo smartphony. Zajišťuje vysokou kvalitu obrazu a zároveň je cenově dostupné.
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../ports.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ports.png" alt="ports" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Široké možnosti připojení díky portům:</h2>
            <div class="monitors_text_container">
                <ul class="monitors_ul">
                    ${portsLI}
                </ul>
                <p class="monitors_p">
                    K monitoru přidáváme napájecí kabel. <br>
                    Signální kabel není součástí balení monitorů.<br>
                    Kabely lze zakoupit v jiných aukcích.<br>
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../recycling.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/recycling.png" alt="recycling" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Pečujte o životní prostředí</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Monitory jsou prodávány jako popůjčované, tj. použité. Rozdělujeme je do tříd na základě vizuálního stavu (A, A-, B a C). Stojan monitoru může mít škrábance, oděrky. Hodnocen je především stav displeje a viditelných rámečků. Technický stav je pečlivě kontrolován a testován při dodání k nám a před odesláním zákazníkovi!
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section" style="display: ${pivot}">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../rotate.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/rotate.png" alt="pivot" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Výhody funkce Pivot:</h2>
            <div class="monitors_text_container">
                <ul class="monitors_ul">
                    <li>Flexibilita orientace: Umožňuje otočení obrazovky o 90 stupňů, což umožňuje snadnou změnu orientace z horizontální na vertikální. Je užitečná při práci s dlouhými dokumenty, programovacím kódem nebo webovými stránkami.</li>
                    <li>Zlepšená ergonomie: Otočení obrazovky do vertikální polohy umožňuje pohodlnější čtení a prohlížení obsahu, zejména u delších textových bloků.</li>
                    <li>Přizpůsobení individuálním preferencím: Díky funkci pivot mohou uživatelé přizpůsobit orientaci obrazovky svým individuálním preferencím a zajistit si pohodlí při dlouhodobém používání monitoru.</li>
                    <li>Široké využití: Funkce pivot je obzvláště populární mezi profesionály, jako jsou grafici, designéři, programátoři nebo datoví analytici, kteří vyžadují větší pracovní prostor a vyšší efektivitu.</li>
                </ul>
            </div>
        </div>
    </div>

</div>


    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

        .monitorsVl {
            border-left: 6px solid #e9e9e9;
            height: 100%;
            margin-top: 30px;
            border-radius: 10px;
        }

        .monitorsLeft_container {
            display: flex;
            align-items: center;
            flex-direction: column;
            margin-right: 50px;
        }

        .monitors_h3 {
            color: #313131;
            font-size: 20px;
            margin: 10px 0 0 0;
        }

        .monitors_h2 {
            color: #313131;
            font-size: 30px;
            margin-top: 10px;
            margin-bottom: 5px;
            font-weight: 400;
        }

        .monitors_p {
            font-size: 20px;
            line-height: 1.5;
            color: #313131;
        }

        .monitors_p2 {
            font-size: 16px;
            line-height: 1.5;
            color: #484848;
        }

        .monitors_ul {
            font-size: 16px;
            line-height: 2;
            margin-left: 2rem;
            color: #717171;
        }

        #monitors_photo_container {
            margin-bottom: 20px;
            display: flex;
            width: 100%;
            justify-content: center;

        }

        .monitors_text_container {
            display: flex;
            flex-direction: column;
            width: 100%;
            justify-content: center;
        }

        .monitors_section {
            width: 100%;
            display: flex;
            flex-direction: row;
            margin: 10px 0 10px 0;
        }

        .monitors_logo {
            width: 100px;
            margin-top: 20px;
        }

        .monitors_boxes {
            width: 42%;
            background-color: #f7f7f7;
            padding: 30px;
            border-radius: 20px;
            flex-shrink: 0;
            flex-grow: 1;
        }

        .monitors_section2 {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 1rem;
        }

        .monitors_photo {
            height: 450px;
            margin: auto;
        }

        .monitors_icon {
            width: 60px;
        }



        @media (max-width: 600px) {
            .monitors_section {
                display: flex;
                flex-direction: column;
                margin-left: 10px;
                margin-right: 10px;
            }

            .monitors_section2 {
                margin-left: 10px;
                margin-right: 10px;
            }
        }
    </style>

`

export const monitorApiloTemplate1 = (
    producer: string,
    model: string,
    visualCondition: string,
    resolution: string,
    chasingCondition: string,
    diagonal: string,
    monitorPanel: string,
    ports: string,
    additionalInfo1: string,
    portsLI: string
) => `
 <p> 🖥️<b>Monitor ${producer} ${model} </b> posiada ekran <b>${diagonal} ${resolution}</b> z matrycą <b>${monitorPanel}</b>, oferujący szerokie kąty widzenia i doskonałą jakość obrazu do pracy
                    biurowej i multimediów. Wyposażony w porty <b>${ports}</b>
                    , zapewnia wszechstronność podłączenia urządzeń. <br></p>
                    <p>Cechy:</p>
                    <ul>
                        ${additionalInfo1}
                        <li>Stan matrycy: ${visualCondition} </li>
                        <li>Stan obudowy: ${chasingCondition} </li>
                        <li> Kabel zasilający w komplecie </li>
                     </ul>   

                <b >Szerokie możliwości połączeń dzięki portom:</b>

                    <ul>
                        ${portsLI}
                    </ul>

`



export const monitorApiloTemplate2 = (
    resolution: string,
    diagonal: string,
    monitorPanel: string,
    refreshRate: string,
    responseTime: string,
    brightness: string,
    contrast: string,
    ports: string,
    HDR: string,

) => `
                    <ul>
                        <li>✅ Rozdzielczość: ${resolution}</li>
                        <li>✅ Przekątna: ${diagonal}</li>
                        <li>✅ Typ matrycy: ${monitorPanel}</li>
                        <li>✅ Częstotliwość odświeżania: ${refreshRate}</li>
                        <li>✅ Czas reakcji: ${responseTime}</li>
                        <li>✅ Jasność: ${brightness}</li>
                        <li>✅ Kontrast: ${contrast}</li>
                        <li>✅ Złącza: ${ports}</li>
                        <li>✅ HDR: ${HDR}</li>
                    </ul>
`
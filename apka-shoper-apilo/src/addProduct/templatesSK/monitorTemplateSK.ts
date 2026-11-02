import { renderConditionalDescription } from "../templates/renderConditionalDescription";
import { renderAdditionalFeatureItems } from "../additionalFeatures";

export const monitorTemplateSK = (
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
    portsLI: string,
    extraFeatures = "",
    speakers = false

) => renderConditionalDescription(`
 <div id="mainContainer" style="display: flex; align-items: center; flex-direction: column;">

    <div class="monitors_section">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../lcd.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/lcd.png" alt="lcd" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">${name}</h2>
            <div class="monitors_text_container">

                <p class="monitors_p"> Monitor ${producer} ${model} má displej ${diagonal} ${resolution}px s panelom ${monitorPanel}, ktorý ponúka široké pozorovacie uhly a vynikajúcu kvalitu obrazu pre kancelársku prácu aj multimédiá. Vybavený portami ${ports}, poskytuje všestrannosť pripojenia zariadení. <br></p>
                <p class="monitors_p">Vlastnosti:</p>
                <ul class="monitors_ul">

                    <li>Stav displeja: ${visualCondition}</li>
                    <li>Stav krytu: ${chasingCondition}</li>
                    ${additionalInfo1}
                    <li> Napájací kábel je súčasťou balenia </li>

                </ul>
                ${extraFeatures.trim() ? `<div class="monitor_extra_features"><p class="monitors_p">Ďalšie funkcie:</p><ul class="monitors_ul">${renderAdditionalFeatureItems(extraFeatures)}</ul></div>` : ""}
                <p class="monitors_p">Špecifikácie:</p>
                <ul class="monitors_ul">
                    <li>Rozlíšenie: ${resolution}px</li>
                    <li>Uhlopriečka: ${diagonal}</li>
                    <li>Typ panelu: ${monitorPanel}</li>
                    <li>Obnovovacia frekvencia: ${refreshRate}</li>
                    <li>Doba odozvy: ${responseTime}</li>
                    <li>Jas: ${brightness}</li>
                    <li>Kontrast: ${contrast}</li>
                    <li>Porty: ${ports}</li>
                    <li>HDR: ${HDR}</li>
                    ${speakers ? '<li>Reproduktory: vstavané</li>' : ''}
                </ul>
            </div>
        </div>
    </div>

    <div class="monitors_section" data-omit="${showIps}">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../ips.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ips.png" alt="ips" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Zamerajte sa na kvalitu</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Technológia IPS zaručuje široké pozorovacie uhly, lepšie podanie farieb, vyššiu kvalitu obrazu, minimálne skreslenie farieb a plynulé zobrazenie. Preto sa široko využíva v monitoroch pre profesionálov, grafikov, dizajnérov a ľudí, ktorí si cenia vysokú vizuálnu kvalitu.
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section" data-omit="${showTn}">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../tn.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/tn.png" alt="tn" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Zamerajte sa na kvalitu</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Monitory TN sa vyznačujú krátkou dobou odozvy, čo ich robí ideálnou voľbou pre hráčov a dynamické aplikácie. Zabezpečujú vysokú plynulosť obrazu, minimalizujú efekt rozmazania. Hoci pozorovacie uhly a reprodukcia farieb sú o niečo slabšie ako pri IPS paneloch, TN je ekonomické a výkonné riešenie pre používateľov, ktorí si cenia rýchlosť.
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
            <h2 class="monitors_h2">Rozlíšenie ${resolution}px</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Rozlíšenie ${resolution}px ponúka ostrý a detailný obraz. Každý pixel je dostatočne malý na to, aby nebol voľným okom viditeľný.
                    <br>
                    Takéto rozlíšenie umožňuje zobrazenie obrázkov, videí a textu s veľkou presnosťou a detailnosťou. Farby sú živé, kontrasty hlboké a detaily dobre viditeľné.
                    <br><br>
                    ${resolution}px je populárnym štandardom v mnohých zariadeniach ako televízory, monitory, projektory alebo smartfóny. Zaručuje vysokú kvalitu obrazu a zároveň je cenovo dostupné.
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
            <h2 class="monitors_h2">Široké možnosti pripojenia vďaka portom:</h2>
            <div class="monitors_text_container">
                <ul class="monitors_ul">
                    ${portsLI}
                </ul>
                <p class="monitors_p">
                    K monitoru dodávame napájací kábel. <br>
                    Signálny kábel nie je súčasťou balenia.<br>
                    Káble si môžete zakúpiť v iných aukciách.<br>
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
            <h2 class="monitors_h2">Chráňte životné prostredie</h2>
            <div class="monitors_text_container">
                <p class="monitors_p">
                    Monitory sú predávané ako repasy, t. j. použité. Triedime ich podľa vizuálneho stavu (A, A-, B a C). Stojan môže mať škrabance alebo odreniny. Hodnotíme predovšetkým stav displeja a rámikov. Technický stav je dôkladne skontrolovaný a otestovaný pri príjme aj pred odoslaním zákazníkovi!
                </p>
            </div>
        </div>
    </div>

    <div class="monitors_section" data-omit="${pivot}">
        <div class="monitorsLeft_container">
            <img onerror="this.onerror=null; this.src='../rotate.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/rotate.png" alt="pivot" class="monitors_logo">
            <div class="monitorsVl"></div>
        </div>
        <div>
            <h2 class="monitors_h2">Výhody funkcie Pivot:</h2>
            <div class="monitors_text_container">
                <ul class="monitors_ul">
                    <li>Flexibilita orientácie: Umožňuje otočenie obrazovky o 90 stupňov, čo umožňuje jednoduchú zmenu orientácie z horizontálnej na vertikálnu. Užitočné pri práci s dlhými dokumentmi, programovacím kódom alebo webovými stránkami.</li>
                    <li>Zlepšená ergonómia: Vertikálne otočenie obrazovky umožňuje pohodlnejšie čítanie a prezeranie obsahu, najmä pri dlhých textoch.</li>
                    <li>Prispôsobenie individuálnym preferenciám: Vďaka pivotu si používatelia môžu prispôsobiť orientáciu obrazovky podľa svojich potrieb a zvýšiť pohodlie pri dlhodobom používaní.</li>
                    <li>Široké využitie: Funkcia pivot je obľúbená medzi profesionálmi ako grafici, dizajnéri, programátori alebo dátoví analytici, ktorí vyžadujú väčšiu pracovnú plochu a efektivitu.</li>
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

`)

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
    additionalInfo2: string,
    portsLI: string
) => `
 <p> 🖥️<b>Monitor ${producer} ${model} </b> posiada ekran <b>${diagonal} ${resolution}</b> z matrycą <b>${monitorPanel}</b>, oferujący szerokie kąty widzenia i doskonałą jakość obrazu do pracy
                    biurowej i multimediów. Wyposażony w porty <b>${ports}</b>
                    , zapewnia wszechstronność podłączenia urządzeń. <br></p>
                    <p>Cechy:</p>
                    <ul>
                        ${additionalInfo1}
                        ${additionalInfo2}
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

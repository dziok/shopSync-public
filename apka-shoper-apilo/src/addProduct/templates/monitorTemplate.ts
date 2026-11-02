import { renderConditionalDescription } from "../templates/renderConditionalDescription";
import { renderAdditionalFeatureItems } from "../additionalFeatures";

export const monitorTemplate = (
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

                    <p class="monitors_p"> Monitor ${producer} ${model} posiada ekran ${diagonal} ${resolution}px z matrycą ${monitorPanel}, oferujący szerokie kąty widzenia i doskonałą jakość obrazu do pracy
                        biurowej i multimediów. Wyposażony w porty ${ports}
                        , zapewnia wszechstronność podłączenia urządzeń. <br></p>
                    <p class="monitors_p">Cechy:</p>
                    <ul class="monitors_ul">

                        <li>Stan matrycy: ${visualCondition}  </li>
                        <li>Stan obudowy: ${chasingCondition}</li>
                        ${additionalInfo1}
                        <li> Kabel zasilający w komplecie </li>


                    </ul>
                    ${extraFeatures.trim() ? `<div class="monitor_extra_features"><p class="monitors_p">Funkcje dodatkowe:</p><ul class="monitors_ul">${renderAdditionalFeatureItems(extraFeatures)}</ul></div>` : ""}
                    <p class="monitors_p">Specyfikacja:</p>
                    <ul class="monitors_ul">
                        <li>Rozdzielczość: ${resolution}px</li>
                        <li>Przekątna: ${diagonal}</li>
                        <li>Typ matrycy: ${monitorPanel}</li>
                        <li>Częstotliwość odświeżania: ${refreshRate}</li>
                        <li>Czas reakcji: ${responseTime}</li>
                        <li>Jasność: ${brightness}</li>
                        <li>Kontrast: ${contrast}</li>
                        <li>Złącza: ${ports}</li>
                        <li>HDR: ${HDR}</li>
                        ${speakers ? '<li>Głośniki: wbudowane</li>' : ''}
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
                <h2 class="monitors_h2">Postaw na jakość</h2>
                <div class="monitors_text_container">
                    <p class="monitors_p">
                        technologia IPS zapewnia szerokie kąty widzenia, lepszą reprodukcję kolorów, wyższą jakość
                        obrazu, minimalne zniekształcenia kolorów oraz płynne wyświetlanie obrazu. Dlatego jest szeroko
                        stosowana w monitorach dla profesjonalistów, entuzjastów grafiki, projektantów i osób, które
                        cenią sobie wysoką jakość wizualną.
                    </p>

                </div>
            </div>
        </div>


        <div class="monitors_section" data-omit="${showTn}">
            <div class="monitorsLeft_container">
                <img onerror="this.onerror=null; this.src='../tn.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/tn.png" alt="ips" class="monitors_logo">
                <div class="monitorsVl"></div>
            </div>
            <div>
                <h2 class="monitors_h2">Postaw na jakość</h2>
                <div class="monitors_text_container">
                    <p class="monitors_p">
                        Monitory TN charakteryzują się krótkim czasem reakcji, co czyni je idealnym wyborem dla graczy i dynamicznych aplikacji. 
                        Zapewniają wysoką płynność obrazu, minimalizując efekt smużenia. Choć kąty widzenia i odwzorowanie kolorów są nieco słabsze niż w panelach IPS,
                        TN to ekonomiczne i wydajne rozwiązanie dla użytkowników ceniących szybkość działania.
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
                <h2 class="monitors_h2">Rozdzielczość ${resolution}px</h2>
                <div class="monitors_text_container">
                    <p class="monitors_p">
                        Rozdzielczość ${resolution}px oferuje ostry i szczegółowy obraz. Każdy piksel jest dostatecznie mały, aby nie było
                        widocznych pojedynczych pikseli gołym okiem.
                        <br>
                        Taka rozdzielczość umożliwia wyświetlanie obrazów, filmów i tekstów z dużą
                        precyzją i szczegółowością. Kolory są wyraziste, kontrasty głębokie, a detale dobrze widoczne.
                        <br>
                        <br>
                        ${resolution}px jest popularnym standardem w wielu urządzeniach, takich jak telewizory, monitory
                        komputerowe, projektory czy smartfony. Zapewnia wysoką jakość obrazu, a jednocześnie jest
                        stosunkowo przystępny cenowo.

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
                <h2 class="monitors_h2">Szerokie możliwości połączeń dzięki portom:</h2>
                <div class="monitors_text_container">

                    <ul class="monitors_ul">
                        ${portsLI}
                    </ul>
                    <p class="monitors_p">
                        Do monitora dodajemy Kabel zasilający. <br>
                        Kabel sygnałowy nie jest dodawany do monitorów.<br>
                        Kable do kupienia na innych aukcjach.<br>
                    </p>
                </div>
            </div>
        </div>

        <div class="monitors_section" >
            <div class="monitorsLeft_container">
                <img onerror="this.onerror=null; this.src='../recycling.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/recycling.png" alt="recycling" class="monitors_logo">
                <div class="monitorsVl"></div>
            </div>
            <div>
                <h2 class="monitors_h2">Zadbaj o środowisko</h2>
                <div class="monitors_text_container">
                    <p class="monitors_p">
                        Monitory są sprzedawane jako Poleasingowe tj. Używane. Dzielimy je na klasy na podstawie stanu
                        wizualnego(A, A-,B oraz C). Podstawka monitora może posiadać ryski, przetarcia, Oceniany jest
                        głównie stan matrycy oraz widocznych ramek. Stan techniczny jest dokładnie sprawdzany oraz
                        testowany przy dostawie do nas oraz przed wysyłką do klienta!
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
                <h2 class="monitors_h2">Zalety funkcji Pivot:</h2>
                <div class="monitors_text_container">
                    <ul class="monitors_ul">
                        <li>Elastyczność orientacji: Pozwala na obrót ekranu o 90 stopni, umożliwiając łatwą zmianę
                            orientacji z poziomej na pionową. Jest przydatna przy pracy z długimi dokumentami, kodem
                            programistycznym czy stronami internetowymi.</li>
                        <li>Poprawiona ergonomia: Obrót ekranu do pozycji pionowej pozwala na wygodniejsze czytanie i
                            przeglądanie treści, szczególnie w przypadku dłuższych bloków tekstu.</li>
                        <li>Dostosowanie do indywidualnych preferencji: Dzięki funkcji pivot, użytkownicy mogą
                            dostosować orientację ekranu do swoich indywidualnych preferencji i zapewnić sobie komfort
                            podczas długotrwałego korzystania z monitora.</li>
                        <li>Szerokie zastosowanie: Funkcja pivot jest szczególnie popularna wśród profesjonalistów,
                            takich jak graficy, projektanci, programiści czy analitycy danych, którzy wymagają większej
                            przestrzeni roboczej i wyższej efektywności.</li>
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

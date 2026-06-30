import { diskTypesDescriptions, ramTypesDescriptions } from "../additionalDescriptions/pcAdditionalDescription"


export const pcTemplate = (
    title: string,
    grade: string,
    cpu: string,
    cpuModel: string,
    condition: string,
    caseType: string,
    gpu: string,
    diskType: string,
    diskCapacity: string,
    system: string,
    ramAmount: string,
    ramType: string,
    dvd: string,
    ports: string,
    additionalInfo: string,
    infoActive: string,
    cpuTypesDescriptions: string,
    ramTypesDescriptions: string,
    diskTypesDescriptions: string,
    systemDescriptions: string,
    included: string,
    imgSrc: string,
    desktopStatus: string,
    gpuDescriptions: string,
    resolution: string,
    matrixType: string,
    matrixSize: string,
    Frequency: string,
    touchScreen: string,
    microphone: string,
    camera: string,
) => `
<div id="mainContainer" style="display: flex !important; align-items: center !important; flex-direction: column !important;">

        <div class="poleasingowe_section">
            <div>
                <img  onerror="this.onerror=null; this.src='../desktop.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/desktop.png" class="desktop_logo">
            </div>
            <div>
                <h2 class="poleasingowe_h2">${title}</h2>
                <div class="poleasingowe_text_container">
                    <p class="poleasingowe_p system_${system}" style="color: #313131 !important;"> Komputer posiada oryginalny system ${system}
                        64bit w
                        polskiej wersji językowej, wraz z najnowszymi sterownikami oraz dodatkową przeglądarką
                        Internetową. po rozpakowaniu z pudełka jest gotowy do pracy<br></p>
                    <div class="poleasingowe_text_container" style="display: ${infoActive}">
                        <p class="poleasingowe_p" style="color: #313131 !important;">uwagi:</p>
                        <ul class="poleasingowe_ul" >
                            <li><b class="poleasingowe_b">${additionalInfo}</b></li>
                        </ul>
                    </div>
                    <p class="poleasingowe_p" style="color: #313131 !important;">Specyfikacja:</p>
                    <ul class="poleasingowe_ul">
                        <li><b class="poleasingowe_b">Stan:</b> ${condition} </li>
                        <li>${grade}</li>
                        <li><b class="poleasingowe_b">Rodzaj obudowy:</b> ${caseType}</li>
                        <li><b class="poleasingowe_b">Procesor:</b> ${cpu}-${cpuModel}</li>
                        <li><b class="poleasingowe_b">Karta Graficzna:</b> ${gpu}</li>
                        <li><b class="poleasingowe_b">Dysk:</b> ${diskType} ${diskCapacity}</li>
                        <li><b class="poleasingowe_b">W zestawie:</b> ${included}</li>
                        <li><b class="poleasingowe_b">System:</b> ${system}</li>
                        <li><b class="poleasingowe_b">Pamięć</b> ${ramAmount} ${ramType}</li>
                        <li><b class="poleasingowe_b">Napęd:</b> ${dvd}</li>
                        <li><b class="poleasingowe_b">Porty:</b> ${ports}</li>
                    </ul>
                </div>
            </div>
        </div>

                <div class="poleasingowe_section  poleasingoweCaseType_${caseType}">
            <div>
                <img  onerror="this.onerror=null; this.src='../aio.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/aio.png" class="aio_logo">
            </div>
            <div>
                <h2 class="poleasingowe_h2">All-in-One – Kompaktowy styl i wydajność w jednym urządzeniu</h2>
                <div class="poleasingowe_text_container">
                    <p class="poleasingowe_p" style="color: #313131 !important;"> Komputer All-in-One to kompaktowe rozwiązanie, które łączy jednostkę centralną i monitor w jednym urządzeniu. Dzięki temu zajmuje mniej miejsca na biurku, oferując estetyczny wygląd i łatwiejsze zarządzanie kablami. Idealny do pracy biurowej, nauki i codziennego użytkowania w domu.<br></p>

                    <p class="poleasingowe_p" style="color: #313131 !important;">Specyfikacja konstrukcji AIO:</p>
                    <ul class="poleasingowe_ul">
                        <li><b class="poleasingowe_b">Rozdzielczość:</b> ${resolution}px</li>
                        <li><b class="poleasingowe_b">Typ matrycy:</b> ${matrixType} </li>
                        <li><b class="poleasingowe_b">Rozmiar ekranu:</b> ${matrixSize} </li>
                        <li><b class="poleasingowe_b">Częstotliwość odświerzania ekranu:</b> ${Frequency} </li>
                        <li><b class="poleasingowe_b">Ekran dotykowy:</b> ${touchScreen} </li>
                        <li><b class="poleasingowe_b">Mikrofon:</b> ${microphone} </li>
                        <li><b class="poleasingowe_b">Kamerka internetowa:</b> ${camera} </li>
                    </ul>
                </div>
            </div>
        </div>


        <div id="poleasingowe_photo_container">
            <img src="${imgSrc}">
            
        </div>

        <div class="poleasingowe_section2">
            <div class="poleasingowe_boxes">
                <img onerror="this.onerror=null; this.src='../cpu.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/cpu.png" alt="cpu" class="poleasingowe_icon">
                <h3 class="poleasingowe_h3">Procesor ${cpu}-${cpuModel}</h3>
                <p class="poleasingowe_p2">
                ${cpuTypesDescriptions}
                </p>
            </div>
            <div class="poleasingowe_boxes">
                <img onerror="this.onerror=null; this.src='../ram.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ram.png" alt="cpu" class="poleasingowe_icon">
                <h3 class="poleasingowe_h3">Pamięć RAM ${ramAmount} ${ramType}</h3>
                <p class="poleasingowe_p2">
                ${ramTypesDescriptions}
                </p>
            </div>
            <div class="poleasingowe_boxes disk_${diskType}">
                <img onerror="this.onerror=null; this.src='../drive.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/drive.png" alt="cpu" class="poleasingowe_icon">
                <h3 class="poleasingowe_h3">Dysk ${diskType} ${diskCapacity}</h3>
                <p class="poleasingowe_p2">
                ${diskTypesDescriptions}
                </p>
            </div>
            <div class="poleasingowe_boxes">
                <img onerror="this.onerror=null; this.src='../cart.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/cart.png" class="poleasingowe_icon">
                ${desktopStatus}
        </div>
                    <div class="poleasingowe_boxes">
                <img onerror="this.onerror=null; this.src='../gpu.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/gpu.png" alt="cpu" class="poleasingowe_icon">
                <h3 class="poleasingowe_h3">Karta graficzna ${gpu}</h3>
                <p class="poleasingowe_p2">
                ${gpuDescriptions}
                </p>
            </div>

            ${systemDescriptions}

        </div>

    </div>

    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

        .system_Brak , .disk_Brak{
        display: none
        }

            .poleasingoweCaseType_Tower, .poleasingoweCaseType_Mid, .poleasingoweCaseType_SFF, .poleasingoweCaseType_USDT, .poleasingoweCaseType_Tiny, .poleasingoweCaseType_Micro, .poleasingoweCaseType_USFF, .poleasingoweCaseType_Mini, .poleasingoweCaseType_Mini_Tower {
            display: none !important
            }

        .poleasingowe_h3 {
            color: #313131;
            font-size: 20px;
            margin: 10px 0 0 0;
            font-weight: 410;
        }

        .poleasingowe_h2 {
            color: #313131;
            font-size: 30px;
            margin-top: 10px;
            margin-bottom: 5px;
            font-weight: 410;
        }

        .poleasingowe_p {
            font-size: 20px;
            line-height: 1.5;
            color: #717171;
        }

        .poleasingowe_p2 {
            font-size: 16px;
            line-height: 1.5;
            color: #494949;
            text-align: justify
        }

        .poleasingowe_ul {
            font-size: 16px;
            line-height: 2;
            margin-left: 2rem;
            color: #494949;
        }

        #poleasingowe_photo_container {
            margin-bottom: 20px;
            display: flex;
            width: 100%;
            /* max-width: 1200px; */
            justify-content: center;

        }

        .poleasingowe_text_container {
            display: flex;
            flex-direction: column;
            width: 100%;
            justify-content: center;
        }

        .poleasingowe_section {
            width: 100%;
            /* max-width: 1200px; */
            display: flex;
            flex-direction: row;
            margin: 10px 0 10px 0;
        }

        .windows_logo {
            height: 90px;
            margin-right: 50px;
            margin-top: 20px;
        }
        .desktop_logo{
            height: 90px;
            margin-right: 60px;
            margin-top: 20px;
        }
            .aio_logo{
            height: 90px;
            margin-right: 30px;
            margin-top: 20px;
            }

        .poleasingowe_boxes {
            width: 42%;
            background-color: #f7f7f7;
            padding: 30px;
            border-radius: 20px;
            flex-shrink: 0;
            flex-grow: 1;
        }

        .poleasingowe_section2 {
            /* max-width: 1200px; */
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 1rem;
        }

        .poleasingowe_photo {
            height: 450px;
            margin: auto;
        }

        .poleasingowe_icon {
            width: 60px;
        }

        .poleasingowe_b {
        color: #434343;
        }
        .warningText{
            color: #e07100;
        font-weight: 500;
        }

        @media (max-width: 600px) {
            .poleasingowe_section {
                display: flex;
                flex-direction: column;
                margin-left: 10px;
                margin-right: 10px;
            }

            .poleasingowe_section2 {
                margin-left: 10px;
                margin-right: 10px;
            }
        }
    </style>
`



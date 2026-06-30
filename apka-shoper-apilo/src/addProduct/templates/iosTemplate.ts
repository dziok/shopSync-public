export const IOSTemplate = (
    additionalInfo: string,
    G5: boolean,
    NFC: boolean,
    wirelessCharging: boolean,
    dualSim: boolean,
    waterproof: boolean,
    screenName: string,
    screen: string,
    matrixGrade: string,
    resolution: string,
    diagonal: string,
    lens_ultraWide: boolean,
    lens_tele: boolean,
    lens_lidar: boolean,
    category: string,
    backCamera: string,
    frontCamera: string,
) => `


<div style="display: flex; align-items: center; flex-direction: column; ">

    <div id="mainContainer" style="max-width: 1200px;">

        <div class="warning">
            <img class="phone_icon_sm" onerror="this.onerror=null; this.src='../warning.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/warning.png" alt="warning"/>
            
            <div class="warning_descriptions_container">
                <p  class="phone_p1"> ${additionalInfo}</p>
                <p class="phone_p1">${matrixGrade}</p>
                <p class="phone_p1">Zachęcamy do odwiedzenia naszej galerii zdjęć produktu, gdzie znajdą państwo
                    szczegółowe fotografie, które pozwolą lepiej poznać nasz produkt!</p>
                <p class="phone_p1">Urządzenie sprzedawane w zastępczym opakowaniu bez ładowarki i kabla.</p>
            </div>

        </div>
        <div class="systemLogoContainer">
            <div class="systemLogoContainer">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="#424242"
                    stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-settings-icon lucide-settings">
                    <path
                        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <h2 class="phone_H2">Cechy urządzenia</h2>
            </div>
        </div>
        <div class="spec">


            <div class="spec_element_w2">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-camera-icon lucide-camera">
                        <path
                            d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3_w2">Wszechstronny aparat do codziennych ujęć</h3>
                <p class="phone_spec_p_w2">Urządzenie posiada obiektywy:</p>
                <div class="cameraLensContainer">
                        <p class="lens_p"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>  główny ${backCamera} MPX</p>
                        <p class="lens_p ${lens_ultraWide}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>        Ultraszerokokątny </p>
                        <p class="lens_p ${lens_tele}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>  Teleobiektyw </p>
                        <p class="lens_p ${lens_lidar}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> LiDAR (czujnik głębi)</p>
                        <p class="lens_p"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>   Aparat selfie ${frontCamera} MPX</p>
                </div>
                <p class="phone_spec_p_w2">Urządzenie wyposażony jest w wysokiej jakości aparat, który świetnie sprawdzi się zarówno w fotografii dziennej, jak i w trudniejszych warunkach oświetleniowych.</p>
            </div>

            <div class="spec_element_w2">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-smartphone-icon lucide-smartphone">
                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                        <path d="M12 18h.01" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3_w2">Wyświetlacz ${screenName}</h3>
                <p class="phone_spec_p_w2"> Specyfikacja matrycy</p>
                                    <div class="cameraLensContainer">
                        <p class="lens_p"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>  rozdzielczość ${resolution} px</p>
                        <p class="lens_p"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>        przekątna ${diagonal}"</p>
                        <p class="lens_p"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>  ${screen} </p>
                        <p class="lens_p"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> ${screenName}</p>

                </div>
                    <p class="phone_spec_p_w2">Zachwycający ekran z perfekcyjnym kontrastem, głęboką czernią i kinową
                    jakością
                    obrazu.</p>
            </div>

            <div class="spec_element ">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#0F73FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-waypoints-icon lucide-waypoints">
                        <circle cx="12" cy="4.5" r="2.5" />
                        <path d="m10.2 6.3-3.9 3.9" />
                        <circle cx="4.5" cy="12" r="2.5" />
                        <path d="M7 12h10" />
                        <circle cx="19.5" cy="12" r="2.5" />
                        <path d="m13.8 17.7 3.9-3.9" />
                        <circle cx="12" cy="19.5" r="2.5" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3"> <span class=${G5}>5G,</span> Wi-Fi<span class=${NFC}>, NFC</span>, <span> Bluetooth</span></h3>
                <p class="phone_spec_p ">Nowoczesne technologie bezprzewodowe, które zapewniają szybki internet,
                    płatności zbliżeniowe i stabilne połączenia.</p>
            </div>



            <div class="spec_element ${wirelessCharging}">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#0F73FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-zap-icon lucide-zap">
                        <path
                            d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3">Ładowanie bezprzewodowe</h3>
                <p class="phone_spec_p">Błyskawiczne uzupełnianie energii – z kablem lub bez niego. Po prostu połóż i
                    ładuj.</p>
            </div>

            <div class="spec_element ${dualSim}">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#0F73FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-diamond-icon lucide-diamond">
                        <path
                            d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3 ">Dual SIM</h3>
                <p class="phone_spec_p">Wygoda dwóch numerów w jednym urządzeniu – idealna na podróże i do pracy.</p>
            </div>
            <div class="spec_element">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 24 24" fill="none"
                        stroke="#0F73FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-battery-full-icon lucide-battery-full">
                        <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
                        <line x1="22" x2="22" y1="11" y2="13" />
                        <line x1="6" x2="6" y1="11" y2="13" />
                        <line x1="10" x2="10" y1="11" y2="13" />
                        <line x1="14" x2="14" y1="11" y2="13" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3">Bateria</h3>
                <p class="phone_spec_p">Energia, która dotrzyma Ci kroku przez cały dzień – z niezawodną wydajnością i
                    długą żywotnością.</p>
            </div>
            <div class="spec_element ${waterproof}">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#0F73FE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="lucide lucide-bubbles-icon lucide-bubbles">
                        <path d="M7.2 14.8a2 2 0 0 1 2 2" />
                        <circle cx="18.5" cy="8.5" r="3.5" />
                        <circle cx="7.5" cy="16.5" r="5.5" />
                        <circle cx="7.5" cy="4.5" r="2.5" />
                    </svg>
                </div>
                <h3 class="phone_spec_h3">Wodoodporna konstrukacja</h3>
                <p class="phone_spec_p">Telefon wyposażony jest w wodoodporną obudowę, co zapewnia większą ochronę w codziennym użytkowaniu.</p>
            </div>
        </div>



        <div class="section_system">
            <div class="systemLogoContainer">
                    <img class="systemLogo" onerror="this.onerror=null; this.src='../ios.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ios.png" alt="IOS logo"/>
                <h2 style="margin-left: 20px;" class="phone_H2">IOS - system stworzony dla ${category}’a</h2>
            </div>
            <p class="phone_p2">System iOS to serce każdego ${category}’a.
                Zapewnia niezrównaną płynność działania,
                bezpieczeństwo i doskonałą
                współpracę z urządzeniami Apple. Idealny wybór dla osób,
                które cenią intuicyjność, stabilność i
                elegancki interfejs.</p>

            <div class="phone_section_container">

                <div class="phone_section_4">
                    <img class="phone_img_2" onerror="this.onerror=null; this.src='../continuity_img.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/continuity_img.png" alt="continuity"/>
                </div>

                <div class="phone_section_3">
                    <div class="img_description_container">
                            <img class="phone_img_s" onerror="this.onerror=null; this.src='../continuity.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/continuity.svg" alt="continuity"/>
                        <h2 class="phone_h2_color_4">Idealna współpraca z innymi urządzeniami Apple</h2>
                    </div>
                    <p class="phone_p1">Korzystasz z MacBooka, Apple Watcha albo iPada? Dzięki iOS wejdziesz w pełni w
                        świat Apple i skorzystasz z takich funkcji jak Handoff, AirDrop, iMessage na wszystkich
                        urządzeniach, czy uniwersalny schowek. Zdjęcie zrobione urządzeniem Apple pojawia się automatycznie na
                        Twoim Macu, a rozmowę SMS możesz kontynuować na iPadzie – wszystko działa jak jeden, zgrany
                        ekosystem.</p>
                </div>
            </div>


            <div class=" phone_section_container_2">
                <div class="phone_section_1">
                    <div class="img_description_container">
                        <img class="phone_img_s" onerror="this.onerror=null; this.src='../safe.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/safe.png" alt="privacy"/>
                        <h2 class="phone_h2_color_1">Prywatność i
                            bezpieczeństwo – Twoje dane są tylko Twoje</h2>
                    </div>
                    <p class="phone_p1">iOS od początku został
                        zaprojektowany z myślą o prywatności. Dane
                        biometryczne
                        (Face ID, Touch
                        ID)
                        przechowywane są lokalnie na urządzeniu, a aplikacje
                        muszą prosić o zgodę na śledzenie Twojej
                        aktywności. Apple nie gromadzi Twoich danych do
                        celów reklamowych, co sprawia, że iOS to jeden z
                        najbezpieczniejszych systemów mobilnych na
                        świecie.</p>
                </div>
                <div class="phone_section_2">
                     <img class="phone_img_l" onerror="this.onerror=null; this.src='../i_safe.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/i_safe.png" alt="privacy"/>
                </div>
            </div>


            <!-- <div class="phone_section_container">

                <div class="phone_section_5">
                    <img src="./phone-img/wig.png" class="phone_img_m" />
                      <img class="phone_img_m" onerror="this.onerror=null; this.src='../wig.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/wig.png" alt="privacy"/>
                </div>

                <div class="phone_section_6">
                    <div class="img_description_container">
                        <img src="./phone-img/phone_palette.png" class="phone_img_s" />
                        <h2 class="phone_h2_color_3">Nowoczesny, intuicyjny
                            interfejs</h2>
                    </div>
                    <p class="phone_p1">Design iOS to połączenie prostoty z
                        elegancją. Ikony, menu i gesty zostały
                        zaprojektowane z myślą o wygodzie użytkownika.
                        System jest łatwy do opanowania nawet dla osób,
                        które nigdy wcześniej nie korzystały ze smartfona.
                        Dzięki dynamicznym widżetom, trybowi ciemnemu
                        i możliwości personalizacji ekranu głównego, możesz
                        dostosować wygląd urządzenia do swojego
                        stylu.</p>
                </div>

                <div class="phone_section_5">
                    <img src="./phone-img/personalisation.png" class="phone_img_m" />
                </div>
            </div> -->
            <!-- <div class="phone_section_container">

                <div class="phone_section_5">
                    <img src="./phone-img/wig.png" class="phone_img_m" />
                </div>

                <div class="phone_section_6">
                    <div class="img_description_container">
                        <img src="./phone-img/phone_palette.png" class="phone_img_s" />
                        <h2 class="phone_h2_color_3">Nowoczesny, intuicyjny
                            interfejs</h2>
                    </div>
                    <p class="phone_p1">Design iOS to połączenie prostoty z
                        elegancją. Ikony, menu i gesty zostały
                        zaprojektowane z myślą o wygodzie użytkownika.
                        System jest łatwy do opanowania nawet dla osób,
                        które nigdy wcześniej nie korzystały ze smartfona.
                        Dzięki dynamicznym widżetom, trybowi ciemnemu
                        i możliwości personalizacji ekranu głównego, możesz
                        dostosować wygląd urządzenia do swojego
                        stylu.</p>
                </div>

                <div class="phone_section_5">
                    <img src="./phone-img/personalisation.png" class="phone_img_m" />
                </div>
            </div> -->


            <div class="phone_section_container">
                <div class="phone_section_4">
                      <img  class="phone_img_2" onerror="this.onerror=null; this.src='../appStore_apps.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/appStore_apps.png" alt="IOS apps"/>
                </div>
                <div class="phone_section_3">
                    <div class="img_description_container">
                          <img  class="phone_img_s" onerror="this.onerror=null; this.src='../appStore_logo.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/appStore_logo.png" alt="IOS logo"/>
                        <h2 class="phone_h2_color_2">App Store – miliony aplikacji dostosowanych do iOS</h2>
                    </div>
                    <p class="phone_p1">iOS wykorzystuje pełny potencjał
                        procesorów Apple co przekłada się na
                        błyskawiczne działanie aplikacji, płynne przewijanie
                        oraz
                        bezproblemowe działanie gier i multimediów. System
                        inteligentnie zarządza pamięcią i energią, co
                        pozwala na długą pracę na jednym ładowaniu bez
                        utraty wydajności.</p>
                </div>
            </div>


        </div>


        </div>
    </div>

    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }
            .lens_p{
            font-size:20px
            text-align: center;
            margin: 5px;
            display: flex;
            align-items: center;
            background-color: #f5f5f7;
            padding: 10px;
            border-radius: 30px;
            font-weight: 600;
            color: #0d73fe;
            margin-left: 5px
            }

            .warning_descriptions_container {
            flex-direction: column;
            display: flex;
            gap: 10px
        }

            .cameraLensContainer{
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            }

        .warning {
            background-color: #f5f5f7;
            border-radius: 30px;
            padding: 30px;
            display: flex;
            flex-direction: row;
            margin-top: 30px;
        }
            .false{
                display: none !important;
            }

        .gradient-text {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(90deg, #4caf50, #2196f3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }

        .phone_icon_sm {
            width: 35px;
            height: 30px;
            margin-right: 20px;
            margin-top: 5px;
        }

        .phone_p1 {
            font-size: 17px;
            font-weight: 500;
            margin: 0;
            color: #1d1d20;
        }

        .phone_icon_s {
            width: 35px;
        }

        .phone_icon_s2 {
            width: 45px;
        }

        .phone_icon_s3 {
            width: 30px;
        }

        .spec_logo {
            width: 80px;
        }

        .phone_spec_p {
            text-align: center;
            font-size: 16px;
            color: #1d1d20;
        }

        .phone_spec_p_w2 {
            text-align: center;
            font-size: 16px;
            color: #ffffff;
            font-weight: 500
        }

        .icon-wrapper {
            height: 80px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .phone_spec_h3 {
            text-align: center;
            margin: 0 0 10px;
            font-size: 20px;
            font-weight: 600;
            line-height: 1.2;
            color: #0F73FE;
        }

        .phone_spec_h3_w2 {
            text-align: center;
            margin: 0 0 10px;
            font-size: 23px;
            font-weight: 600;
            line-height: 1.2;
            color: #fff;
        }

        .spec_element p {
            margin: 10px 0 0 0;
            min-height: 4em;

        }

        .spec {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 1rem;
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
        }

        .spec_element {
            flex: 1 1 calc(20% - 1rem);
            /* 3 na rząd z odstępami */
            min-width: 200px;
            border-radius: 30px;
            padding: 30px;
            box-sizing: border-box;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            align-content: space-around;
        }

        .spec_element_w2 {
            flex: 1 1 calc(50% - 1rem);
            min-width: 200px;
            border-radius: 30px;
            padding: 30px;
            box-sizing: border-box;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            align-content: space-around;
            background-color: rgb(245, 243, 239);
            background-color: #0F73FE;
        }

        @media (max-width: 768px) {
            .spec_element {
                flex: 1 1 calc(50% - 1rem);
            }
        }

        @media (max-width: 480px) {
            .spec_element {
                flex: 1 1 100%;
            }
        }

        .phone_p2 {
            font-size: 20px;
            font-weight: 500;
            color: black
        }


        .phone_h2_color_1 {
            color: rgb(15, 115, 254);
            font-size: 25px;
            padding-top: 20px;
            padding-bottom: 20px;
        }

        .phone_h2_color_2 {
            color: #55bef0ff;
            font-size: 25px;
        }

        .phone_h2_color_3 {
            color: rgb(21, 200, 63);
            font-size: 25px;
        }

        .phone_h2_color_4 {
            color: rgb(255 152 1);
            font-size: 25px;
        }


        .img_description_container {
            width: 100%;
            text-align: left;
        }

        .phone_img_s {
            width: 70px;
            font-size: 70px;
            line-height: 0;
            box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
            border-radius: 16px;
        }

        .phone_img_l {
            width: 60%;
            max-width: 350px;
        }

        .phone_img_m {
            width: 80%;
            max-width: 350px;
        }

        .phone_img_2 {
            width: 95%;
        }

        .phone_section_container {
            gap: 25px;
            margin-top: 50px;
            flex-direction: row;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
        }

        .phone_section_container_2 {
            gap: 25px;
            margin-top: 50px;
            flex-direction: row;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            background: #FBFBFB;
            background: linear-gradient(90deg, rgba(251, 251, 251, 1) 0%, rgba(245, 245, 247, 1) 100%);
            border-radius: 30px;
        }

        .phone_section_1 {
            width: 50%;
            min-height: 400px;
            /* background-color: #fbfbfb; */
            border-radius: 30px;
            padding: 40px;
            color: #292929;
            display: flex;
            align-items: center;
            flex-direction: column;
            flex-grow: 1;
        }

        .phone_section_2 {
            width: 30%;
            min-height: 200px;
            /* background-color: #fbfbfb; */
            border-radius: 30px;
            color: #292929;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 20px 20px 0px 20px;
            flex-grow: 1;
        }

        .phone_section_5 {
            width: 20%;
            min-height: 200px;
            /* background-color: #fbfbfb; */
            border-radius: 30px;
            color: #292929;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px 30px 30px 30px;
            flex-grow: 1;
        }

        .phone_section_6 {
            width: 39%;
            min-height: 400px;
            background-color: #fbfbfb;
            border-radius: 30px;
            padding: 40px;
            color: #292929;
            display: flex;
            align-items: center;
            flex-direction: column;
            flex-grow: 1;
        }

        .phone_section_3 {
            width: 50%;
            min-height: 200px;
            background-color: #fbfbfb;
            border-radius: 30px;
            padding: 40px;
            color: #292929;
            display: flex;
            align-items: center;
            flex-direction: column;
            flex-grow: 1;
        }

        .phone_section_4 {
            width: 30%;
            min-height: 200px;
            background-color: #fbfbfb;
            border-radius: 30px;
            color: #292929;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 20px 20px 0px 20px;
            flex-grow: 1;
        }

        .phone_H2 {
            font-weight: 600;
            font-size: 40px;
            color: #414141;
        }

        .systemLogoContainer {
            margin-left: 10px;
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-top: 20px;
            margin-bottom: 5px;
        }

        .systemLogo {
            width: 100px;
        }


        .section_system {
            min-height: 1000px;
            max-width: 1200px;
            border-radius: 30px;
            margin-top: 50px;
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

            .systemLogoContainer {
                flex-wrap: wrap;
                justify-content: center;
            }

            .phone_H2 {
                margin: 5px;
                text-align: center
            }

            .systemLogoContainer {
                margin: 5px;
            }

            .warning {
                flex-direction: column;
                margin-top: 30px;
                gap: 10px;
            }

            .phone_section_6 {
                width: 100%;
            }
        }
    </style>

</div>

`


export const IOSTemplateCamera = (
    lens_ultraWide: boolean,
    lens_tele: boolean,
    lens_lidar: boolean,
) =>
    `
<h3">Wszechstronny aparat do codziennych ujęć</h3>
<p">Urządzenie posiada obiektywy:</p>
<div class="cameraLensContainer">
        <p> główny </p>
        <p> Ultraszerokokątny </p>
        <p> Teleobiektyw </p>
        <p> LiDAR (czujnik głębi) </p>
        <p> Aparat selfie </p>
</div>
<p>Urządzenie wyposażony jest w wysokiej jakości aparat, który świetnie sprawdzi się zarówno w fotografii dziennej, jak i w trudniejszych warunkach oświetleniowych.</p>
`




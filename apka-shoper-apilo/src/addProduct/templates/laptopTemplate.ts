export const LaptopTemplate = (
    system: string,
    cpu: string,
    cpuModel: string,
    gpu: string,
    diskType: string,
    diskSize: string,
    ramType: string,
    ramAmount: string,
    screen: string,
    showVebCam: boolean,
    showLibre: boolean,
    battery: string,
    matrixDescription: string,
    grade: string,
    keyboard: string,
    showWin11: boolean,
    showWin10: boolean,
    showMacOS: boolean,
    additionalInfo_keyboard: string,
    additionalInfo_case: string,
    additionalInfo_matrix: string,
    touchScreen: string,
    showModem: boolean,
    showWin11info: boolean

) => `
   
    <div id="mainContainer" class="flex-center-column">
        <div class="content-wrapper">
        <div class="laptop_additionalInfo">
    <div class="laptop_p">
        ✔️ Laptop poleasingowy w bardzo dobrym stanie technicznym, <b>dokładnie</b> przetestowany przed wysyłką i gotowy do pracy. <br>
        <span class="laptop_p ${showWin11}">
            Posiada zainstalowany ✔️ <b>oryginalny</b> system ✔️ 
            <b>${system} w polskiej wersji językowej,</b> 
            wraz z ✔️<b>najnowszymi sterownikami,</b>  
            <span class="laptop_p ${showLibre}">oprogramowaniem <b>biurowym</b></span> 
            oraz dodatkową przeglądarką Internetową.
        </span>
        Laptop po rozpakowaniu z pudełka jest ✔️ <b>gotowy do pracy.</b>
    </div>
</div>
            <div class="greenGradientBox">
                <h3 class="gradientFont_green laptop_h2">Cechy Laptopa</h3>
                <div class="features-section">
                    <div class="laptop_featureBox">
                        <div class="iconBox">
                            <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_CPU.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_CPU.svg" alt="CPU"/>
                        </div>
                        <h3 class="laptop_h3_2">Wydajny procesor</h3>
                        <p class="laptop_p2"> ${cpuModel}</p>
                    </div>
                    <div class="laptop_featureBox">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_GPU.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_GPU.svg" alt="GPU"/>
                        <h3 class="laptop_h3_2">Karta Graficzna</h3>
                        <p class="laptop_p2">${gpu}</p>
                    </div>
                    <div class="laptop_featureBox">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_SSD.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_SSD.svg" alt="SSD" />
                        <h3 class="laptop_h3_2">Dysk</h3>
                        <p class="laptop_p2">${diskSize} ${diskType}</p>
                    </div>
                    <div class="laptop_featureBox">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_RAM.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_RAM.svg" alt="RAM" />
                        <h3 class="laptop_h3_2">Pamięć RAM</h3>
                        <p class="laptop_p2">${ramAmount} ${ramType}</p>
                    </div>
                    <div class="laptop_featureBox">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_DISPLAY.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_DISPLAY.svg" alt="Matryca" />
                       <h3 class="laptop_h3_2">Matryca <span class="laptop_h3_2 display_${touchScreen}">dotykowa</span></h3> 
                        <p class="laptop_p2">${screen}</p>
                    </div>
                    <div class="laptop_featureBox">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_WINDOWS-08.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_WINDOWS-08.svg" alt="Windows" />
                        <h3 class="laptop_h3_2">Zainstalowany system</h3>
                        <p class="laptop_p2">${system}</p>
                    </div>
                    <div class="laptop_featureBox ${showVebCam}">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_WINDOWS-07.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_WINDOWS-07.svg" alt="Kamerka internetowa" />
                        <h3 class="laptop_h3_2" >Wbudowana kamerka</h3>
                        <p class="laptop_p2">idealna do zdalnej nauki i wideokonferencji</p>
                    </div>
                    <div class="laptop_featureBox ${showModem}">
                        <img class="laptop_icon" onerror="this.onerror=null; this.src='../ikony_WIFI.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/ikony_WIFI.svg" alt="Kamerka internetowa" />
                        <h3 class="laptop_h3_2" >Modem 4G</h3>
                        <p class="laptop_p2">Korzystaj z internetu mobilnego bez dodatkowych urządzeń</p>
                    </div>
                </div>
            </div>
            <div class="laptop_section3 laptop_${diskType}">
                <div class="infoBoxes transparent-bg">
                    <h3 class="gradientFont laptop_h3">Superszybki dysk SSD</h3>
                    <ul class="laptop_p">
                        <li>To dysk półprzewodnikowy, dzięki niemu laptop działa znacznie szybciej. W odróżnieniu od
                            klasycznych dysków HDD nie ma ruchomych części, dlatego też działa niezwykle cicho i sprawia
                            że laptop zużywa mniej energii.</li>
                        <li>To dysk półprzewodnikowy, dzięki niemu laptop działa znacznie szybciej. W odróżnieniu od
                            klasycznych dysków HDD nie ma ruchomych części, dlatego też działa niezwykle cicho i sprawia
                            że laptop zużywa mniej energii.</li>
                    </ul>
                <br>
                    <p style="text-align: left !important" class="laptop_p2">*dane na podstawie testów przykładowych dysków</p>
                </div>
                <div class="chart-container">
                    <div class="legend">
                        <div class="legend-item">
                            <div class="legend-color read-color"><p class="false">.</p></div>
                            <div class="legend-label">Szybkość odczytu (MB/s)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color write-color"><p class="false">.</p></div>
                            <div class="legend-label">Szybkość zapisu (MB/s)</div>
                        </div>
                    </div>
    <div class="chart">
        <div class="axis-y">
            <div class="legend-label">600</div>
            <div class="legend-label">500</div>
            <div class="legend-label">400</div>
            <div class="legend-label">300</div>
            <div class="legend-label">200</div>
            <div class="legend-label">100</div>
            <div class="legend-label">0</div>
        </div>
        <div class="grid-lines">
            <div class="grid-line bottom-0">
                <p class="false">.</p>
            </div>
            <div class="grid-line bottom-16">
                <p class="false">.</p>
            </div>
            <div class="grid-line bottom-33">
                <p class="false">.</p>
            </div>
            <div class="grid-line bottom-50">
                <p class="false">.</p>
            </div>
            <div class="grid-line bottom-66">
                <p class="false">.</p>
            </div>
            <div class="grid-line bottom-83">
                <p class="false">.</p>
            </div>
            <div class="grid-line bottom-100">
                <p class="false">.</p>
            </div>
        </div>
        <div class="bars">
            <div class="bar-group">
                <div class="bar bar-read" style="height: 85.33%;">
                    <p class="false">.</p>
                </div>
                <div class="bar bar-write" style="height: 82.66%;">
                    <p class="false">.</p>
                </div>
            </div>
            <div class="bar-group">
                <div class="bar bar-read" style="height: 28%;">
                    <p class="false">.</p>
                </div>
                <div class="bar bar-write" style="height: 24%;">
                    <p class="false">.</p>
                </div>
            </div>
        </div>
    </div>
                    <div class="labels">
                        <div class="label  shift-left">Dysk SSD</div>
                        <div class="label">Dysk HDD</div>
                    </div>
                </div>
            </div>
            <div class="laptop_section2 ${showWin11}">
                <div class="icon_container">
                    <img  onerror="this.onerror=null; this.src='../win-c.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/win-c.png" alt="Windows logo" class="rounded-img">
                </div>
                <div class="infoBoxes">
                    <h3 class="gradientFont laptop_h3">Zalety systemu Windows 11</h3>
                    <ul class="laptop_p">
                        <li>Windows 11 ma zupełnie <b>nowy interfejs użytkownika</b>, który zawiera odświeżoną wizualnie
                            paletę kolorów, zmodyfikowany pasek zadań, nowe ikony i elementy wizualne, a także zmiany w
                            menu Start.</li>
                        <li>Windows 11 ma <b>ulepszoną wydajność</b> w porównaniu do poprzednich wersji systemu.</li>
                        <li>Windows 11 wprowadza nowe funkcje i ulepszenia w zakresie <b>ochrony prywatności
                                użytkowników</b>. Na przykład system umożliwia bardziej szczegółową kontrolę dostępu
                            aplikacji do danych użytkownika.</li>
                    </ul>
                </div>
            </div>


             <div class="laptop_section2 ${showMacOS}">
                <div class="icon_container_mac">
                    <img onerror="this.onerror=null; this.src='../macOS.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/macOS.png" alt="macOS" class="rounded-img_mac">
                </div>
                <div class="infoBoxes">
                    <h3 class="gradientFont laptop_h3">macOS – Nowoczesny, Szybki i Bezpieczny</h3>
                    <p class="laptop_p"><b>System macOS</b> Charakteryzuje się eleganckim i intuicyjnym interfejsem,
                        <b>wysoką
                            wydajnością</b>
                        oraz niezawodnością. Oferuje płynną integrację z innymi urządzeniami Apple, takimi jak iPhone i
                        iPad, co umożliwia łatwe przesyłanie plików, <b>synchronizację danych</b> i korzystanie z
                        funkcji
                        takich jak Handoff czy AirDrop. System zapewnia także <b>wysoki poziom bezpieczeństwa</b> dzięki
                        wbudowanym mechanizmom <b>ochrony prywatności</b> oraz regularnym aktualizacjom. macOS obsługuje
                        szeroki wybór profesjonalnych aplikacji i narzędzi, co czyni go idealnym wyborem zarówno do
                        pracy, jak i codziennego użytkowania.
                    </p>
                </div>
            </div>

            <div class="laptop_section2 ${showWin10}">
                <div class="icon_container_win10 ">
                    <img onerror="this.onerror=null; this.src='../win10.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/win10.png" alt="Windows" class="rounded-img_mac">
                </div>
                <div class="infoBoxes">
                    <h3 class="gradientFont laptop_h3">Windows 10 – Szybki, Wszechstronny</h3>
                    <ul class="laptop_p">
                        <li>Rozbudowane, znajome menu Start zapewnia <b>szybki dostęp</b> do ulubionych funkcji</li>
                        <li><b>Szybkie i płynne działanie.</b> Obsługuje wszystko, czym dysponujesz</li>
                        <li>Dzięki zawsze włączonym aktualizacjom masz zapewnione najnowsze funkcje i zabezpieczenia
                        </li>
                        <li>Dołącz do domeny firmowej lub szkolnej i zyskaj dostęp do plików sieciowych, serwerów i
                            drukarek</li>
                        <li><b>Lepsze zabezpieczenia</b> dzięki szyfrowaniu danych i ochronie z funkcją BitLocker</li>
                    </ul>
                </div>
            </div>


            <div class="laptop_section2 column-reverse ${showLibre}">
                <div class="infoBoxes">
                    <h3 class="gradientFont laptop_h3">Twórz szybko i wygodnie</h3>
                    <p class="laptop_p">
                        <b>LibreOffice</b> to wolny, darmowy i wieloplatformowy pakiet biurowy o szerokich
                        możliwościach. Jest następcą OpenOffice używanym codziennie przez miliony osób na całym świecie.
                        Czytelne i wszechstronne narzędzia pozwolą Ci na wykorzystanie Twojego potencjału w pracy
                        biurowej i własnych projektach. Na pakiet LibreOffice składa się kilka programów, które razem
                        tworzą najlepsze wolne i darmowe rozwiązanie na rynku, a dzięki silnej społeczności stają się
                        one lepsze z każdą wydaną wersją. Należą do nich: <b>Writer</b> (edytor tekstu), <b>Calc</b>
                        (arkusze kalkulacyjne), <b>Impress</b> (prezentacje), <b>Draw</b> (diagramy i grafika
                        wektorowa), <b>Base</b> (bazy danych) i <b>Math</b> (formuły matematyczne), a także narzędzia na
                        Androida i online.
                    </p>
                </div>
                <div class="icon_container_libre">
                    <img class="rounded-img_mac" onerror="this.onerror=null; this.src='../libreOffice.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/libreOffice.png" alt="Windows logo"/>
                </div>
            </div>
            <div class="include-section">
                <h3 class="laptop_h2">W zestawie otrzymujesz</h3>
                <div class="laptop_additionalInfo3">
                    <div class="laptop_additionalInfo2">
                        <div id="includeW" class="laptop_additionalInfoBox include-wide ${showWin11}">
                            <img style="width: 60px; margin: 10px" onerror="this.onerror=null; this.src='../include-windows.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-windows.png" alt="Windows logo">
                            <h3 class="laptop_h3">Zainstalowany system operacyjny <b>${system}</b> gotowy do pracy
                                wraz z najnowszymi sterownikami</h3>
                        </div>
                        <div id="includeW" class="laptop_additionalInfoBox include-wide ${showWin10}">
                            <img style="width: 60px; margin: 10px"  onerror="this.onerror=null; this.src='../include-windows.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-windows.png" alt="Windows logo" >
                            <h3 class="laptop_h3">Zainstalowany system operacyjny <b>${system}</b> gotowy do pracy
                                wraz z najnowszymi sterownikami</h3>
                        </div>

                            <div id="includeW" class="laptop_additionalInfoBox include-wide ${showMacOS}">
                            <img onerror="this.onerror=null; this.src='../macOS_logo.webp';" src="/userdata/public/skins/shoper_basic_copy_8/assets/macOS_logo.webp" alt="Windows logo" class="icon-small">
                            <h3 class="laptop_h3">Zainstalowany system operacyjny <b>${system}</b> gotowy do pracy
                                wraz z najnowszymi sterownikami</h3>
                        </div>
                        
                        <div class="laptop_additionalInfo4">
                            <div id="includeL" class="laptop_additionalInfoBox include-narrow">
                                <img onerror="this.onerror=null; this.src='../include-laptop.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-laptop.svg" alt="Laptop" class="icon-medium">
                                <h3 class="laptop_h3">Laptopa zgodnego z poniższą specyfikacją</h3>
                            </div>
                            <div id="includeZ" class="laptop_additionalInfoBox include-narrow">
                                <img onerror="this.onerror=null; this.src='../include-plug.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-plug.svg" alt="Zasilacz" class="icon-medium">
                                <h3 class="laptop_h3">Sprawny, przetestowany zasilacz</h3>
                            </div>
                        </div>
                    </div>
                    <div id="includeB" class="laptop_additionalInfoBox include-very-narrow">
                        <h3 class="laptop_h3">Sprawną przetestowaną baterię</h3>
                        <img style="max-width: 100px; margin: 30px" onerror="this.onerror=null; this.src='../include-battery.png';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-battery.png" alt="bateria">
                    </div>
                    <div id="includeO" class="laptop_additionalInfoBox include-extra-wide ${showLibre}">
                        <h3 class="laptop_h3">
                            Zainstalowane darmowe oprogramowanie biurowe
                            <div>
                                <p style="font-size: 30px !important" class="gradientFont large-text">LibreOffice</p>
                            </div>

                            pozwalające np. na edycję dokumentów, tworzenie arkuszy kalkulacyjnych czy prezentacji
                        </h3>
                    </div>
                </div>
            </div>
            <h2 class="laptop_h2">Stan</h2>
            <div class="grade-section">
                <div class="laptop_gradeBox">
                    <div class="iconBox">
                        <img class="laptop_icon2" onerror="this.onerror=null; this.src='../include-keyboard2.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-keyboard2.svg" />
                    </div>
                    <h3 class="laptop_h3 grade_h3">Klawiatura</h3>
                    <p class="laptop_p2 grade_p">${keyboard}<br> ${additionalInfo_keyboard}
                    </p>
                </div>
                <div class="laptop_gradeBox">
                    <img class="laptop_icon2" onerror="this.onerror=null; this.src='../include-grade2.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-grade2.svg" />
                    <h3 class="laptop_h3 grade_h3" >Stan Wizualny</h3>
                    <p class="laptop_p2 grade_p">${grade}<br> ${additionalInfo_case}</p>
                </div>
                <div class="laptop_gradeBox">
                    <img class="laptop_icon2" onerror="this.onerror=null; this.src='../include-matrixGrade2.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-matrixGrade2.svg" />
                    <h3 class="laptop_h3 grade_h3">Matryca</h3>
                    <p class="laptop_p2 grade_p">${matrixDescription}<br> ${additionalInfo_matrix}</p>
                </div>
                <div class="laptop_gradeBox">
                    <img class="laptop_icon2" onerror="this.onerror=null; this.src='../include-battery2.svg';" src="/userdata/public/skins/shoper_basic_copy_8/assets/include-battery2.svg" />
                    <h3 class="laptop_h3 grade_h3">Bateria</h3>
                    <p class="laptop_p2 grade_p">${battery}</p>
                </div>
            </div>

    ${showWin10 ? `
            <div class="laptop_win10Info ${showWin10}">
                <p class="laptop_p">
                    ❗<b>UWAGA</b>❗ To urządzenie zawiera system operacyjny <b>Windows 10</b> i nie kwalifikuje się do
                    aktualizacji do systemu Windows 11. <b>Po 14 października 2025 r. firma Microsoft nie będzie już
                        zapewniać standardowego wsparcia dla systemu Windows 10.</b> Twój komputer będzie nadal działał,
                    a Ty możesz kwalifikować się do subskrypcji rozszerzonych aktualizacji zabezpieczeń (ESU) firmy
                    Microsoft. ESU zapewnia ograniczone krytyczne aktualizacje, patrz
                    https://www.microsoft.com/windows/end-of-support.
                </p>
            </div>
            ` : ''}

    ${showWin11info ? `
        <div class="laptop_win10Info">
            <p class="laptop_p">
                Laptop został wydany wcześniej niż Windows 11, dlatego ten system <b>nie jest oficjalnie wspierany przez producenta</b>
                (producent wspiera tylko najnowszy sprzęt), jednak <b>laptop jest w pełni kompatybilny z tym systemem</b>
                i posiada wymagane do poprawnego działania szyfrowanie TPM 2.0 oraz UEFI. <b>Działa bez żadnych problemów</b>,
                umożliwiając pobieranie najnowszych sterowników oraz aktualizacji systemu. 
                Chcesz laptopa z zainstalowanym systemem Windows 10? Nie ma problemu, napisz w "uwagach do sprzedającego" podczas składania zamówienia.
            </p>
        </div>
    ` : ''}

            <div class="circle"></div>
        </div>
    </div>

    <style>
        * {
            font-family: "Poppins", serif;
            font-style: normal;
        }

        /* Wspólne klasy */

        .false, .laptop_HDD, .display_nie{
        display: none !important
        }
        .flex-center-column {
            display: flex;
            align-items: center;
            flex-direction: column;
        }

        .content-wrapper {
            max-width: 1200px;
            width: 100%;
        }

        .section-spacing {
            margin: 30px 0;
        }

        .flex-section {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 1rem;
        }

        /* Sekcje */
        .laptop_additionalInfo {
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            background-color: #d8ebf86e;
        }

        .features-section,
        .grade-section {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            padding: 10px;
            margin-bottom: 20px !important;
        }

        .laptop_featureBox {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-radius: 10px;
            padding: 10px;
            width: 200px;
            height: 200px;
        }

        .laptop_gradeBox {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-radius: 10px;
            padding: 30px;
            width: 200px;
            min-height: 300px;
            background-color: #fbfbfd;
        }

        .laptop_section2 {
            margin-top: 15px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

            .icon_container_mac {
            min-width: 250px;
            width: 20%;
            flex-shrink: 0;
            flex-grow: 1;
            border-radius: 15px;
            display: flex;
            justify-content: right;
            align-items: end;
            background: linear-gradient(200deg, #a0addc 25%, #d8ebf8 100%);
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        }

        .icon_container_libre {
            min-width: 250px;
            width: 20%;
            flex-shrink: 0;
            flex-grow: 1;
            border-radius: 15px;
            display: flex;
            justify-content: left;
            align-items: end;
            background: linear-gradient(200deg, #93c782 25%, #f1f8d8 100%);
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        }
            .icon_container_win10 {
            min-width: 250px;
            width: 20%;
            flex-shrink: 0;
            flex-grow: 1;
            border-radius: 15px;
            display: flex;
            justify-content: right;
            align-items: end;
            background: linear-gradient(200deg, #a0c7dc 25%, #d8ebf8 100%);
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        }

            .rounded-img_mac {
            width: 92%;
            border-radius: 15px;
        }

        .laptop_section3 {
            display: flex;
            flex-wrap: wrap;
            margin-top: 50px;
            background: linear-gradient(200deg, #fbfbfb 0%, #f7fcfd 56%, #d8ebf8 100%);
            border-radius: 15px;
        }

        .column-reverse {
            flex-wrap: wrap-reverse;
        }

        /* Elementy informacyjne */
        .infoBoxes {
            width: 60%;
            background-color: #f7f7f7;
            padding: 30px;
            border-radius: 15px;
            flex-shrink: 0;
            flex-grow: 1;
        }

        .transparent-bg {
            background-color: transparent;
            width: 50%;
        }

        .iconBox {
            width: 150px;
            border-radius: 800px;
            display: flex;
            justify-content: center;
        }

        .laptop_icon {
            width: 90px;
            border-radius: 20px;
            box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
        }

        .laptop_icon2 {
            width: 60px;
        }

        /* Wykres */
        .chart-container {
            margin: 20px auto;
            width: 40%;
        }

        .chart {
            display: flex;
            min-height: 250px;
            position: relative;
        }

        .axis-y {
            width: 50px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-end;
            margin-right: 10px;
        }

        .grid-lines {
            position: absolute;
            top: 0;
            left: 60px;
            width: calc(100% - 60px);
            height: 100%;
            z-index: 0;
        }

        .grid-line {
            position: absolute;
            width: 100%;
            border-top: 2px solid #e8e8e8;
        }

        .bottom-0 {
            bottom: 0%;
        }

        .bottom-16 {
            bottom: 16.66%;
        }

        .bottom-33 {
            bottom: 33.33%;
        }

        .bottom-50 {
            bottom: 50%;
        }

        .bottom-66 {
            bottom: 66.66%;
        }

        .bottom-83 {
            bottom: 83.33%;
        }

        .bottom-100 {
            bottom: 100%;
        }

        .bars {
            display: flex;
            justify-content: space-around;
            flex-grow: 1;
            z-index: 100;
            align-items: flex-end;
        }

        .bar-group {
            display: flex;
            height: 100%;
            width: 100px;
            align-items: flex-end;
        }

        .bar {
            width: 40px;
            margin: 0 5px;
            align-self: flex-end;
            border-radius: 5px 5px 2px 2px;
        }

        .bar-read {
        background: linear-gradient(180deg, #3ec3e1 0%, #046d9a 100%);
        }

        .bar-write {
               background: linear-gradient(0deg, #65c4c5 0%, #92e7d3 100%);
        }

        .labels {
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
        }

        .label {
            text-align: center;
            width: 100px;
            color: #313131;
        }

        .shift-left {
            margin-left: 55px;
        }

        .legend {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            margin: 0 10px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50px;
            margin-right: 5px;
        }

        .read-color {
            background-color: #3ec3e1 
        }

        .write-color {
                background-color:  #92e7d3 ;
        }

        /* Sekcja "W zestawie otrzymujesz" */
        .include-section {
            text-align: center;
        }

        .laptop_additionalInfo2 {
            display: flex;
            gap: 15px;
            max-width: 75%;
            flex-wrap: wrap;
        }

        .laptop_additionalInfo3 {
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }

        .laptop_additionalInfo4 {
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 15px;
        }

        .laptop_additionalInfoBox {
            background-color: #fbfbfb;
            padding: 30px;
            border-radius: 20px;
            font-size: 20px;
            color: #3c3c3c;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .include-wide {
            width: 100%;
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
            background: linear-gradient(0deg, #f7f7f7 25%, #e7f5ff 100%);
            flex-direction: row;
        }

        .include-narrow {
            width: 40%;
            flex-direction: column;
            flex-shrink: 0;
            flex-grow: 1;
        }

        .include-very-narrow {
            width: 15%;
            flex-direction: column;
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
            background: linear-gradient(180deg, #f7f7f7 64%, rgba(88, 189, 62, 0.19) 100%);
        }

        .include-extra-wide {
            width: 93%;
            padding: 20px;
        }

        /* Ikony */
        .icon_container {
            min-width: 250px;
            width: 20%;
            flex-shrink: 0;
            flex-grow: 1;
            border-radius: 15px;
            display: flex;
            justify-content: center;
            align-items: end;
            background: linear-gradient(200deg, #a0c7dc 25%, #d8ebf8 100%);
            box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        }

        .icon_container2 {
            min-width: 250px;
            width: 20%;
            flex-shrink: 0;
            flex-grow: 1;
            border-radius: 15px;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
        }

        .rounded-img {
            width: 90%;
            border-radius: 15px;
        }

        .icon-small {
            height: 80px;
        }

        .icon-medium {
            width: 80px;
        }



        /* Tekst */
        .laptop_h2 {
            color: #313131;
            font-size: 35px;
            margin: 40px 0 40px 0;
            font-weight: 500;
            text-align: center;
        }

        .laptop_h3 {
            color: #313131;
            font-size: 17px;
            margin: 10px 0 0;
            font-weight: 500;
        }

        .laptop_h3_2 {
            color: #313131;
            font-size: 15px;
            margin: 10px 0 0;
            font-weight: 500;
            text-align: center;
        }
            .legend-label{
            font-size: 14px;
            color: #313131;
            }

        .laptop_p {
            font-size: 16px;
            color: #3c3c3c;
            text-align: justify;
            word-wrap: break-word;
            /* Działa w większości przeglądarek */
            overflow-wrap: break-word;
            word-break: break-word;
            /* Opcjonalnie */
        }
            .grade_p{
            font-size: 13px !important;
            color: #313131 !important;
            overflow-wrap: anywhere !important;
            }
            .grade_h3{
                font-size: 19px !important;
                color: black !important;
                font-weight: 500;
            }

        .laptop_p2 {
            font-size: 13px;
            line-height: 1.5;
            color: #717171;
            text-align: center;
        }

        .gradientFont {
            display: inline-block;
            font-size: 30px;
            background: linear-gradient(90deg, #24a5c2 0%, #046d9a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .gradientFont_green {
            font-size: 35px;
            background: linear-gradient(90deg, #313131 0%, #313131 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }

        .large-text {
            font-size: 40px !important;
            margin: 10px;
        }

        /* Informacja o Windows 10 */
        .laptop_win10Info {
            border-radius: 15px;
            padding: 30px;
            text-align: justify;
            background-color: #fff3f0;
        }

        /* Media Queries */
        @media (max-width: 840px) {

            #includeB,
            #includeZ,
            #includeL {
                width: 90% !important;
                max-width: 100vw !important;
            }

            .chart-container {
                width: 80% !important;
            }

            .laptop_additionalInfo2 {
                max-width: 95% !important;
            }

            #includeL,
            #includeZ {
                flex-shrink: 1 !important;
            }

            .column-reverse {
                flex-wrap: wrap-reverse !important;
            }

            .laptop_featureBox {
                width: 120px !important;
            }
        }

        @media (max-width: 600px) {

            .features-section,
            .grade-section {
                margin: 0 10px;

            }
        }
    </style>


`

export const batteryDescription: {
    [key: string]: string; // Indeks sygnatury
    "Bateria(1,5h)": string;
    "Bateria(2,5h)": string;
    "Bateria(2h)": string;
    "Bateria(3h)": string;
    "Bateria(5h)": string;
    "Nowa Bateria": string;
} = {
    "Bateria(1h)": "bateria- około 1 godziny pracy na baterii",
    "Bateria(1,5h)": "bateria- ok. 1,5 godziny pracy na baterii, zazwyczaj czas ten jest znacznie dłuższy.",
    "Bateria(2,5h)": "bateria- ok. 2,5 godziny pracy na baterii, zazwyczaj czas ten jest znacznie dłuższy.",
    "Bateria(2h)": "bateria- ok. 2 godziny pracy na baterii, zazwyczaj czas ten jest znacznie dłuższy.",
    "Bateria(3h)": "bateria- ok. 3 godziny pracy na baterii, zazwyczaj czas ten jest znacznie dłuższy.",
    "Bateria(5h)": "bateria- ok. 5 godzin pracy na baterii, zazwyczaj czas ten jest znacznie dłuższy.",
    "Nowa Bateria": "NOWA bateria",
};


export const matrixGradeDescriptios: {
    [key: string]: string;
    "Klasa A": string,
    "Klasa A-(duszki)": string,
    "Klasa A-(duszki+przetarcia)": string,
    "Klasa A-(przetarcia)": string
    "Klasa A-(ryski)": string
    "Stan bardzo dobry": string
} = {
    "Klasa A": "Klasa A",
    "Klasa A-(duszki)": " Klasa A- na matrycy występują delikatne przebarwienia, nie przeszkadzające w codziennej pracy",
    "Klasa A-(duszki+przetarcia)": " Klasa A- na matrycy występują delikatne przebarwienia i przetarcia, nie przeszkadzające w codziennej pracy",
    "Klasa A-(przetarcia)": " Klasa A- na matrycy występują delikatne przetarcia, nie przeszkadzające w codziennej pracy",
    "Klasa A-(ryski)": " Klasa A- na matrycy występują delikatne ryski, nie przeszkadzające w codziennej pracy",
    "Stan bardzo dobry": " Stan bardzo dobry"
};

export const GradeDescriptios: {
    [key: string]: string;
    "Bardzo dobry": string,
    "Bardzo dobry kat 2": string,
    "Dobry": string,
    "Dobry kat 2": string,
    "Klasa A": string
} = {
    "Bardzo dobry": "Bardzo dobry - posiadają normalne ślady użytkowania w postaci delikatnych rysek, przetarć na obudowie.",
    "Bardzo dobry kat 2": "Bardzo dobry - posiadają normalne ślady użytkowania w postaci rysek, przetarć na obudowie.",
    "Dobry": "Dobry - posiadają ślady użytkowania w postaci rysek, zadrapań, wgniotek na obudowie",
    "Dobry kat 2": "Dobry - posiadają ślady użytkowania w postaci licznych rysek, zadrapań, wgniotek na obudowie",
    "Klasa A": "Klasa A - stan bardzo dobry, minimalne ślady użytkowania"
};

export const keyboardDescription: {
    [key: string]: string;
    "QWERTY": string,
    "QWERTY_naklejki": string,
    "QWERTZ_naklejki": string
} = {
    "QWERTY": "QWERTY",
    "QWERTY_naklejki": "QWERTY(po zastosowaniu naklejek spolszczających)",
    "QWERTZ_naklejki": "QWERTY(po zastosowaniu naklejek spolszczających)"
};

import { batteryDescription, matrixGradeDescriptios } from "./laptopTemplate";

export const LaptopTemplateApilo = (
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
    cores: string,
    threads: string,
    frequency: string,
    frequency_turbo: string,
    matrixSize: string,
    matrixType: string,
    touchScreen: string,
    model: string,
    usb3: string,
    usb2: string,
    usbC: string,
    thunderbolt: boolean,
    miniJack: string,
    HDMI: boolean,
    LAN: boolean,
    reader: boolean,
    DP: boolean,
    dSUB: boolean,
    dockingPort: boolean,
    miniHDMI: boolean,
    miniDP: boolean,


) => `

<div class="hideElement" style="color: black">
    <div class="item item-6">
        <section class="text-item">
            <h2>${model}</h2>
            <p><strong>Cechy:</strong></p>
            <p>✅ Wydajny procesor <strong>${cpuModel}</strong></p>
            <p>✅ Karta Graficzna <strong>${gpu}</strong></p>
            <p>✅ Dysk półprzewodnikowy <strong>${diskSize} ${diskType}</strong></p>
            <p>✅ Pamięć operacyjna RAM <strong>${ramAmount} ${ramType}</strong></p>
            <p>✅ Zainstalowany <strong>${system}</strong></p>
            <p>✅ Matryca <strong>${screen}</strong></p>
            <p class="${showVebCam}">✅ Wbudowana <strong> kamerka Internetowa</strong>, idealna do zdalnej nauki czy
                wideokonferencji</p>
            <br />
            <p><strong>✔️ Laptop poleasingowy w bardzo dobrym stanie technicznym, dokładnie przetestowany przed wysyłką
                    i
                    gotowy do pracy</strong></p>
        </section>
    </div>
    <section class="section">
        <div class="item item-6">
            <span class=" ${showWin11}">
                Posiada zainstalowany ✔️ <b>oryginalny</b> system ✔️
                <b>${system} w polskiej wersji językowej,</b>
                wraz z ✔️<b>najnowszymi sterownikami,</b>
                <span class=" ${showLibre}">oprogramowaniem <b>biurowym</b></span>
                oraz dodatkową przeglądarką Internetową.
            </span>
            Laptop po rozpakowaniu z pudełka jest ✔️ <b>gotowy do pracy.</b>
    </section>

    <section class="section">
        <div class="item item-6">
            <section class="image-item"><img src="/3.jpg" alt="" /></section>
        </div>
        <div class="item item-6">
            <section class="text-item">
                <h2>Specyfikacja:</h2>
                <ul>
                    <li><strong>Procesor ${cpuModel}: </strong> ${cores} rdzenie ${threads} wątków, taktowanie
                        ${frequency}Ghz
                        w trybie
                        TURBO ${frequency_turbo}Ghz</li>
                    <li><strong> Pamięć RAM: </strong> ${ramAmount} ${ramType}</li>
                    <li><strong> Karta Graficzna:</strong> ${gpu}</li>
                    <li><strong> Dysk:</strong> ${diskSize} ${diskType}</li>
                    <li><strong> Układ klawiatury: </strong> ${keyboard} ${additionalInfo_keyboard}</li>
                    <li><strong> Stan Wizualny: </strong> ${grade} ${additionalInfo_case} </li>
                    <li><strong> Matryca: </strong> ${matrixDescription} ${additionalInfo_matrix}</li>
                    <li><strong> Typ ekranu: </strong>  ${touchScreen === 'tak' ? `<span class="touch-screen">ekran dotykowy</span>` : ''} ${matrixSize}
                        <span>matryca </span>${matrixType} ${screen}
                    </li>
                    <li><strong> System Operacyjny: Zainstalowany </strong><strong> ${system}</strong></li>
                    <li><strong> W komplecie zasilacz i </strong> <strong>bateria- </strong> ${battery} </li>
                </ul>
                <h2>Specyfikacja portów laptopa:</h2>
                <ul>
                    ${Number(usb3) > 0 ? `<li class="laptopStock">${usb3}x USB 3.0</li>` : ""}
                    ${Number(usb2) > 0 ? `<li class="laptopStock">${usb2}x USB 2.0</li>` : ""}
                    ${Number(usbC) > 0 ? `<li class="laptopStock">${usbC}x USB C</li>` : ""}
                    ${Number(miniJack) > 0 ? `<li class="laptopStock">${miniJack}x mini jack</li>` : ""}

                    ${thunderbolt ? `<li class="${thunderbolt}">thunderbolt</li>` : ""}
                    ${HDMI ? `<li class="${HDMI}">HDMI</li>` : ""}
                    ${LAN ? `<li class="${LAN}">LAN</li>` : ""}
                    ${reader ? `<li class="${reader}">Czytnik kart pamięci</li>` : ""}
                    ${DP ? `<li class="${DP}">displayPort</li>` : ""}
                    ${dSUB ? `<li class="${dSUB}">VGA (dSUB)</li>` : ""}
                    ${dockingPort ? `<li class="${dockingPort}">port dokujący</li>` : ""}
                    ${miniHDMI ? `<li class="${miniHDMI}">mini HDMI</li>` : ""}
                    ${miniDP ? `<li class="${miniDP}">mini displayPort</li>` : ""}

                </ul>
            </section>
        </div>
    </section>
    <section class="section">
        <div class="item item-6">
            <section class="text-item">
                <h2>Kupując na tej aukcji, otrzymujesz:</h2>
                <p>✔️ laptopa zgodnego z powyższą specyfikacją,</p>
                <p>✔️ sprawny, przetestowany zasilacz,</p>
                <p>✔️ sprawną przetestowaną baterię</p>
                <p>✔️ Zainstalowany system operacyjny <strong><strong>${system}</strong></strong>, gotowy do pracy wraz
                    z najnowszymi sterownikami</p>
                <p class="${showLibre}">✔️ Zainstalowane darmowe oprogramowanie biurowe <strong>LibreOffice</strong>,
                    pozwalające np. na edycję
                    dokumentów, tworzenie arkuszy kalkulacyjnych czy prezentacji</p>
            </section>
        </div>
    </section>
    <section class="section">
    </section>
    <section class="section">
        <div class="item item-6">
            <section class="text-item ${showLibre}">
                <h2>Twórz szybko i wygodnie</h2>
                <p><strong>LibreOffice</strong> to wolny, darmowy i wieloplatformowy pakiet biurowy o szerokich
                    możliwościach. Jest następcą OpenOffice używanym codziennie przez miliony osób na całym świecie.
                    Czytelne i wszechstronne narzędzia pozwolą Ci na wykorzystanie Twojego potencjału w pracy biurowej i
                    własnych projektach. Na pakiet LibreOffice składa się kilka programów, które razem tworzą najlepsze
                    wolne i darmowe rozwiązanie na rynku, a dzięki silnej społeczności stają się one lepsze z każdą
                    wydaną
                    wersją. Należą do nich: <strong>Writer</strong> (edytor tekstu), <strong>Calc</strong> (arkusze
                    kalkulacyjne), <strong>Impress</strong> (prezentacje), <strong>Draw</strong> (diagramy i grafika
                    wektorowa), <strong>Base</strong> (bazy danych) i <strong>Math</strong> (formuły matematyczne), a
                    także
                    narzędzia na Androida i online.</p>
            </section>
        </div>
    </section>
    <section class="section ${showWin11}">
        <div class="item item-6">
            <section class="text-item">
                <h2>Zalety Windowsa 11:</h2>
                <ul>
                    <li>Nowy bardziej spójny design</li>
                    <li>Układy okien na ekranie - czyli funkcja genialna</li>
                    <li>Funkcje ułatwiające produktywną pracę</li>
                    <li>Wsparcie dla aplikacji z Androida</li>
                    <li>Funkcje poprawiające wydajność</li>
                </ul>
            </section>
        </div>
    </section>


    <div class="item item-6 ${showWin10}" style="line-height: 1.2em;"> <br>
        <h2 style="line-height: 1.2em;">Windows 10 PRO</h2>
        <p style="line-height: 1.2em;">• Rozbudowane, znajome menu Start zapewnia szybki dostęp do ulubionych funkcji
        </p>
        <p style="line-height: 1.2em;">• Szybkie i płynne działanie. Obsługuje wszystko, czym dysponujesz</p>
        <p style="line-height: 1.2em;">• Dzięki zawsze włączonym aktualizacjom masz zapewnione najnowsze funkcje i
            zabezpieczenia</p>
        <p style="line-height: 1.2em;">• Dołącz do domeny firmowej lub szkolnej i zyskaj dostęp do plików sieciowych,
            serwerów i drukarek</p>
        <p style="line-height: 1.2em;">• Lepsze zabezpieczenia dzięki szyfrowaniu danych i ochronie z funkcją BitLocker
        </p>
        <p style="line-height: 1.2em;"> </p>
        <br>
        <p>UWAGA To urządzenie zawiera system operacyjny Windows 10 i nie kwalifikuje się do aktualizacji do systemu
            Windows
            11. Po 14 października 2025 r. firma Microsoft nie będzie już zapewniać standardowego wsparcia dla systemu
            Windows 10. Twój komputer będzie nadal działał, a Ty możesz kwalifikować się do subskrypcji rozszerzonych
            aktualizacji zabezpieczeń (ESU) firmy Microsoft. ESU zapewnia ograniczone krytyczne aktualizacje, patrz
            https://www.microsoft.com/windows/end-of-support.</p>
        <p> </p>
        <p style="line-height: 1.2em;"> </p>
        <br>
    </div>


    <section class="section laptop_${diskType}">
        <div class="item item-6">
            <section class="text-item">
                <h2>Dysk SSD</h2>
                <ul>
                    <li>To dysk półprzewodnikowy, dzięki niemu laptop działa znacznie szybciej. W odróżnieniu od
                        klasycznych
                        dysków HDD nie ma ruchomych części, dlatego też działa niezwykle cicho i sprawia że laptop
                        zużywa
                        mniej energii.</li>
                    <li>Dzięki SSD komputer jest gotów do pracy w ciągu kilku sekund i znacznie szybciej wykonuje różne
                        operacje, takie jak np. kopiowanie plików.</li>
                </ul>
            </section>
        </div>
    </section>
</div>

`
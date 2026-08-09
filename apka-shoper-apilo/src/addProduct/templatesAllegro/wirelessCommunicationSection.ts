type AllegroDescriptionItem =
  | { type: "IMAGE"; url: string }
  | { type: "TEXT"; content: string };

export type AllegroDescriptionSection = {
  items: AllegroDescriptionItem[];
};

const WIFI_IMAGE_URL =
  "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/samowifi.png";
const WIFI_BLUETOOTH_IMAGE_URL =
  "https://apilo-cs-06-prod.storage.googleapis.com/5cc91/public/custom/wifiBT.png";

const normalizeCommunicationValues = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.map((item) => String(item).trim().toLowerCase());
};

export const buildWirelessCommunicationSection = (
  communication: unknown,
): AllegroDescriptionSection | null => {
  const values = normalizeCommunicationValues(communication);
  const hasWifi = values.some(
    (value) => value === "wi-fi" || value === "wifi",
  );
  const hasBluetooth = values.some((value) => value === "bluetooth");

  if (!hasWifi) {
    return null;
  }

  const content = hasBluetooth
    ? `<h2>Łącz się bezprzewodowo!</h2>
       <p>Dzięki wbudowanemu WiFi i Bluetooth możesz:</p>
       <ul>
         <li><b>Pracować z dowolnego miejsca w domu</b> – bez uciążliwych kabli, które plączą się pod nogami. Streamuj filmy, przesyłaj duże pliki czy uczestnicz w wideokonferencjach z pełną swobodą ruchu.</li>
         <li><b>Łączyć się z ulubionymi urządzeniami</b> – słuchawki bezprzewodowe, myszka, klawiatura, głośniki, a nawet smartfon. Wszystko działa błyskawicznie i bez zakłóceń, dzięki nowoczesnym standardom łączności.</li>
         <li><b>Cieszyć się stabilnym internetem</b> – czy to podczas oglądania ulubionego serialu, grania w gry online, czy pracy zdalnej. WiFi zapewnia szybkie i nieprzerwane połączenie, nawet jeśli router znajduje się w drugim pokoju.</li>
       </ul>`
    : `<h2>Łącz się bezprzewodowo!</h2>
       <p>Dzięki wbudowanemu WiFi możesz:</p>
       <ul>
         <li><b>Pracować z dowolnego miejsca w domu</b> – bez uciążliwych kabli, które plączą się pod nogami. Streamuj filmy, przesyłaj duże pliki czy uczestnicz w wideokonferencjach z pełną swobodą ruchu.</li>
         <li><b>Cieszyć się stabilnym internetem</b> – czy to podczas oglądania ulubionego serialu, grania w gry online, czy pracy zdalnej. WiFi zapewnia szybkie i nieprzerwane połączenie, nawet jeśli router znajduje się w drugim pokoju.</li>
       </ul>`;

  return {
    items: [
      {
        type: "IMAGE",
        url: hasBluetooth ? WIFI_BLUETOOTH_IMAGE_URL : WIFI_IMAGE_URL,
      },
      {
        type: "TEXT",
        content,
      },
    ],
  };
};

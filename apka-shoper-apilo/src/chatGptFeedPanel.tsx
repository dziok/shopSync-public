import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from './config';
import { getApiErrorMessage } from './backendQueries/apiErrorMessage';
import './chatGptFeedPanel.css';

type PreviewRow = { item_id: string; title: string; brand: string; availability: string; price: string };
type FeedStatus = {
    generatedAt: string;
    hostedUrl?: string;
    hostedAt?: string;
    publicationError?: string;
    sourceUrl: string;
    total: number;
    sourceInStock?: number;
    exported: number;
    inStock?: number;
    outOfStock?: number;
    skipped: number;
    reasons: Record<string, number>;
    preview: PreviewRow[];
};

export default function ChatGptFeedPanel({ authToken }: { authToken: string }) {
    const [status, setStatus] = useState<FeedStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const headers = useMemo(() => ({ Authorization: `Bearer ${authToken}` }), [authToken]);

    useEffect(() => {
        let active = true;
        axios.get<FeedStatus | null>(`${API_URL}/chatgpt-feed/status`, { headers })
            .then((response) => { if (active) setStatus(response.data); })
            .catch((error) => { if (active) toast.error(getApiErrorMessage(error, 'Nie udało się pobrać stanu feedu.')); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [headers]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            const response = await axios.post<FeedStatus>(`${API_URL}/chatgpt-feed/refresh`, {}, { headers });
            setStatus(response.data);
            if (response.data.publicationError) {
                toast.warn(`CSV gotowy, ale publikacja w Cloudinary nie powiodła się: ${response.data.publicationError}`);
            } else {
                toast.success(`Feed opublikowany: ${response.data.exported} produktów.`);
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się pobrać lub przetworzyć feedu Shoper.'));
        } finally {
            setRefreshing(false);
        }
    };

    const download = async () => {
        setDownloading(true);
        try {
            const response = await axios.get<Blob>(`${API_URL}/chatgpt-feed/download`, { headers, responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'chatgpt-ads-feed.csv';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się pobrać pliku CSV.'));
        } finally {
            setDownloading(false);
        }
    };

    const copyPublicLink = async () => {
        try {
            if (!status?.hostedUrl) return;
            await navigator.clipboard.writeText(status.hostedUrl);
            toast.success('Skopiowano adres feedu.');
        } catch {
            toast.error('Nie udało się skopiować adresu.');
        }
    };

    return <main className="chatgpt-feed">
        <div className="chatgpt-feed__header">
            <div>
                <h2>Feed ChatGPT Ads</h2>
                {status && <p>Ostatnia aktualizacja: {new Date(status.generatedAt).toLocaleString('pl-PL')}</p>}
            </div>
            <div className="chatgpt-feed__actions">
                <button type="button" onClick={() => void refresh()} disabled={refreshing}>
                    {refreshing ? 'Pobieranie i konwersja...' : 'Pobierz z Shoper'}
                </button>
                <button type="button" className="chatgpt-feed__secondary" onClick={() => void download()} disabled={!status || refreshing || downloading}>
                    {downloading ? 'Pobieranie...' : 'Pobierz CSV'}
                </button>
            </div>
        </div>
        <p className="chatgpt-feed__source">Źródło: <a href="https://sklep315768.shoparena.pl/console/integration/execute/name/GoogleProductSearch/lang/pl_PL" target="_blank" rel="noreferrer">feed GoogleProductSearch Shoper</a></p>
        <section className="chatgpt-feed__public-link" aria-label="Publiczny adres feedu">
            <label htmlFor="chatgpt-feed-public-url">Publiczny adres feedu Cloudinary (.csv.gz)</label>
            <div className="chatgpt-feed__public-link-row">
                <input id="chatgpt-feed-public-url" readOnly value={status?.hostedUrl ?? ''} placeholder="Wygeneruj feed, aby otrzymać link" onFocus={(event) => event.currentTarget.select()} />
                <button type="button" onClick={() => void copyPublicLink()} disabled={!status?.hostedUrl}>Kopiuj link</button>
            </div>
            {status?.publicationError
                ? <p role="alert" className="chatgpt-feed__error">Nie udało się opublikować nowej wersji. {status.hostedUrl ? 'Link nadal wskazuje poprzednią wersję. ' : ''}{status.publicationError}</p>
                : <p>{status?.hostedAt ? `Opublikowano: ${new Date(status.hostedAt).toLocaleString('pl-PL')}. ` : ''}Link działa poza siecią lokalną. Plik jest aktualizowany codziennie o 04:00, gdy backend jest uruchomiony.</p>}
        </section>
        {loading ? <p>Ładowanie stanu feedu...</p> : status ? <>
            <div className="chatgpt-feed__stats">
                <span>W źródle <strong>{status.total.toLocaleString('pl-PL')}</strong></span>
                {typeof status.sourceInStock === 'number' && <span>Dostępne w źródle <strong>{status.sourceInStock.toLocaleString('pl-PL')}</strong></span>}
                <span>W CSV <strong>{status.exported.toLocaleString('pl-PL')}</strong></span>
                {typeof status.inStock === 'number' && <span>Dostępne w CSV <strong>{status.inStock.toLocaleString('pl-PL')}</strong></span>}
                {typeof status.outOfStock === 'number' && <span>Niedostępne <strong>{status.outOfStock.toLocaleString('pl-PL')}</strong></span>}
                <span>Pominięte <strong>{status.skipped.toLocaleString('pl-PL')}</strong></span>
            </div>
            {status.skipped > 0 && <details className="chatgpt-feed__reasons">
                <summary>Powody pominięcia produktów</summary>
                <ul>{Object.entries(status.reasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) =>
                    <li key={reason}><span>{reason}</span><strong>{count.toLocaleString('pl-PL')}</strong></li>)}</ul>
            </details>}
            <h3>Podgląd pierwszych produktów</h3>
            <div className="chatgpt-feed__table-wrap"><table>
                <thead><tr><th>ID</th><th>Produkt</th><th>Marka</th><th>Dostępność</th><th>Cena</th></tr></thead>
                <tbody>{status.preview.map((row) => <tr key={row.item_id}>
                    <td>{row.item_id}</td><td>{row.title}</td><td>{row.brand}</td>
                    <td>{row.availability === 'in_stock' ? 'Dostępny' : row.availability === 'out_of_stock' ? 'Niedostępny' : row.availability}</td>
                    <td>{row.price}</td>
                </tr>)}</tbody>
            </table></div>
        </> : <p>Nie ma jeszcze wygenerowanego feedu.</p>}
        <p className="chatgpt-feed__note">Wszystkie produkty w CSV mają stan „used”. Oficjalna integracja OpenAI Ads korzysta z przesyłania pliku przez SFTP; sprawdź, czy Twój panel akceptuje także adres URL feedu.</p>
    </main>;
}

import Echo from 'laravel-echo';
import windowPusher from 'pusher-js';

window.Pusher = windowPusher;

const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY || 'cashcontrol_local_key';
const reverbHost = import.meta.env.VITE_REVERB_HOST || '127.0.0.1';

let parsedPort = parseInt(import.meta.env.VITE_REVERB_PORT, 10);
if (isNaN(parsedPort)) {
    parsedPort = 8080;
}
const reverbPort = parsedPort;
const isHttps = (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https';

const backendApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1';

const echo = new Echo({
    broadcaster: 'reverb',
    key: reverbAppKey,
    wsHost: reverbHost,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS: isHttps,
    disableStats: true, 
    enabledTransports: ['ws', 'wss'],
    
    // Dejar que Echo/Pusher manejen la autorización internamente enviando nuestros headers
    authEndpoint: `${backendApiUrl}/broadcasting/auth`,
    auth: {
        headers: {
            'Accept': 'application/json',
            'X-User-Id': '1' // Header que lee tu MockAuthMiddleware
        }
    }
});

export default echo;

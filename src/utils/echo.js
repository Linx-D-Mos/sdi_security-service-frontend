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
    wsPath: import.meta.env.VITE_REVERB_PATH,
    forceTLS: false,

    // disableStats: false,
    enabledTransports: ['ws'],

    // Custom Authorizer usando fetch para mejor control y logeo extensivo
    authorizer: (channel, options) => {
        return {
            authorize: async (socketId, callback) => {
                const targetUrl = `${backendApiUrl}/api/v1/broadcasting/auth`;
                console.log(`[Pusher Authorizer] Intentando autorizar canal '${channel.name}' vía POST a: ${targetUrl}`);

                try {
                    const response = await fetch(targetUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-User-Id': 1,

                        },
                        body: JSON.stringify({
                            socket_id: socketId,
                            channel_name: channel.name
                        })
                    });

                    const responseText = await response.text();

                    if (!response.ok) {
                        console.error(`[Pusher Authorizer] Error HTTP ${response.status} en ${targetUrl}. Respuesta:`, responseText);
                        callback(new Error(`Server returned ${response.status}: ${responseText}`), { auth: '' });
                        return;
                    }

                    // Log para entender QUÉ está devolviendo el servidor en 200 OK
                    console.log(`[Pusher Authorizer] Servidor respondió 200 OK. Body crudo recibido: >${responseText}<`);

                    if (!responseText || responseText.trim() === '') {
                        console.error("[Pusher Authorizer] CRÍTICO: El servidor devolvió 200 OK pero el contenido estaba totalmente vacío. Esto indica un fallo en el backend (ej: middleware/Nginx interceptando sin data).");
                        callback(new Error("Empty response body from auth endpoint"), { auth: '' });
                        return;
                    }

                    const data = JSON.parse(responseText);
                    console.log(`[Pusher Authorizer] Autorización parser exitosa para ${channel.name}! Data:`, data);
                    callback(false, data);

                } catch (error) {
                    console.error('[Pusher Authorizer] Excepción nativa o JSON Invalido:', error);
                    callback(error, { auth: '' });
                }
            }
        };
    }
});

export default echo;

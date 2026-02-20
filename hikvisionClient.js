const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class HikVisionClient {
    constructor() {
        this.user = process.env.HIKVISION_USER;
        this.password = process.env.HIKVISION_PASSWORD;
        this.ip = process.env.HIKVISION_IP;
        this.port = process.env.HIKVISION_PORT || 80;
        this.baseUrl = `http://${this.ip}:${this.port}`;

        console.log(`\n--- INICIALIZANDO CLIENTE DS-K1T8003MF ---`);
        console.log(`URL: ${this.baseUrl}`);
        console.log(`Usuario: ${this.user}`);
        console.log(`------------------------------------------\n`);
    }

    md5(str) {
        return crypto.createHash('md5').update(str).digest('hex');
    }

    parseDigestHeader(header) {
        const details = {};
        const matches = header.matchAll(/(\w+)=["']?([^"',]+)["']?/g);
        for (const match of matches) {
            details[match[1]] = match[2];
        }
        return details;
    }

    createDigestHeader(method, path, authDetails) {
        const { realm, nonce, qop, opaque } = authDetails;
        const nc = '00000001';
        const cnonce = crypto.randomBytes(8).toString('hex');
        const ha1 = this.md5(`${this.user}:${realm}:${this.password}`);
        const ha2 = this.md5(`${method.toUpperCase()}:${path}`);

        let responseValue;
        let header;

        if (qop && qop.includes('auth')) {
            const chosenQop = 'auth';
            responseValue = this.md5(`${ha1}:${nonce}:${nc}:${cnonce}:${chosenQop}:${ha2}`);
            header = `Digest username="${this.user}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${responseValue}", qop=${chosenQop}, nc=${nc}, cnonce="${cnonce}"`;
        } else {
            responseValue = this.md5(`${ha1}:${nonce}:${ha2}`);
            header = `Digest username="${this.user}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${responseValue}"`;
        }

        if (opaque) header += `, opaque="${opaque}"`;
        return header;
    }

    async request(method, path, body = null) {
        const url = `${this.baseUrl}${path}`;

        try {
            // Intento inicial para obtener el desafío (401)
            const initialRes = await axios({
                method,
                url,
                data: body,
                timeout: 5000,
                validateStatus: () => true
            });

            if (initialRes.status === 401) {
                const wwwAuth = initialRes.headers['www-authenticate'];
                let authHeader = '';

                if (wwwAuth && wwwAuth.includes('Digest')) {
                    const authDetails = this.parseDigestHeader(wwwAuth);
                    authHeader = this.createDigestHeader(method, path, authDetails);
                } else {
                    authHeader = 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64');
                }

                console.log(`>>> ENVIANDO AUTORIZACIÓN PARA: ${path}`);
                const finalRes = await axios({
                    method,
                    url,
                    data: body,
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 10000,
                    validateStatus: () => true
                });

                return finalRes.data;
            }

            return initialRes.data;
        } catch (error) {
            console.error(`ERROR DE RED [${path}]:`, error.message);
            return null;
        }
    }

    async checkConnection() {
        const data = await this.request('GET', '/ISAPI/System/deviceInfo');
        if (data) {
            console.log('✅ DISPOSITIVO HIKVISION EN LÍNEA');
            return true;
        }
        return false;
    }

    async getUsers() {
        const path = '/ISAPI/AccessControl/UserInfo/Search?format=json';
        const body = {
            UserInfoSearchCond: {
                searchID: "1",
                searchResultPosition: 0,
                maxResults: 100
            }
        };
        const data = await this.request('POST', path, body);

        // El T8003 devuelve UserInfoSearch -> UserInfo
        if (data && data.UserInfoSearch && data.UserInfoSearch.UserInfo) {
            return data.UserInfoSearch.UserInfo;
        }

        // Fallbacks
        return data?.UserInfoSearchRet?.UserInfoList || data?.UserInfoList || [];
    }

    async getEvents(startTime, endTime) {
        const path = '/ISAPI/AccessControl/AcsEvent?format=json';

        // Usamos el rango sugerido por el usuario para asegurar que traiga todo
        const start = "2000-01-01T00:00:00-05:00";
        const end = new Date().toISOString().split('.')[0] + "-05:00"; // "now" formateado

        const body = {
            AcsEventCond: {
                searchID: "1",
                searchResultPosition: 0,
                maxResults: 100, // Subimos a 100 por si acaso
                major: 5,
                minor: 0,
                startTime: start,
                endTime: end
            }
        };

        console.log(`>>> BUSCANDO TODAS LAS HUELLAS (AcsEventCond)...`);
        const data = await this.request('POST', path, body);

        console.log('>>> RESPUESTA CRUDA DE EVENTOS:', JSON.stringify(data, null, 2));

        // EXTRAER LISTA: El T8003 devuelve AcsEvent -> InfoList
        const list = data?.AcsEvent?.InfoList ||
            data?.AcsEventSearchResult?.InfoList ||
            data?.InfoList || [];

        return list;
    }
}

const client = new HikVisionClient();

module.exports = {
    getEvents: (s, e) => client.getEvents(s, e),
    getUsers: () => client.getUsers(),
    checkConnection: () => client.checkConnection()
};

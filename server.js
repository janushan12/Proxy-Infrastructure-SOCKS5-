const net = require('net');
const dns = require('dns');
require('dotenv').config();

// Configuration
const PORT = process.env.PROXY_PORT;
const AUTH_USER = "admin";
const AUTH_PASS = "password123";

// Server
const server = net.createServer();

server.on("connection", (client) => {
    console.log(`Client connected: ${client.remoteAddress}`);

    let stage = 0;
    let target = null;

    client.on("data", (chunk) => {
        if (stage === 0) {
            if (chunk[0] !== 0x05) {
                client.end();
                return;
            }
            const Methods = chunk.slice(2, 2 + chunk[1]);
            const needsAuth = AUTH_USER && AUTH_PASS;

            if (needsAuth) {
                if (!Methods.includes(0x02)) {
                    console.log(`Client does not support username/password auth.`);
                    client.write(Buffer.from([0x05, 0xFF]));
                    client.end();
                    return;
                }
                client.write(Buffer.from([0x05, 0x02]));
                stage = 1;
            } else {
                client.write(Buffer.from([0x05, 0x00]))
                stage = 2;
            }
        } else if (stage === 1) {
            const ulen = chunk[1];
            const uname = chunk.slice(2, 2 + ulen).toString();
            const plen = chunk[2 + ulen];
            const pass = chunk.slice(3 + ulen, 3 + ulen + plen).toString();

            if (uname === AUTH_USER && pass === AUTH_PASS) {
                client.write(Buffer.from([0x01, 0x00]));
                stage = 2;
            } else {
                console.log("Authentication failed");
                client.write(Buffer.from([0x01, 0x01]));
                client.end();
            }
        } else if (stage === 2) {
            const cmd = chunk[1];
            if (cmd !== 0x01) {
                console.log("Only CONNECT command supported");
                client.end();
                return;
            }

            const atyp = chunk[3];
            let addr, port;
            if (atyp === 0x01) {
                addr = chunk.slice(4, 8).join(".");
                port = chunk.readUInt16BE(8);
            } else if (atyp === 0x03) {
                const len = chunk[4];
                addr = chunk.slice(5, 5 + len).toString();
                port = chunk.readUInt16BE(5 + len);
            } else {
                console.log("Unsupported ATYP");
                client.end();
                return;
            }
            console.log(`${client.remoteAddress} -> ${addr}:${port}`);
            target = net.createConnection({ host: addr, port: port }, () => {
                const reply = Buffer.from([
                    0x05, 0x00, 0x00, 0x01,
                    0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00
                ]);
                client.write(reply);

                client.pipe(target);
                target.pipe(client);
            });
            target.on("error", (err) => {
                console.log("Target connection error:", err.message);
                const reply = Buffer.from([0x05, 0x01, 0x00, 0x01, 0,0,0,0, 0,0]);
                client.write(reply);
                client.end();
            });
            stage = 3;
        }
    });
    client.on("error", (err) => console.log("Client error:", err.message));
});

server.listen(PORT, () => {
    console.log(`SOCKS5 proxy running on port ${PORT}`);
});
# Minimal SOCKS5 Proxy in Node.js

## Description
This is a minimal SOCKS5 proxy server implemented in Node.js using only standard libraries (`net`, `dns`). It supports:

- Username/password authentication
- TCP tunneling for HTTP and HTTPS
- IPv4 and domain name connections
- Logging of client connections

---

## How to Run

1. Install Node.js (v14+ recommended)
2. Clone this repository:

```bash
git clone https://github.com/janushan12/Proxy-Infrastructure-SOCKS5-.git
cd socks5-proxy
node server.js
```

---

## Example Test
Example test (e.g., using curl through the proxy to fetch https://ipinfo.io).
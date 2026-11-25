<div align="center">

# 📧 Email & Domain Validator API

<p>
  <strong>A fast, lightweight, zero-dependency REST API built with NestJS and TypeScript for real-time email address and domain validation.</strong>
</p>

<p>
  <img src="https://shields.io" alt="NestJS" />
  <img src="https://shields.io" alt="TypeScript" />
  <img src="https://shields.io" alt="Node.js" />
  <img src="https://shields.io" alt="RapidAPI Ready" />
  <img src="https://shields.io" alt="MIT License" />
</p>

<p>
  <a href="#-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-endpoints">API Endpoints</a> •
  <a href="#-security">RapidAPI Security</a>
</p>

</div>

<hr />

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>🔍 Syntax & Format Check</h3>
      <p>Instantly validates email addresses and domains against standard formatting rules before making any network calls.</p>
    </td>
    <td width="50%">
      <h3>🌐 Real-Time DNS / MX Lookup</h3>
      <p>Uses native Node.js <code>dns/promises</code> to verify that the domain exists and has active mail exchange (MX) servers.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🗑️ Disposable Email Detection</h3>
      <p>Blocks fake signups by identifying temporary and throwaway email providers (e.g., <code>10minutemail.com</code>, <code>tempmail.com</code>).</p>
    </td>
    <td width="50%">
      <h3>🏢 Free vs. Corporate Check</h3>
      <p>Distinguishes between free public webmail (e.g., <code>gmail.com</code>, <code>yahoo.com</code>) and B2B corporate domains.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>💡 Smart Typo Suggestions</h3>
      <p>Catches common domain typos (e.g., <code>gmial.com</code> → <code>gmail.com</code>) and returns a ready-to-use <code>didYouMean</code> suggestion.</p>
    </td>
    <td width="50%">
      <h3>⚡ Bulk Validation & Scoring</h3>
      <p>Validates up to <strong>50 emails concurrently</strong> in a single request and provides a <code>0–100</code> deliverability score.</p>
    </td>
  </tr>
</table>

<hr />

## 🚀 Getting Started

### Prerequisites

<ul>
  <li><strong>Node.js</strong> (v18 or higher)</li>
  <li><strong>npm</strong></li>
</ul>

### Installation

<ol>
  <li>
    <strong>Clone the repository:</strong>
    <pre><code>git clone https://github.com
cd email-validator-api</code></pre>
  </li>
  <li>
    <strong>Install dependencies:</strong>
    <pre><code>npm install</code></pre>
  </li>
  <li>
    <strong>Start the development server:</strong>
    <pre><code>npm run start:dev</code></pre>
  </li>
</ol>

<blockquote>
  💡 The API will be live and ready for local testing at <code>http://localhost:3000/v1</code>.
</blockquote>

<hr />

## 🔒 Security & Production Setup

This project includes a built-in NestJS Guard (<code>RapidApiGuard</code>) that verifies the <code>X-RapidAPI-Proxy-Secret</code> header on every incoming request, preventing unauthorized direct access to your server.

Set the following environment variables on your hosting provider:

```env
PORT=3000
RAPIDAPI_PROXY_SECRET=your_rapidapi_proxy_secret_key
```

Build and run in production mode:

```bash
npm run build
npm run start:prod
```

<blockquote>
  <strong>Note:</strong> When <code>RAPIDAPI_PROXY_SECRET</code> is omitted (such as during local development), the guard automatically allows all requests.
</blockquote>

<hr />

## 📡 API Endpoints

<p><strong>Base URL:</strong> <code>/v1</code></p>

### 1. Validate Single Email

<table>
  <tr>
    <td><strong>Method</strong></td>
    <td><code>GET</code></td>
  </tr>
  <tr>
    <td><strong>Endpoint</strong></td>
    <td><code>/v1/validate/email</code></td>
  </tr>
  <tr>
    <td><strong>Query Param</strong></td>
    <td><code>email</code> <em>(required)</em> — The email address to validate.</td>
  </tr>
</table>

<details>
  <summary><strong>Click to view Example Request & Response</strong></summary>
  <br />
  <p><strong>Request:</strong></p>
  <pre><code>curl "http://localhost:3000/v1/validate?email=john.doe@gmial.com"</code></pre>
  <p><strong>Response (<code>200 OK</code>):</strong></p>
  <pre><code>{
  "email": "john.doe@gmial.com",
  "isValidSyntax": true,
  "domain": "gmial.com",
  "hasMxRecords": true,
  "mxRecords": [
    "://gmial.com"
  ],
  "isDisposable": false,
  "isFreeProvider": false,
  "didYouMean": "john.doe@gmail.com",
  "score": 40,
  "isDeliverable": false
}</code></pre>
</details>

<br />

### 2. Bulk Email Validation

<table>
  <tr>
    <td><strong>Method</strong></td>
    <td><code>POST</code></td>
  </tr>
  <tr>
    <td><strong>Endpoint</strong></td>
    <td><code>/v1/validate/bulk</code></td>
  </tr>
  <tr>
    <td><strong>Body</strong></td>
    <td><code>application/json</code> — Array of up to 50 email strings under the <code>emails</code> key.</td>
  </tr>
</table>

<details>
  <summary><strong>Click to view Example Request & Response</strong></summary>
  <br />
  <p><strong>Request:</strong></p>
  <pre><code>curl -X POST "http://localhost:3000/v1/validate/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "contact@company.com",
      "temp@10minutemail.com",
      "invalid-email"
    ]
  }'</code></pre>
  <p><strong>Response (<code>200 OK</code>):</strong></p>
  <pre><code>{
  "total": 3,
  "results": [
    {
      "email": "contact@company.com",
      "isValidSyntax": true,
      "domain": "company.com",
      "hasMxRecords": true,
      "mxRecords": ["://company.com"],
      "isDisposable": false,
      "isFreeProvider": false,
      "didYouMean": null,
      "score": 100,
      "isDeliverable": true
    }
  ]
}</code></pre>
</details>

<br />

### 3. Validate Domain

<table>
  <tr>
    <td><strong>Method</strong></td>
    <td><code>GET</code></td>
  </tr>
  <tr>
    <td><strong>Endpoint</strong></td>
    <td><code>/v1/validate/domain</code></td>
  </tr>
  <tr>
    <td><strong>Query Param</strong></td>
    <td><code>domain</code> <em>(required)</em> — Domain name or full URL (automatically strips <code>http://</code>, <code>https://</code>, and <code>www.</code>).</td>
  </tr>
</table>

<details>
  <summary><strong>Click to view Example Request & Response</strong></summary>
  <br />
  <p><strong>Request:</strong></p>
  <pre><code>curl "http://localhost:3000/v1/validate/domain?domain=https://google.com"</code></pre>
  <p><strong>Response (<code>200 OK</code>):</strong></p>
  <pre><code>{
  "domain": "google.com",
  "isValidSyntax": true,
  "hasMxRecords": true,
  "mxRecords": [
    "://google.com"
  ],
  "isDisposable": false,
  "isFreeProvider": false,
  "canReceiveEmail": true
}</code></pre>
</details>

<hr />

<div align="center">
  <p>Built with ❤️ using <strong>NestJS</strong> • Licensed under the <strong>MIT License</strong></p>
</div>

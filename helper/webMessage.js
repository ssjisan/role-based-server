const webMessage = `
  <html>
    <head>
      <title>Server Status</title>
      <link rel="icon" href="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp">
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
        }
        .container {
          text-align: center;
        }
        img {
          width: 64px;
          height: 64px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <picture>
          <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp">
          <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀">
        </picture>
        <h2>Server is up and running!</h2>
      </div>
    </body>
  </html>
`;

module.exports = webMessage;

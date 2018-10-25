import { injectGlobal } from 'emotion';

injectGlobal(`
  html {
    height: 100%;
  }
  body {
    min-height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
  }
`);

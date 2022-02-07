# modelify

Modelify is a simple and ready to use application to alter your database.
The application requires an existing database to run.

### Usage

```js
import modelify from 'modelify';
import express from 'express';

modelify.run(YOUR_PORT_NUMBER, {
    host: 'localhost',
    database: 'modelify',
    user: 'root',
    password: '',
    logQueries: true,
}, express());
```
